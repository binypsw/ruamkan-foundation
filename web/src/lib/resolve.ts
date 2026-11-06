import type { Q } from './db';
import { queryOne } from './db';
import { notFound } from './http';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * พารามิเตอร์ :id / :projectId ของโครงการ รับได้ทั้ง UUID และรหัสโครงการ (เช่น "P01") · คืน UUID
 * ทุก route ที่รับโครงการต้องเรียกฟังก์ชันนี้ (ไม่พบ -> 404)
 */
export async function resolveProjectId(idOrCode: string, c?: Q): Promise<string> {
  if (UUID_RE.test(idOrCode)) return idOrCode.toLowerCase();
  const r = await queryOne<{ id: string }>('SELECT id FROM projects WHERE code = upper($1)', [idOrCode], c);
  if (!r) throw notFound('ไม่พบโครงการ');
  return r.id;
}
