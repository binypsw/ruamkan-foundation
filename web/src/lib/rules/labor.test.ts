import { describe, expect, it } from 'vitest';
import { bkkDateString, checkinLabel, isDateString, laborTier, loanDueDate, loanStatus, parseHours, pledgeCheck, signNeedToken, trackingNo, verifyNeedToken } from './labor';

describe('E72 ลงแรง BR-36', () => {
  it('7 ชม. ไม่ถึง / 8 ชม. Tier 3 / 9 ชม. Tier 3', () => {
    expect(laborTier(7)).toBe(0);
    expect(laborTier(7.99)).toBe(0);
    expect(laborTier(8)).toBe(3);
    expect(laborTier(9)).toBe(3);
  });
  it('parseHours', () => {
    expect(parseHours(8)).toBe(8);
    expect(parseHours('7.5')).toBe(7.5);
    expect(parseHours(0)).toBeNull();
    expect(parseHours(25)).toBeNull();
    expect(parseHours('abc')).toBeNull();
  });
});

describe('E61-E63 จองสิ่งของ BR-26', () => {
  it('ขาด 1: จอง 1 ได้ / 2 ไม่ได้ / ไม่เหลือ = เต็ม', () => {
    expect(pledgeCheck(1, 1)).toBe('ok');
    expect(pledgeCheck(2, 1)).toBe('exceed');
    expect(pledgeCheck(1, 0)).toBe('full');
  });
  it('ขาด 5: 4 / 5 ได้ 6 ไม่ได้', () => {
    expect(pledgeCheck(4, 5)).toBe('ok');
    expect(pledgeCheck(5, 5)).toBe('ok');
    expect(pledgeCheck(6, 5)).toBe('exceed');
  });
  it('tracking RK + 10 หลัก คงที่', () => {
    const id = 'c0000000-0000-4000-8000-000000000001';
    expect(trackingNo(id)).toMatch(/^RK\d{10}$/);
    expect(trackingNo(id)).toBe(trackingNo(id));
  });
});

describe('ยืม-คืน FR-37', () => {
  it('due = start + days', () => {
    expect(loanDueDate('2026-11-06', 7)).toBe('2026-11-13');
    expect(loanDueDate('2026-11-28', 5)).toBe('2026-12-03');
  });
  it('เลย due = overdue, ถึงวัน due ยังไม่เกิน, คืนแล้วคงเดิม', () => {
    expect(loanStatus('active', '2026-11-06', '2026-11-06')).toBe('active');
    expect(loanStatus('active', '2026-11-05', '2026-11-06')).toBe('overdue');
    expect(loanStatus('returned', '2026-11-01', '2026-11-06')).toBe('returned');
  });
  it('วันที่ไทย', () => {
    expect(bkkDateString(new Date('2026-11-06T10:00:00+07:00'))).toBe('2026-11-06');
    expect(bkkDateString(new Date('2026-11-06T00:30:00+07:00'))).toBe('2026-11-06');
    expect(isDateString('2026-02-30')).toBe(false);
    expect(isDateString('2026-11-06')).toBe(true);
  });
});

describe('QR เช็กอิน FR-36', () => {
  it('ลงนามและตรวจได้ / ปลอมไม่ผ่าน', () => {
    const t = signNeedToken('d0000000-0000-4000-8000-000000000001', 's');
    expect(verifyNeedToken(t, 's')).toBe('d0000000-0000-4000-8000-000000000001');
    expect(verifyNeedToken(t, 'other')).toBeNull();
    expect(verifyNeedToken('x.y', 's')).toBeNull();
    expect(checkinLabel(1, 2)).toBe('มาแล้ว 1/2 คน');
  });
});
