import { describe, expect, it } from 'vitest';
import {
  calcDonation, capacity, fitToCapacity, meetsMinimum, outcomeFor, receiptOverdue, refundWindow, tierFor, walletBalance,
} from './money';

const c = (amount: number, tip: boolean) => calcDonation({ amount, tip });

describe('E01-E13 คำนวณบริจาค', () => {
  it('E01 19 บาท ต่ำกว่าขั้นต่ำ', () => {
    expect(meetsMinimum(19)).toBe(false);
    expect(meetsMinimum(20)).toBe(true);
    expect(meetsMinimum('21.00')).toBe(true);
  });
  it('E02 20 ไม่ติ๊กทิป', () => {
    expect(c(20, false)).toEqual({ amount: '20.00', tip: '0.00', fee: '0.50', payable: '20.00', net: '19.50', tier: 0 });
  });
  it('E03 33 ติ๊กทิป', () => {
    expect(c(33, true)).toEqual({ amount: '33.00', tip: '1.65', fee: '0.83', payable: '34.65', net: '32.17', tier: 0 });
  });
  it('E04 49 ไม่ติ๊กทิป', () => {
    expect(c(49, false)).toEqual({ amount: '49.00', tip: '0.00', fee: '1.23', payable: '49.00', net: '47.77', tier: 0 });
  });
  it('E05 50 ไม่ติ๊กทิป', () => {
    expect(c(50, false)).toEqual({ amount: '50.00', tip: '0.00', fee: '1.25', payable: '50.00', net: '48.75', tier: 1 });
  });
  it('E06 50 ติ๊กทิป', () => {
    expect(c(50, true)).toEqual({ amount: '50.00', tip: '2.50', fee: '1.25', payable: '52.50', net: '48.75', tier: 1 });
  });
  it('E07 499 ติ๊กทิป ยัง Tier 1 แม้จ่ายรวม ≥ 500', () => {
    expect(c(499, true)).toEqual({ amount: '499.00', tip: '24.95', fee: '12.48', payable: '523.95', net: '486.52', tier: 1 });
  });
  it('E08 500 ติ๊กทิป', () => {
    expect(c(500, true)).toEqual({ amount: '500.00', tip: '25.00', fee: '12.50', payable: '525.00', net: '487.50', tier: 2 });
  });
  it('E09 1,000 ติ๊กทิป', () => {
    expect(c(1000, true)).toEqual({ amount: '1000.00', tip: '50.00', fee: '25.00', payable: '1050.00', net: '975.00', tier: 2 });
  });
  it('E10 1,999 ติ๊กทิป', () => {
    expect(c(1999, true)).toEqual({ amount: '1999.00', tip: '99.95', fee: '49.98', payable: '2098.95', net: '1949.02', tier: 2 });
  });
  it('E11 2,000 ติ๊กทิป', () => {
    expect(c(2000, true)).toEqual({ amount: '2000.00', tip: '100.00', fee: '50.00', payable: '2100.00', net: '1950.00', tier: 3 });
  });
  it('E12 บัญชีพัก 10,000 − 4,000 − 250', () => {
    expect(walletBalance({ in: 10000, out: 4000, fee: 250 })).toBe('5750.00');
  });
  it('E13 P01 บัญชีพัก 37,050.00 + net 975.00 = 38,025.00', () => {
    const r = c(1000, true);
    expect(r.net).toBe('975.00');
    // บัญชีพักหลังบริจาค = เดิม + amount − fee
    expect(walletBalance({ in: '38050.00', out: 0, fee: '25.00' })).toBe('38025.00');
  });
  it('BR-24 ขอบ tier ทุกจุด', () => {
    expect([49, 50, 499, 500, 1999, 2000].map((a) => tierFor(a))).toEqual([0, 1, 1, 2, 2, 3]);
  });
  it('BR-19 ทิป 1,000 → 50.00 · 50 → 2.50 · 33 → 1.65', () => {
    expect([1000, 50, 33].map((a) => c(a, true).tip)).toEqual(['50.00', '2.50', '1.65']);
  });
  it('รับสตริงเงินได้ และ P03 ค่าธรรมเนียม 9,999 → 249.98', () => {
    expect(calcDonation({ amount: '9999.00', tip: false }).fee).toBe('249.98');
  });
});

