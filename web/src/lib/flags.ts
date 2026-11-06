import type { PoolClient } from 'pg';
import { query, queryOne } from './db';
import { now } from './clock';
import { audit } from './audit';
import { notify, notifyRole } from './notify';
import { bad, notFound, rule } from './http';
import { A4 } from '@/messages/a4';

/** BR-28: ร้องเรียนพร้อมหลักฐานจาก 5 บัญชีที่ต่างกันขึ้นไป = ระงับการเบิก */
export const FLAG_THRESHOLD = 5;
export const shouldSuspend = (distinctReporters: number): boolean => distinctReporters >= FLAG_THRESHOLD;

/** นับ DISTINCT reporter นับเฉพาะเรื่องหลังปลดระงับครั้งล่าสุด (ไม่ให้ร้องเรียนเก่าระงับซ้ำทันทีหลังปลด) */
export async function countDistinctReporters(c: PoolClient, projectId: string): Promise<number> {
  const r = await queryOne<{ n: number }>(
    `SELECT COUNT(DISTINCT f.reporter_id)::int AS n FROM flags f
      WHERE f.project_id = $1
        AND f.created_at >= COALESCE((SELECT MAX(a.at) FROM audit_log a WHERE a.project_id = $1 AND a.action = 'unfreeze'), '-infinity'::timestamptz)`,
    [projectId],
    c,
  );
  return r?.n ?? 0;
}

export interface FlagResult {
  flag: { id: string; projectId: string; evidenceUrl: string; reason: string | null; createdAt: string };
  distinctReporters: number;
  suspended: boolean;
}

/** ร้องเรียน: ล็อกแถวโครงการ FOR UPDATE ก่อนนับ แล้วระงับพร้อม audit + notify (ต้องเรียกใน tx) */
export async function recordFlag(
  c: PoolClient,
  p: { projectId: string; reporterId: string; evidenceUrl: unknown; reason?: unknown },
): Promise<FlagResult> {
  const evidence = typeof p.evidenceUrl === 'string' ? p.evidenceUrl.trim() : '';
  if (!evidence) throw bad('VALIDATION', A4.FLAG_NEED_EVIDENCE, { field: 'evidenceUrl' });
  const reason = typeof p.reason === 'string' && p.reason.trim() ? p.reason.trim().slice(0, 1000) : null;

  const proj = await queryOne<{ id: string; code: string; status: string; starter_id: string }>(
    'SELECT id, code, status, starter_id FROM projects WHERE id = $1 FOR UPDATE',
    [p.projectId],
    c,
  );
  if (!proj) throw notFound('ไม่พบโครงการ');
  if (!['active', 'suspended', 'closed'].includes(proj.status)) throw notFound('ไม่พบโครงการ');

  const at = await now(c);
  const ins = await query<{ id: string }>(
    'INSERT INTO flags (project_id, reporter_id, evidence_url, reason, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [proj.id, p.reporterId, evidence, reason, at],
    c,
  );
  const distinct = await countDistinctReporters(c, proj.id);
  let suspended = proj.status === 'suspended';
  if (proj.status === 'active' && shouldSuspend(distinct)) {
    const why = A4.suspendReason(distinct);
    await query("UPDATE projects SET status = 'suspended', frozen = true, suspend_reason = $2 WHERE id = $1", [proj.id, why], c);
    await audit(c, p.reporterId, 'freeze', proj.id, why);
    await notifyRole(c, 'staff', { kind: 'project_suspended', title: A4.flagNotifyTitle, body: A4.flagNotifyStaff(proj.code, distinct), projectId: proj.id });
    await notify(c, proj.starter_id, { kind: 'project_suspended', title: A4.flagNotifyTitle, body: A4.flagNotifyStarter, projectId: proj.id });
    suspended = true;
  }
  return {
    flag: { id: ins[0].id, projectId: proj.id, evidenceUrl: evidence, reason, createdAt: at.toISOString() },
    distinctReporters: distinct,
    suspended,
  };
}

/** FR-57: เจ้าหน้าที่ปลดระงับ (ต้องเรียกใน tx) */
export async function unsuspendProject(c: PoolClient, staffId: string, projectId: string, note?: unknown) {
  const proj = await queryOne<{ id: string; status: string; starter_id: string }>(
    'SELECT id, status, starter_id FROM projects WHERE id = $1 FOR UPDATE',
    [projectId],
    c,
  );
  if (!proj) throw notFound('ไม่พบโครงการ');
  if (proj.status !== 'suspended') throw rule('NOT_SUSPENDED', A4.NOT_SUSPENDED);
  await query("UPDATE projects SET status = 'active', frozen = false, suspend_reason = NULL WHERE id = $1", [proj.id], c);
  const n = typeof note === 'string' && note.trim() ? note.trim().slice(0, 1000) : null;
  await audit(c, staffId, 'unfreeze', proj.id, n ?? 'ปลดระงับหลังตรวจสอบเสร็จ');
  await notify(c, proj.starter_id, { kind: 'project_unsuspended', title: A4.unsuspendTitle, body: A4.unsuspendBody, projectId: proj.id });
  return queryOne<any>(
    'SELECT id, code, title, status, frozen, suspend_reason AS "suspendReason" FROM projects WHERE id = $1',
    [proj.id],
    c,
  );
}
