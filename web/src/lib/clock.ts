import { query, queryOne, Q } from './db';

/** นาฬิการะบบ (NFR-18): ทุกที่ที่ต้องการเวลาต้องเรียกที่นี่ ห้ามใช้ Date.now() / new Date() ตรง ๆ */
export const DEFAULT_NOW = '2026-11-06T10:00:00+07:00';

export async function now(client?: Q): Promise<Date> {
  const row = await queryOne<{ value: string }>("SELECT value FROM app_settings WHERE key = 'fixed_now'", [], client);
  return new Date(row?.value ?? DEFAULT_NOW);
}

export async function setNow(iso?: string | null, client?: Q): Promise<Date> {
  const v = iso ? new Date(iso) : new Date(DEFAULT_NOW);
  if (Number.isNaN(v.getTime())) throw new Error('INVALID_NOW');
  await query(
    "INSERT INTO app_settings(key, value) VALUES ('fixed_now', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [v.toISOString()],
    client,
  );
  return v;
}
