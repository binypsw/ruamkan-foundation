import type { Q } from './db';
import { query } from './db';
import { now } from './clock';

export type AuditAction =
  | 'approve' | 'reject' | 'release' | 'pay' | 'freeze' | 'unfreeze' | 'close' | 'refund' | 'staff_close' | 'config';

/** audit_log (NFR-09): ใคร/เมื่อไหร่/ทำอะไร ทุกการอนุมัติ ปลดล็อก ระงับ ปลดระงับ ต้องเรียก */
export async function audit(c: Q, actorId: string | null, action: AuditAction, projectId: string | null, detail?: string): Promise<void> {
  await query(
    'INSERT INTO audit_log (actor_id, action, project_id, detail, at) VALUES ($1,$2,$3,$4,$5)',
    [actorId, action, projectId, detail ?? null, await now(c)],
    c,
  );
}
