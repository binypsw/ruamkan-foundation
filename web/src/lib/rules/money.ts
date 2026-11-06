/**
 * กฎเงินกลางตัวเดียว (A2): BR-05..08, 19..24 · คิดด้วยจำนวนเต็มสตางค์ ปัดครึ่งขึ้น ห้าม float
 * ฟังก์ชันทุกตัวเป็น pure (ไม่แตะฐานข้อมูล/นาฬิกา) เพื่อทดสอบ unit ได้
 */
import { fromSatang, mulDivHalfUp, toSatang } from '../decimal';
import { addDays, businessDeadlineEnd, calendarDaysBetween, endOfBkkDay } from './dates';

export type MoneyIn = string | number;
export type Tier = 0 | 1 | 2 | 3;
export type FundingModeT = 'all_or_nothing' | 'flexible';

export const MIN_DONATION = '20.00'; // BR-23
export const FEE_RATE = { num: 25, den: 1000 } as const; // 2.5% ของยอดบริจาค (ไม่รวมทิป) BR-20
export const TIP_RATE = { num: 5, den: 100 } as const; // 5% ของยอดบริจาค BR-19
export const CEILING_RATE = { num: 120, den: 100 } as const; // BR-06
export const TIER_MIN = { 1: '50.00', 2: '500.00', 3: '2000.00' } as const; // BR-24
export const REFUND_CHOICE_DAYS = 7; // BR-07
export const QR_MINUTES = 15;

export interface DonationCalc {
  amount: string;
  tip: string;
  fee: string;
  payable: string;
  net: string;
  tier: Tier;
}

/** ระดับสิ่งตอบแทนจาก "ยอดบริจาคไม่รวมทิป" (BR-24, DA-02) */
export function tierFor(amount: MoneyIn): Tier {
  const s = toSatang(amount);
  if (s >= toSatang(TIER_MIN[3])) return 3;
  if (s >= toSatang(TIER_MIN[2])) return 2;
  if (s >= toSatang(TIER_MIN[1])) return 1;
  return 0;
}

export const feeOf = (amount: MoneyIn): string => fromSatang(mulDivHalfUp(toSatang(amount), FEE_RATE.num, FEE_RATE.den));
export const tipOf = (amount: MoneyIn): string => fromSatang(mulDivHalfUp(toSatang(amount), TIP_RATE.num, TIP_RATE.den));

/** คิดยอดบริจาค: tip 5% · fee 2.5% หักจากยอดโครงการ (ผู้บริจาคไม่จ่ายเพิ่ม) · net = amount − fee · tier ดูยอดไม่รวมทิป */
export function calcDonation(input: { amount: MoneyIn; tip: boolean }): DonationCalc {
  const a = toSatang(input.amount);
  const tip = input.tip ? mulDivHalfUp(a, TIP_RATE.num, TIP_RATE.den) : 0;
  const fee = mulDivHalfUp(a, FEE_RATE.num, FEE_RATE.den);
  return {
    amount: fromSatang(a),
    tip: fromSatang(tip),
    fee: fromSatang(fee),
    payable: fromSatang(a + tip),
    net: fromSatang(a - fee),
    tier: tierFor(a),
  };
}

/** ขั้นต่ำ 20 บาท (BR-23) */
export const meetsMinimum = (amount: MoneyIn): boolean => toSatang(amount) >= toSatang(MIN_DONATION);

/** เพดาน 120% ของเป้า: ceiling · remaining ที่ยังรับได้ · closed เมื่อ remaining = 0 (BR-06) */
export function capacity(target: MoneyIn, paidTotal: MoneyIn): { ceiling: string; remaining: string; closed: boolean } {
  const ceiling = mulDivHalfUp(toSatang(target), CEILING_RATE.num, CEILING_RATE.den);
  const remaining = Math.max(0, ceiling - toSatang(paidTotal));
  return { ceiling: fromSatang(ceiling), remaining: fromSatang(remaining), closed: remaining === 0 };
}

/** เกินเพดาน: รับเท่าที่เหลือ คืนส่วนเกิน (E25, DA-03) */
export function fitToCapacity(amount: MoneyIn, remaining: MoneyIn): { amount: string; adjusted: boolean; excess: string } {
  const a = toSatang(amount);
  const r = toSatang(remaining);
  if (a <= r) return { amount: fromSatang(a), adjusted: false, excess: '0.00' };
  return { amount: fromSatang(r), adjusted: true, excess: fromSatang(a - r) };
}

/** ผลของโครงการเมื่อปิดรับ: all_or_nothing ยอด ≥ เป้า = สำเร็จ (BR-05) · flexible สำเร็จเสมอ (BR-08) */
export function outcomeFor(mode: FundingModeT, target: MoneyIn, total: MoneyIn): 'success' | 'failed' {
  if (mode === 'flexible') return 'success';
  return toSatang(total) >= toSatang(target) ? 'success' : 'failed';
}

/** บัญชีพัก = เข้า − ออก − ค่าธรรมเนียม (BR-35) */
export function walletBalance(v: { in: MoneyIn; out: MoneyIn; fee: MoneyIn }): string {
  return fromSatang(toSatang(v.in) - toSatang(v.out) - toSatang(v.fee));
}

/** หน้าต่างเลือกคืนเงิน/กองทุนกลาง (BR-07): วันที่ 7 ยังเลือกได้ · วันที่ 8 ขึ้นไปคืนอัตโนมัติ */
export function refundWindow(closedAt: Date, now: Date): { day: number; canChoose: boolean; autoRefund: boolean; deadline: Date } {
  const day = calendarDaysBetween(closedAt, now);
  return {
    day,
    canChoose: day <= REFUND_CHOICE_DAYS,
    autoRefund: day > REFUND_CHOICE_DAYS,
    deadline: endOfBkkDay(addDays(closedAt, REFUND_CHOICE_DAYS)),
  };
}

/** ใบเสร็จเกินกำหนดเมื่อพ้นสิ้นวันของวันทำการที่ 1 หลังรับเงิน (BR-22) */
export function receiptOverdue(paidAt: Date, now: Date): boolean {
  return now.getTime() > businessDeadlineEnd(paidAt, 1).getTime();
}

/** ยอดจ่ายแล้วถึงเพดาน 120% (FR-64) */
export const reachedCeiling = (target: MoneyIn, paidTotal: MoneyIn): boolean => capacity(target, paidTotal).closed;
