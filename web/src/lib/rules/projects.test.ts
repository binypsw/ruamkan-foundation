import { describe, expect, it } from 'vitest';
import { toSatang } from '../decimal';
import {
  canApprove, canResubmit, checkDuration, checkResubmit, checkSupportTypes, checkTarget, checkVoucherTake,
  countAcceptedVouchers, distanceKm, endsAtFor, isAcceptingDonations, isReviewOverdue, missingStoryField, pct1,
  reviewDueAt, shouldReleaseVouching, withinVoucherRange,
} from './projects';

const d = (s: string) => new Date(s);
const K = 111.194926645;

describe('BR-01/02 เป้าเงิน (E14–E16)', () => {
  it('500,000 ผ่าน (E14)', () => expect(checkTarget(toSatang('500000'))).toBeNull());
  it('500,001 ไม่ผ่าน BR_01 (E15)', () => {
    const v = checkTarget(toSatang('500001'));
    expect(v?.code).toBe('BR_01_TARGET_MAX');
    expect(v?.message).toBe('เป้าเงินต้องอยู่ระหว่าง 1,000–500,000 บาท');
  });
  it('999 ไม่ผ่าน BR_02 / 1,000 และ 1,001 ผ่าน (E16)', () => {
    expect(checkTarget(toSatang('999'))?.code).toBe('BR_02_TARGET_MIN');
    expect(checkTarget(toSatang('999.99'))?.code).toBe('BR_02_TARGET_MIN');
    expect(checkTarget(toSatang('1000'))).toBeNull();
    expect(checkTarget(toSatang('1001'))).toBeNull();
  });
});

describe('BR-03 ระยะเวลา (E17)', () => {
  it('15 วัน=360 ผ่าน · 14 วัน=336 / 16 วัน=384 ไม่ผ่าน', () => {
    expect(checkDuration(360)).toBeNull();
    expect(checkDuration(720)).toBeNull();
    expect(checkDuration(72)).toBeNull();
    expect(checkDuration(336)?.code).toBe('BR_03_DURATION');
    expect(checkDuration(384)?.code).toBe('BR_03_DURATION');
    expect(checkDuration('720')?.code).toBe('BR_03_DURATION');
  });
});

describe('BR-04 เวลาเริ่มนับเมื่อ Active (E18/E19)', () => {
  it('P02 เริ่ม 11-04 10:00 + 72 ชม. = 11-07 10:00', () => {
    expect(endsAtFor(d('2026-11-04T10:00:00+07:00'), 72)?.toISOString()).toBe(d('2026-11-07T10:00:00+07:00').toISOString());
  });
  it('ขณะ pending ไม่มี ends_at', () => expect(endsAtFor(null, 720)).toBeNull());
});

describe('FR-05/10/13', () => {
  it('ไม่เลือกรูปแบบ → FR_05', () => {
    expect(checkSupportTypes(0)?.code).toBe('FR_05_NO_SUPPORT_TYPE');
    expect(checkSupportTypes(1)).toBeNull();
    expect(checkSupportTypes(5)).toBeNull();
  });
  it('ไม่มีเสียง/วิดีโอ ต้องตอบ 3 ข้อ', () => {
    expect(missingStoryField({ storyWhat: 'a', storyWhere: 'b', storyNeed: '' })?.field).toBe('storyNeed');
    expect(missingStoryField({ storyWhat: '', storyWhere: 'b', storyNeed: 'c' })?.field).toBe('storyWhat');
    expect(missingStoryField({ storyWhat: 'a', storyWhere: 'b', storyNeed: 'c' })).toBeNull();
  });
  it('มีเสียงหรือวิดีโอแล้ว ข้อความว่างได้', () => {
    expect(missingStoryField({ voiceUrl: '/api/files/x.webm' })).toBeNull();
    expect(missingStoryField({ videoUrl: '/api/files/x.mp4', storyWhat: '' })).toBeNull();
  });
});

describe('BR-13 ระยะผู้รับรอง (E46–E48)', () => {
  it('4.90 รับได้ · 5.00 รับได้ · 5.10 รับไม่ได้', () => {
    expect(withinVoucherRange(4.9)).toBe(true);
    expect(withinVoucherRange(5.0)).toBe(true);
    expect(withinVoucherRange(5.1)).toBe(false);
  });
  it('haversine ปัดเป็น 2 ตำแหน่ง ตรงค่า seed (P04 อยู่ที่ 14.0,100.0)', () => {
    expect(distanceKm(14.0, 100.0, 14.0 + 4.9 / K, 100.0)).toBe(4.9);
    expect(distanceKm(14.0, 100.0, 14.0 + 5.0 / K, 100.0)).toBe(5.0);
    expect(distanceKm(14.0, 100.0, 14.0 + 5.1 / K, 100.0)).toBe(5.1);
    expect(distanceKm(15.0, 101.0, 15.0 + 1.0 / K, 101.0)).toBe(1.0);
  });
  it('ค่าใกล้ขอบ: 5.004 ปัดเป็น 5.00 ยังรับได้ · 5.006 ปัดเป็น 5.01 รับไม่ได้', () => {
    expect(withinVoucherRange(distanceKm(14.0, 100.0, 14.0 + 5.004 / K, 100.0))).toBe(true);
    expect(withinVoucherRange(distanceKm(14.0, 100.0, 14.0 + 5.006 / K, 100.0))).toBe(false);
  });
});

