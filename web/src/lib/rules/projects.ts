/**
 * กฎโครงการ (A1) · pure function ไม่แตะฐานข้อมูล ไม่ import http
 * BR-01..04, 12..18 · ผู้เรียก (route/lib) แปลง Violation เป็น rule()/bad()
 */
import { fromSatang, mulDivHalfUp } from '../decimal';
import { addHours, businessDeadlineEnd, calendarDaysBetween } from './dates';
import { a1 } from '@/messages/a1';

export interface Violation {
  code: string;
  message: string;
}

export const MIN_TARGET_SATANG = 100_000;      // 1,000 บาท (BR-02)
export const MAX_TARGET_SATANG = 50_000_000;   // 500,000 บาท (BR-01)
export const DURATIONS = [360, 720, 72] as const; // 15 วัน / 30 วัน / 72 ชม. (BR-03)
export const MAX_RESUBMIT = 2;                 // BR-18
export const VOUCHER_MAX_KM = 5.0;             // BR-13
export const VOUCHER_RELEASE_DAY = 4;          // BR-15: วันที่ 4 ปล่อย (วันที่ 3 ยังถือ)
export const CAP_PERCENT = 120;                // BR-06

/** BR-01/02: เป้าเป็นสตางค์ ต้อง 1,000–500,000 บาท */
export function checkTarget(targetSatang: number): Violation | null {
  if (targetSatang > MAX_TARGET_SATANG) return { code: 'BR_01_TARGET_MAX', message: a1.err.targetRange };
  if (targetSatang < MIN_TARGET_SATANG) return { code: 'BR_02_TARGET_MIN', message: a1.err.targetRange };
  return null;
}

/** BR-03: 360 / 720 / 72 ชั่วโมงเท่านั้น */
export function checkDuration(hours: unknown): Violation | null {
  return (DURATIONS as readonly unknown[]).includes(hours) ? null : { code: 'BR_03_DURATION', message: a1.err.duration };
}

/** BR-04: ends_at = activated_at + duration_hours · ขณะ pending ไม่เริ่มนับ (null) */
export function endsAtFor(activatedAt: Date | null, durationHours: number): Date | null {
  return activatedAt ? addHours(activatedAt, durationHours) : null;
}

/** FR-05: เลือก 1–5 แบบ */
export function checkSupportTypes(count: number): Violation | null {
  return count >= 1 && count <= 5 ? null : { code: 'FR_05_NO_SUPPORT_TYPE', message: a1.err.noSupportType };
}

/** FR-10/13: ถ้าไม่มีเสียงและวิดีโอ ต้องตอบครบ 3 ข้อ · คืนชื่อฟิลด์แรกที่ขาด */
export function missingStoryField(s: {
  voiceUrl?: string | null; videoUrl?: string | null;
  storyWhat?: string | null; storyWhere?: string | null; storyNeed?: string | null;
}): { field: 'storyWhat' | 'storyWhere' | 'storyNeed'; message: string } | null {
  if (s.voiceUrl?.trim() || s.videoUrl?.trim()) return null;
  if (!s.storyWhat?.trim()) return { field: 'storyWhat', message: a1.err.storyWhat };
  if (!s.storyWhere?.trim()) return { field: 'storyWhere', message: a1.err.storyWhere };
  if (!s.storyNeed?.trim()) return { field: 'storyNeed', message: a1.err.storyNeed };
  return null;
}

/** BR-18: ส่งใหม่ได้ 2 ครั้ง (ใช้ครบแล้วส่งอีกไม่ได้) · E57/E58 */
export function checkResubmit(status: string, resubmitCount: number): (Violation & { httpStatus: number }) | null {
  if (status !== 'rejected') return { code: 'PROJECT_NOT_REJECTED', message: a1.err.notRejected, httpStatus: 422 };
  if (resubmitCount >= MAX_RESUBMIT) return { code: 'BR_18_RESUBMIT_LIMIT', message: a1.err.resubmitLimit, httpStatus: 422 };
  return null;
}
export const canResubmit = (status: string, resubmitCount: number): boolean => checkResubmit(status, resubmitCount) === null;

