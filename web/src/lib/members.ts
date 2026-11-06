import type { Q } from './db';
import { query, queryOne, DATA_KEY } from './db';
import { maskIdCard } from './privacy';
import { notFound } from './http';
import type { PatchMeInput, RegisterInput } from './rules/members';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/** ตรวจรหัสผ่านใน SQL ด้วย pgcrypto crypt() · คืน user id หรือ null */
export async function verifyLogin(email: string, password: string): Promise<string | null> {
  const r = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE lower(email) = lower($1) AND password_hash = crypt($2, password_hash)',
    [email.trim(), password],
  );
  return r?.id ?? null;
}

export async function emailExists(email: string, c?: Q): Promise<boolean> {
  return !!(await queryOne('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email], c));
}

export async function createUser(i: RegisterInput, c?: Q): Promise<string> {
  const r = await queryOne<{ id: string }>(
    `INSERT INTO users (email, password_hash, role, display_name, consent_show_name, address_enc, province, home_lat, home_lng, household_id)
     VALUES ($1, crypt($2, gen_salt('bf', 6)), $3, $4, $5,
             CASE WHEN $6::text IS NULL THEN NULL ELSE pgp_sym_encrypt($6::text, $7) END, $8, $9, $10, $11)
     RETURNING id`,
    [i.email, i.password, i.role, i.displayName, i.consentShowName, i.address, DATA_KEY(), i.province, i.homeLat, i.homeLng, i.householdId],
    c,
  );
  return r!.id;
}

/** อัปเดตโปรไฟล์ (เฉพาะฟิลด์ที่ส่งมา) · คืน lineLinked ก่อนแก้ เพื่อให้ route รู้ว่าเพิ่งเชื่อมหรือไม่ */
export async function updateProfile(userId: string, p: PatchMeInput, c?: Q): Promise<{ wasLineLinked: boolean }> {
  const before = await queryOne<{ line_linked: boolean }>('SELECT line_linked FROM users WHERE id = $1', [userId], c);
  if (!before) throw notFound('ไม่พบผู้ใช้');
  const sets: string[] = [];
  const vals: unknown[] = [];
  const add = (col: string, v: unknown, cast = '') => { vals.push(v); sets.push(`${col} = $${vals.length}${cast}`); };
  if (p.displayName !== undefined) add('display_name', p.displayName);
  if (p.consentShowName !== undefined) add('consent_show_name', p.consentShowName);
  if (p.skills !== undefined) add('skills', p.skills, '::text[]');
  if (p.lineLinked !== undefined) add('line_linked', p.lineLinked);
  if (p.province !== undefined) add('province', p.province);
  if (p.homeLat !== undefined) add('home_lat', p.homeLat);
  if (p.homeLng !== undefined) add('home_lng', p.homeLng);
  if (p.address !== undefined) {
    if (p.address === null) sets.push('address_enc = NULL');
    else {
      vals.push(p.address);
      const a = vals.length;
      vals.push(DATA_KEY());
      sets.push(`address_enc = pgp_sym_encrypt($${a}::text, $${vals.length})`);
    }
  }
  if (sets.length) {
    vals.push(userId);
    await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals, c);
  }
  return { wasLineLinked: before.line_linked };
}

/** บันทึก KYC (เก็บเลขบัตรเข้ารหัส NFR-05) */
export async function saveKyc(userId: string, idCard: string, assistedBy: string | null, verifiedAt: Date, c?: Q): Promise<void> {
  await query(
    `INSERT INTO kyc_records (user_id, id_card_enc, id_card_last4, face_verified, assisted_by, verified_at)
     VALUES ($1, pgp_sym_encrypt($2::text, $3), $4, true, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET id_card_enc = EXCLUDED.id_card_enc, id_card_last4 = EXCLUDED.id_card_last4,
       face_verified = true, assisted_by = EXCLUDED.assisted_by, verified_at = EXCLUDED.verified_at`,
    [userId, idCard, DATA_KEY(), idCard.slice(-4), assistedBy, verifiedAt],
    c,
  );
}

export async function getKyc(userId: string): Promise<{ verified: boolean; verifiedAt: string | null; idCardMasked?: string }> {
  const r = await queryOne<{ face_verified: boolean; verified_at: Date | null; id_card: string | null }>(
    'SELECT face_verified, verified_at, pgp_sym_decrypt(id_card_enc, $2) AS id_card FROM kyc_records WHERE user_id = $1',
    [userId, DATA_KEY()],
  );
  if (!r || !r.face_verified) return { verified: false, verifiedAt: null };
  return {
    verified: true,
    verifiedAt: r.verified_at ? r.verified_at.toISOString() : null,
    idCardMasked: r.id_card ? maskIdCard(r.id_card) : undefined,
  };
}

/** ข้อมูลอ่อนไหวของผู้ใช้ (เฉพาะ staff/finance — route ตรวจบทบาท) · :id รับ UUID หรือรหัส U01 */
export async function getSensitive(idOrCode: string): Promise<{ address: string | null; idCard: string | null }> {
  const r = await queryOne<{ address: string | null; id_card: string | null }>(
    `SELECT CASE WHEN u.address_enc IS NULL THEN NULL ELSE pgp_sym_decrypt(u.address_enc, $2) END AS address,
            CASE WHEN k.id_card_enc IS NULL THEN NULL ELSE pgp_sym_decrypt(k.id_card_enc, $2) END AS id_card
       FROM users u LEFT JOIN kyc_records k ON k.user_id = u.id
      WHERE ${isUuid(idOrCode) ? 'u.id = $1::uuid' : 'u.code = upper($1)'}`,
    [idOrCode, DATA_KEY()],
  );
  if (!r) throw notFound('ไม่พบผู้ใช้');
  return { address: r.address, idCard: r.id_card };
}
