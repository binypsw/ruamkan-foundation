import crypto from 'node:crypto';

/** BR-36: ลงแรง 1 วันทำงานเต็ม = 8 ชม. เทียบ Tier 3 */
export const LABOR_FULL_DAY_HOURS = 8;
export function laborTier(hours: number): 0 | 3 {
  return hours >= LABOR_FULL_DAY_HOURS ? 3 : 0;
}

/** ชั่วโมงจาก body: ตัวเลข 0 < h <= 24 (ทศนิยมไม่เกิน 2 ตำแหน่ง) หรือ null */
export function parseHours(v: unknown): number | null {
  const s = typeof v === 'number' ? String(v) : typeof v === 'string' ? v.trim() : '';
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= 24 ? n : null;
}

/** BR-26: ตัดสินการจอง (remaining = ที่ยังขาด) */
export function pledgeCheck(qty: number, remaining: number): 'ok' | 'full' | 'exceed' {
  if (remaining <= 0) return 'full';
  return qty <= remaining ? 'ok' : 'exceed';
}
export const isValidQty = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 1_000_000;

/** เลขติดตามพัสดุ: RK + ตัวเลข 10 หลักคงที่จาก id (FR-33) */
export function trackingNo(id: string): string {
  const h = crypto.createHash('sha256').update(id).digest('hex').slice(0, 12);
  return 'RK' + (parseInt(h, 16) % 10_000_000_000).toString().padStart(10, '0');
}

/** "X/Y" เช็กอิน (FR-36) */
export const checkinLabel = (x: number, y: number) => `มาแล้ว ${x}/${y} คน`;

/** วันที่ตามเวลาไทย YYYY-MM-DD ของเวลา d */
export function bkkDateString(d: Date): string {
  return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

/** วันครบกำหนด = วันเริ่ม + จำนวนวัน (FR-37) */
export function loanDueDate(start: string, days: number): string {
  const [y, m, d] = start.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
export const isDateString = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'))
  && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;

/** สถานะสัญญา: เลยกำหนด (due < วันนี้) และยังไม่คืน = overdue */
export function loanStatus(status: string, dueDate: string, today: string): 'active' | 'returned' | 'overdue' {
  if (status === 'returned') return 'returned';
  return dueDate < today ? 'overdue' : 'active';
}

/** โทเคน QR เช็กอิน: <needId>.<sig> */
export function signNeedToken(needId: string, secret: string): string {
  const sig = crypto.createHmac('sha256', secret).update('checkin:' + needId).digest('hex').slice(0, 24);
  return `${needId}.${sig}`;
}
export function verifyNeedToken(token: unknown, secret: string): string | null {
  if (typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const needId = token.slice(0, i);
  const expected = signNeedToken(needId, secret);
  if (token.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return null;
  return needId;
}