/** ระยะทาง haversine (R = 6371 กม.) ปัดเป็น 2 ตำแหน่ง (BR-13) */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
  return Math.round((km + Number.EPSILON) * 100) / 100;
}

/** BR-13: ห่างไม่เกิน 5.00 กม. (รวม 5.00) */
export const withinVoucherRange = (km: number): boolean => km <= VOUCHER_MAX_KM;

export interface VoucherTakeInput {
  sameHousehold: boolean;
  distanceKm: number | null;   // null = ผู้รับรองไม่มีพิกัดบ้าน
  projectStatus: string;
}

/** ลำดับตรวจรับงานรับรอง: BR-14 (ญาติ) → BR-13 (ระยะ) → สถานะโครงการ (E48/E49) */
export function checkVoucherTake(i: VoucherTakeInput): (Violation & { httpStatus: number }) | null {
  if (i.sameHousehold) return { code: 'BR_14_RELATIVE', message: a1.err.relative, httpStatus: 422 };
  if (i.distanceKm === null || !withinVoucherRange(i.distanceKm)) return { code: 'BR_13_TOO_FAR', message: a1.err.tooFar, httpStatus: 422 };
  if (i.projectStatus !== 'pending') return { code: 'PROJECT_NOT_PENDING', message: a1.err.notPendingForVoucher, httpStatus: 422 };
  return null;
}

export interface VouchingLite {
  status: string;
  distanceKm: number;
  sameHousehold: boolean;
}
/** ผู้รับรองที่นับได้: ส่งผลแล้ว (submitted) · ห่าง ≤ 5.00 กม. · ไม่ใช่ครัวเรือนเดียวกับต้นเรื่อง */
export function countAcceptedVouchers(v: VouchingLite[]): number {
  return v.filter((x) => x.status === 'submitted' && withinVoucherRange(x.distanceKm) && !x.sameHousehold).length;
}

/** BR-12 / FR-53: อนุมัติได้เมื่อผู้รับรองที่นับได้ ≥ required */
export const canApprove = (accepted: number, required: number): boolean => accepted >= required;

/** BR-15: ผู้รับรองที่รับงานแล้วไม่ส่งผล วันที่ 4 ปล่อย (วันที่ 3 ยังถือ) */
export function shouldReleaseVouching(takenAt: Date, now: Date): boolean {
  return calendarDaysBetween(takenAt, now) >= VOUCHER_RELEASE_DAY;
}

/** BR-16/17: กำหนดตรวจ = ด่วน ? ส่ง+24 ชม. : สิ้นวันทำการที่ 3 */
export function reviewDueAt(submittedAt: Date, urgent: boolean): Date {
  return urgent ? addHours(submittedAt, 24) : businessDeadlineEnd(submittedAt, 3);
}
/** เกินกำหนดเมื่อ now > due (ครบพอดี ยังไม่เกิน · E56) */
export const isReviewOverdue = (now: Date, due: Date): boolean => now.getTime() > due.getTime();

/** เปอร์เซ็นต์ทศนิยม 1 ตำแหน่ง ปัดครึ่งขึ้น จำกัดสูงสุด 120 (den = 0 → 0) */
export function pct1(num: number, den: number): number {
  if (den <= 0 || num <= 0) return 0;
  const tenths = mulDivHalfUp(num, 1000, den);
  return Math.min(tenths, CAP_PERCENT * 10) / 10;
}

/** BR-06: รับบริจาคได้เมื่อ active + open + ยังไม่ถึง ends_at + ยอดจ่ายแล้ว < 120% ของเป้า */
export function isAcceptingDonations(p: {
  status: string; fundraisingState: string; endsAt: Date | null; targetSatang: number; paidSatang: number;
}, now: Date): boolean {
  if (p.status !== 'active' || p.fundraisingState !== 'open') return false;
  if (!p.endsAt || now.getTime() >= p.endsAt.getTime()) return false;
  return p.paidSatang < mulDivHalfUp(p.targetSatang, CAP_PERCENT, 100);
}

export const moneyStr = (satang: number): string => fromSatang(satang);