describe('ลำดับตรวจรับงาน BR-14 → BR-13 → สถานะ (E48/E49)', () => {
  it('ญาติ (U10) ตอบ BR-14 ก่อน แม้ระยะและสถานะก็ไม่ผ่านด้วย', () => {
    const v = checkVoucherTake({ sameHousehold: true, distanceKm: 99, projectStatus: 'active' });
    expect(v?.code).toBe('BR_14_RELATIVE');
    expect(v?.httpStatus).toBe(422);
  });
  it('ไกล 5.10 → BR_13 แม้สถานะไม่ใช่ pending', () => {
    expect(checkVoucherTake({ sameHousehold: false, distanceKm: 5.1, projectStatus: 'active' })?.code).toBe('BR_13_TOO_FAR');
  });
  it('ไม่มีพิกัดบ้าน → BR_13', () => {
    expect(checkVoucherTake({ sameHousehold: false, distanceKm: null, projectStatus: 'pending' })?.code).toBe('BR_13_TOO_FAR');
  });
  it('ผ่านระยะ/ครัวเรือน แต่ไม่ pending → PROJECT_NOT_PENDING', () => {
    expect(checkVoucherTake({ sameHousehold: false, distanceKm: 4.9, projectStatus: 'active' })?.code).toBe('PROJECT_NOT_PENDING');
  });
  it('U07 4.90 / U08 5.00 ผ่านทั้งหมด', () => {
    expect(checkVoucherTake({ sameHousehold: false, distanceKm: 4.9, projectStatus: 'pending' })).toBeNull();
    expect(checkVoucherTake({ sameHousehold: false, distanceKm: 5.0, projectStatus: 'pending' })).toBeNull();
  });
  it('ข้อความตรงสัญญา', () => {
    expect(checkVoucherTake({ sameHousehold: false, distanceKm: 5.1, projectStatus: 'pending' })?.message).toBe('ผู้รับรองต้องอยู่ห่างไม่เกิน 5.0 กม.');
    expect(checkVoucherTake({ sameHousehold: true, distanceKm: 1, projectStatus: 'pending' })?.message).toBe('ผู้รับรองห้ามเป็นญาติหรืออยู่ครัวเรือนเดียวกับต้นเรื่อง');
  });
});

describe('BR-12 จำนวนผู้รับรอง (E50/E51)', () => {
  const sub = { status: 'submitted', distanceKm: 4.9, sameHousehold: false };
  it('ส่งผลแล้ว 1 คน (U07) ไม่ผ่าน · taken ไม่นับ', () => {
    const n = countAcceptedVouchers([sub, { status: 'taken', distanceKm: 5.0, sameHousehold: false }]);
    expect(n).toBe(1);
    expect(canApprove(n, 2)).toBe(false);
  });
  it('2 คน (U07 + U08 ส่งผล) ผ่าน · 3 คน ผ่าน', () => {
    const n = countAcceptedVouchers([sub, { status: 'submitted', distanceKm: 5.0, sameHousehold: false }]);
    expect(n).toBe(2);
    expect(canApprove(n, 2)).toBe(true);
    expect(canApprove(3, 2)).toBe(true);
  });
  it('ไม่นับ released / ครัวเรือนเดียวกัน / ไกลเกิน', () => {
    expect(countAcceptedVouchers([
      { status: 'released', distanceKm: 1, sameHousehold: false },
      { status: 'submitted', distanceKm: 1, sameHousehold: true },
      { status: 'submitted', distanceKm: 5.1, sameHousehold: false },
    ])).toBe(0);
  });
  it('FR-53 ปรับเกณฑ์เป็น 3', () => {
    expect(canApprove(2, 3)).toBe(false);
    expect(canApprove(3, 3)).toBe(true);
  });
});

describe('BR-15 ปล่อยงานผู้รับรอง (E52/E53)', () => {
  const taken = d('2026-11-03T10:00:00+07:00');
  it('วันที่ 2 / 3 ยังถือ · วันที่ 4 ปล่อย', () => {
    expect(shouldReleaseVouching(taken, d('2026-11-05T10:00:00+07:00'))).toBe(false);
    expect(shouldReleaseVouching(taken, d('2026-11-06T10:00:00+07:00'))).toBe(false);
    expect(shouldReleaseVouching(taken, d('2026-11-06T23:59:00+07:00'))).toBe(false);
    expect(shouldReleaseVouching(taken, d('2026-11-07T10:00:00+07:00'))).toBe(true);
  });
});

