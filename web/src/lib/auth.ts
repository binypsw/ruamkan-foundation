import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { SessionUser } from '@/types';
import { queryOne } from './db';

export const SESSION_COOKIE = 'rk_session';
const secret = () => process.env.SESSION_SECRET ?? 'ruamkan-dev-session-secret';
const sign = (payload: string) => crypto.createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 32);

/** โทเคนเซสชันแบบไม่เก็บฐานข้อมูล: userId.expiresAtMs.signature (ไม่ใช้นาฬิการะบบของเว็บ เพราะเป็นเรื่องความปลอดภัยไม่ใช่กฎร้าน) */
export function makeSessionToken(userId: string): string {
  const exp = Date.now() + 7 * 24 * 3600_000; // eslint-disable-line -- อายุคุกกี้เท่านั้น ไม่ใช่เวลาตามกฎร้าน
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [id, exp, sig] = token.split('.');
  if (!id || !exp || !sig) return null;
  const expected = sign(`${id}.${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null; // eslint-disable-line
  return id;
}

export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const r = await queryOne<any>(
    `SELECT u.id, u.code, u.email, u.role, u.display_name, u.consent_show_name, u.skills, u.line_linked,
            COALESCE(k.face_verified, false) AS kyc
       FROM users u LEFT JOIN kyc_records k ON k.user_id = u.id WHERE u.id = $1`,
    [userId],
  );
  if (!r) return null;
  return {
    id: r.id, code: r.code, email: r.email, role: r.role, displayName: r.display_name,
    consentShowName: r.consent_show_name, kycVerified: r.kyc, skills: r.skills ?? [], lineLinked: r.line_linked,
  };
}

/** ผู้ใช้ปัจจุบันจากคุกกี้ (null = ยังไม่ล็อกอิน) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const id = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  return id ? loadSessionUser(id) : null;
}

export const sessionCookieOptions = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 7 * 24 * 3600 };