describe('E20-E26 เป้า เพดาน', () => {
  it('E20 ผลครบเวลา 49,999 / 50,000 / 50,001', () => {
    expect([49999, 50000, 50001].map((t) => outcomeFor('all_or_nothing', 50000, t))).toEqual(['failed', 'success', 'success']);
    expect(outcomeFor('flexible', 50000, 0)).toBe('success');
  });
  it('E21 P01 59,999 ยังรับได้ 1.00', () => {
    expect(capacity(50000, 59999)).toEqual({ ceiling: '60000.00', remaining: '1.00', closed: false });
  });
  it('E22 P01 60,000 และ 60,001 ปิดรับ', () => {
    expect(capacity(50000, 60000).closed).toBe(true);
    expect(capacity(50000, 60001)).toEqual({ ceiling: '60000.00', remaining: '0.00', closed: true });
  });
  it('E23 P02 เหลือ 30 บริจาค 29 รับเต็ม', () => {
    const cap = capacity(30000, 35970);
    expect(cap.remaining).toBe('30.00');
    expect(fitToCapacity(29, cap.remaining)).toEqual({ amount: '29.00', adjusted: false, excess: '0.00' });
  });
  it('E24 P02 บริจาค 30 รับเต็มแล้วปิดรับ', () => {
    expect(fitToCapacity(30, '30.00').adjusted).toBe(false);
    expect(capacity(30000, 36000).closed).toBe(true);
  });
  it('E25 P02 บริจาค 31 รับ 30 คืน 1.00', () => {
    expect(fitToCapacity(31, '30.00')).toEqual({ amount: '30.00', adjusted: true, excess: '1.00' });
  });
  it('E26 P02 ปิดรับแล้ว remaining 0', () => {
    expect(capacity(30000, 36000).remaining).toBe('0.00');
  });
});

describe('E27-E29 หน้าต่างเลือกคืนเงิน (BR-07)', () => {
  const closed = new Date('2026-10-30T10:00:00+07:00');
  it('E27 วันที่ 6 เลือกได้', () => {
    expect(refundWindow(closed, new Date('2026-11-05T10:00:00+07:00'))).toMatchObject({ day: 6, canChoose: true, autoRefund: false });
  });
  it('E28 วันที่ 7 เลือกได้ (วันนี้)', () => {
    const w = refundWindow(closed, new Date('2026-11-06T10:00:00+07:00'));
    expect(w).toMatchObject({ day: 7, canChoose: true, autoRefund: false });
    expect(w.deadline.toISOString()).toBe(new Date('2026-11-06T23:59:59.999+07:00').toISOString());
  });
  it('E29 วันที่ 8 คืนอัตโนมัติ', () => {
    expect(refundWindow(closed, new Date('2026-11-07T10:00:00+07:00'))).toMatchObject({ day: 8, canChoose: false, autoRefund: true });
  });
});

describe('E66-E67 ใบเสร็จ 1 วันทำการ (BR-22)', () => {
  it('E66 จ่ายพฤหัส 15:00: ศุกร์ยังไม่เกิน · เสาร์เกิน', () => {
    const paid = new Date('2026-11-05T15:00:00+07:00');
    expect(receiptOverdue(paid, new Date('2026-11-05T15:00:00+07:00'))).toBe(false);
    expect(receiptOverdue(paid, new Date('2026-11-06T23:59:00+07:00'))).toBe(false);
    expect(receiptOverdue(paid, new Date('2026-11-07T00:00:00+07:00'))).toBe(true);
  });
  it('E67 จ่ายศุกร์ 15:00: ถึงจันทร์ 11-09 ผ่าน · อังคารเกิน', () => {
    const paid = new Date('2026-11-06T15:00:00+07:00');
    expect(receiptOverdue(paid, new Date('2026-11-07T12:00:00+07:00'))).toBe(false);
    expect(receiptOverdue(paid, new Date('2026-11-09T23:59:00+07:00'))).toBe(false);
    expect(receiptOverdue(paid, new Date('2026-11-10T00:00:00+07:00'))).toBe(true);
  });
});