describe('BR-16/17 กำหนดตรวจ (E54–E56)', () => {
  it('ส่งอังคาร 11-03 09:00 → ครบสิ้นวันศุกร์ 11-06 ยังไม่เกินตอน 10:00 · เกินตอน 11-07 00:00 (E54)', () => {
    const due = reviewDueAt(d('2026-11-03T09:00:00+07:00'), false);
    expect(due.toISOString()).toBe('2026-11-06T16:59:59.999Z');
    expect(isReviewOverdue(d('2026-11-06T10:00:00+07:00'), due)).toBe(false);
    expect(isReviewOverdue(d('2026-11-06T23:59:59+07:00'), due)).toBe(false);
    expect(isReviewOverdue(d('2026-11-07T00:00:00+07:00'), due)).toBe(true);
  });
  it('ส่งวันศุกร์ 11-06 → กำหนดตรวจ พุธ 11-11 23:59 ข้ามเสาร์อาทิตย์ (E55)', () => {
    const due = reviewDueAt(d('2026-11-06T10:00:00+07:00'), false);
    expect(due.toISOString()).toBe(d('2026-11-11T23:59:59.999+07:00').toISOString());
  });
  it('ด่วน P10 ส่ง 11-05 10:00: 24:00 พอดียังไม่เกิน · 10:01 เกิน (E56)', () => {
    const due = reviewDueAt(d('2026-11-05T10:00:00+07:00'), true);
    expect(due.toISOString()).toBe(d('2026-11-06T10:00:00+07:00').toISOString());
    expect(isReviewOverdue(d('2026-11-06T10:00:00+07:00'), due)).toBe(false);
    expect(isReviewOverdue(d('2026-11-06T10:01:00+07:00'), due)).toBe(true);
  });
  it('BR-17: 23 ชม. / 24 ชม. ปกติ · 25 ชม. เกิน', () => {
    const sub = d('2026-11-05T10:00:00+07:00');
    const due = reviewDueAt(sub, true);
    expect(isReviewOverdue(new Date(sub.getTime() + 23 * 3600_000), due)).toBe(false);
    expect(isReviewOverdue(new Date(sub.getTime() + 24 * 3600_000), due)).toBe(false);
    expect(isReviewOverdue(new Date(sub.getTime() + 25 * 3600_000), due)).toBe(true);
  });
});

describe('BR-18 ส่งใหม่ (E57/E58)', () => {
  it('ครั้งที่ 1 (count 0) / ครั้งที่ 2 (count 1) ได้', () => {
    expect(canResubmit('rejected', 0)).toBe(true);
    expect(canResubmit('rejected', 1)).toBe(true);
  });
  it('ครั้งที่ 3 (count 2) ไม่ได้ ข้อความตรงสัญญา', () => {
    const v = checkResubmit('rejected', 2);
    expect(v?.code).toBe('BR_18_RESUBMIT_LIMIT');
    expect(v?.message).toBe('ส่งใหม่ได้ไม่เกิน 2 ครั้ง ปิดเรื่องแล้ว');
  });
  it('ไม่ใช่สถานะ rejected ส่งไม่ได้', () => {
    expect(canResubmit('pending', 0)).toBe(false);
    expect(canResubmit('active', 0)).toBe(false);
  });
});

describe('หลอดความคืบหน้า / BR-06', () => {
  it('pct1: 38,000/50,000 = 76.0 · จำกัดที่ 120', () => {
    expect(pct1(toSatang('38000'), toSatang('50000'))).toBe(76);
    expect(pct1(toSatang('9999'), toSatang('20000'))).toBe(50);
    expect(pct1(toSatang('70000'), toSatang('50000'))).toBe(120);
    expect(pct1(1, 3)).toBe(33.3);
    expect(pct1(5, 0)).toBe(0);
  });
  const base = { status: 'active', fundraisingState: 'open', endsAt: d('2026-11-07T10:00:00+07:00'), targetSatang: toSatang('30000'), paidSatang: toSatang('35970') };
  const now = d('2026-11-06T10:00:00+07:00');
  it('P02 ยังรับได้ (35,970 < 36,000)', () => expect(isAcceptingDonations(base, now)).toBe(true));
  it('ถึงเพดาน 120% ปิดรับ', () => expect(isAcceptingDonations({ ...base, paidSatang: toSatang('36000') }, now)).toBe(false));
  it('pending / ended / ถึง ends_at ปิดรับ', () => {
    expect(isAcceptingDonations({ ...base, status: 'pending' }, now)).toBe(false);
    expect(isAcceptingDonations({ ...base, fundraisingState: 'ended' }, now)).toBe(false);
    expect(isAcceptingDonations(base, d('2026-11-07T10:00:00+07:00'))).toBe(false);
  });
});
