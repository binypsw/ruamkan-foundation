import { A3 } from '@/messages/a3';
import { bad, rule } from '../http';

export const REGISTER_ROLES = ['starter', 'helper', 'voucher'] as const;
export type RegisterRole = (typeof REGISTER_ROLES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** รหัสผ่านอย่างน้อย 8 ตัว */
export const isPasswordValid = (pw: unknown): boolean => typeof pw === 'string' && pw.length >= 8;

export const isEmailValid = (e: unknown): boolean => typeof e === 'string' && EMAIL_RE.test(e.trim()) && e.length <= 254;

export const normalizeEmail = (e: string): string => e.trim().toLowerCase();

/** เลขบัตรประชาชน: ตัวเลข 13 หลัก (ตัดขีด/ช่องว่างได้) -> คืนเฉพาะตัวเลข · ไม่ถูกต้อง throw 400 */
export function normalizeIdCard(v: unknown): string {
  const d = typeof v === 'string' ? v.replace(/[\s-]/g, '') : '';
  if (!/^\d{13}$/.test(d)) throw bad('VALIDATION', A3.idCardInvalid, { field: 'idCard' });
  return d;
}

/**
 * BR-31 / E60: ผู้ใช้ต้องสแกนหน้าเอง · คนช่วยกดเครื่อง (assistedBy) ทำได้ แต่สแกนหน้าแทนไม่ได้
 */
export function assertFaceScan(by: unknown): 'self' {
  if (by !== 'self' && by !== 'other') throw bad('VALIDATION', A3.faceByInvalid, { field: 'faceScannedBy' });
  if (by === 'other') throw rule('BR_31_FACE_BY_OTHER', A3.faceByOther);
  return 'self';
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role: RegisterRole;
  consentShowName: boolean;
  address: string | null;
  province: string | null;
  homeLat: number | null;
  homeLng: number | null;
  householdId: string | null;
}

const optText = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const optNum = (v: unknown, min: number, max: number, field: string): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw bad('VALIDATION', A3.latLngInvalid, { field });
  return n;
};

export function parseRegister(b: any): RegisterInput {
  if (!isEmailValid(b?.email)) throw bad('VALIDATION', A3.emailInvalid, { field: 'email' });
  if (!isPasswordValid(b?.password)) throw bad('VALIDATION', A3.passwordShort, { field: 'password' });
  const displayName = optText(b?.displayName);
  if (!displayName) throw bad('VALIDATION', A3.displayNameRequired, { field: 'displayName' });
  if (!REGISTER_ROLES.includes(b?.role)) throw bad('VALIDATION', A3.roleInvalid, { field: 'role' });
  return {
    email: normalizeEmail(b.email),
    password: b.password,
    displayName,
    role: b.role,
    consentShowName: b.consentShowName === true,
    address: optText(b.address),
    province: optText(b.province),
    homeLat: optNum(b.homeLat, -90, 90, 'homeLat'),
    homeLng: optNum(b.homeLng, -180, 180, 'homeLng'),
    householdId: optText(b.householdId),
  };
}

export interface PatchMeInput {
  displayName?: string;
  consentShowName?: boolean;
  skills?: string[];
  lineLinked?: boolean;
  address?: string | null;
  province?: string | null;
  homeLat?: number | null;
  homeLng?: number | null;
}

export function parsePatchMe(b: any): PatchMeInput {
  const o: PatchMeInput = {};
  if (b?.displayName !== undefined) {
    const n = optText(b.displayName);
    if (!n) throw bad('VALIDATION', A3.displayNameRequired, { field: 'displayName' });
    o.displayName = n;
  }
  if (b?.consentShowName !== undefined) o.consentShowName = b.consentShowName === true;
  if (b?.lineLinked !== undefined) o.lineLinked = b.lineLinked === true;
  if (b?.skills !== undefined) {
    if (!Array.isArray(b.skills) || b.skills.some((s: unknown) => typeof s !== 'string'))
      throw bad('VALIDATION', A3.skillsInvalid, { field: 'skills' });
    o.skills = [...new Set((b.skills as string[]).map((s) => s.trim()).filter(Boolean))];
  }
  if (b?.address !== undefined) o.address = optText(b.address);
  if (b?.province !== undefined) o.province = optText(b.province);
  if (b?.homeLat !== undefined) o.homeLat = optNum(b.homeLat, -90, 90, 'homeLat');
  if (b?.homeLng !== undefined) o.homeLng = optNum(b.homeLng, -180, 180, 'homeLng');
  return o;
}
