/**
 * กฎวันเวลา (BR-04, 07, 15, 16, 17, 22, 33) · เขตเวลา Asia/Bangkok (UTC+7 ไม่มี DST)
 * "วันทำการ" = จันทร์–ศุกร์ ไม่นับวันหยุดนักขัตฤกษ์ นับเริ่มวันถัดไป กำหนดถึงสิ้นวัน 23:59:59 (A-23)
 */
const H = 3600_000;
const DAY = 24 * H;
const BKK = 7 * H;

const bkk = (d: Date) => new Date(d.getTime() + BKK); // อ่านด้วย getUTC* = เวลาไทย
const startOfBkkDay = (d: Date) => {
  const b = bkk(d);
  return Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()) - BKK;
};

/** 0=อาทิตย์ .. 6=เสาร์ (ตามเวลาไทย) */
export const bkkWeekday = (d: Date): number => bkk(d).getUTCDay();
export const isBusinessDay = (d: Date): boolean => ![0, 6].includes(bkkWeekday(d));

/** จำนวนวันปฏิทิน (เวลาไทย) หลัง start: วันเดียวกัน = 0, วันถัดไป = 1 ... ("วันที่ N" ของ BR-07/15/33) */
export function calendarDaysBetween(start: Date, now: Date): number {
  return Math.round((startOfBkkDay(now) - startOfBkkDay(start)) / DAY);
}

/** สิ้นวัน 23:59:59.999 (เวลาไทย) ของวันที่ d */
export const endOfBkkDay = (d: Date): Date => new Date(startOfBkkDay(d) + DAY - 1);

/** กำหนดถึงสิ้นวันของวันทำการที่ n นับเริ่มวันถัดไป (BR-16 ใช้ n=3, BR-22 ใช้ n=1) */
export function businessDeadlineEnd(from: Date, n: number): Date {
  let cursor = startOfBkkDay(from);
  let left = n;
  while (left > 0) {
    cursor += DAY;
    if (isBusinessDay(new Date(cursor + 12 * H))) left--;
  }
  return new Date(cursor + DAY - 1);
}

export const addHours = (d: Date, h: number): Date => new Date(d.getTime() + h * H);
export const addDays = (d: Date, n: number): Date => new Date(d.getTime() + n * DAY);
/** เหลือเวลากี่มิลลิวินาที (ติดลบ = หมดเวลา) */
export const msLeft = (endsAt: Date, now: Date): number => endsAt.getTime() - now.getTime();
