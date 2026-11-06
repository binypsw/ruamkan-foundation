import { describe, expect, it } from 'vitest';
import { fromSatang, mulDivHalfUp, toSatang } from './decimal';
import { businessDeadlineEnd, calendarDaysBetween } from './rules/dates';

describe('lib กลาง', () => {
  it('ปัดครึ่งขึ้น: 49 × 2.5% = 1.23', () => {
    expect(fromSatang(mulDivHalfUp(toSatang('49.00'), 25, 1000))).toBe('1.23');
  });
  it('วันทำการ: ส่งอังคาร 11-03 → ครบสิ้นวันศุกร์ 11-06', () => {
    expect(businessDeadlineEnd(new Date('2026-11-03T09:00:00+07:00'), 3).toISOString()).toBe('2026-11-06T16:59:59.999Z');
  });
  it('วันที่ N: จบ 10-30 → 11-06 คือวันที่ 7', () => {
    expect(calendarDaysBetween(new Date('2026-10-30T10:00:00+07:00'), new Date('2026-11-06T10:00:00+07:00'))).toBe(7);
  });
});
