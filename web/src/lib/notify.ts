import type { Q } from './db';
import { query } from './db';
import { now } from './clock';

export interface NotifyInput {
  kind: string;                 // เช่น 'donation_paid' 'project_approved' 'project_closed'
  title: string;
  body: string;
  projectId?: string | null;
  channel?: 'line' | 'receipt' | 'system';
}

/**
 * ส่งข้อความ "LINE จำลอง" (FR-45, NFR-04): บันทึกลง notifications ทันที (ถึงผู้ใช้ภายใน 1 นาที = ทันที)
 * ผู้ใช้เห็นที่หน้า /notifications · ไม่เรียก API ภายนอก
 */
export async function notify(c: Q, userId: string, n: NotifyInput): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, channel, kind, title, body, project_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [userId, n.channel ?? 'line', n.kind, n.title, n.body, n.projectId ?? null, await now(c)],
    c,
  );
}

/** แจ้งทุกคนที่มีบทบาทนั้น (เช่น staff ทุกคน เมื่อมีงานรอตรวจ / ร้องเรียนถึงเกณฑ์) */
export async function notifyRole(c: Q, role: string, n: NotifyInput): Promise<void> {
  const rows = await query<{ id: string }>('SELECT id FROM users WHERE role = $1', [role], c);
  for (const r of rows) await notify(c, r.id, n);
}
