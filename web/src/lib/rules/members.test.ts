import { describe, expect, it } from 'vitest';
import { assertFaceScan, isPasswordValid, normalizeIdCard, parsePatchMe, parseRegister } from './members';
import { AppError } from '../http';

const err = (fn: () => unknown): AppError => {
  try { fn(); } catch (e) { return e as AppError; }
  throw new Error('ไม่ throw');
};

describe('BR-31 / E60 สแกนหน้า', () => {
  it('สแกนเอง ผ่าน', () => expect(assertFaceScan('self')).toBe('self'));
  it('คนอื่นสแกนแทน 422 BR_31_FACE_BY_OTHER', () => {
    const e = err(() => assertFaceScan('other'));
    expect(e.status).toBe(422);
    expect(e.code).toBe('BR_31_FACE_BY_OTHER');
  });
  it('ค่าอื่น 400', () => expect(err(() => assertFaceScan('x')).status).toBe(400));
});

describe('เลขบัตร', () => {
  it('13 หลักผ่าน (ตัดขีดได้)', () => {
    expect(normalizeIdCard('1100100123456')).toBe('1100100123456');
    expect(normalizeIdCard('1-1001-00123-45-6')).toBe('1100100123456');
  });
  it('12 หรือ 14 หลัก หรือมีตัวอักษร ไม่ผ่าน', () => {
    for (const v of ['110010012345', '11001001234567', '11001001234ab', '', undefined, 1100100123456])
      expect(err(() => normalizeIdCard(v)).status).toBe(400);
  });
});

describe('รหัสผ่าน >= 8', () => {
  it('7 ไม่ผ่าน 8 ผ่าน', () => {
    expect(isPasswordValid('1234567')).toBe(false);
    expect(isPasswordValid('12345678')).toBe(true);
    expect(isPasswordValid(undefined)).toBe(false);
  });
});

describe('parseRegister', () => {
  const base = { email: ' New@Test.Local ', password: 'Test@1234', displayName: 'ทดสอบ', role: 'starter' };
  it('ปกติ: อีเมลเป็นตัวพิมพ์เล็ก ไม่ยินยอมโดยค่าเริ่มต้น', () => {
    const r = parseRegister(base);
    expect(r.email).toBe('new@test.local');
    expect(r.consentShowName).toBe(false);
  });
  it('บทบาทเจ้าหน้าที่สมัครเองไม่ได้', () => {
    expect(err(() => parseRegister({ ...base, role: 'staff' })).code).toBe('VALIDATION');
  });
  it('รหัสผ่านสั้น/อีเมลผิด/ไม่มีชื่อ', () => {
    expect(err(() => parseRegister({ ...base, password: 'short' })).status).toBe(400);
    expect(err(() => parseRegister({ ...base, email: 'abc' })).status).toBe(400);
    expect(err(() => parseRegister({ ...base, displayName: '  ' })).status).toBe(400);
  });
  it('พิกัดนอกช่วง', () => {
    expect(err(() => parseRegister({ ...base, homeLat: 120 })).status).toBe(400);
  });
});

describe('parsePatchMe', () => {
  it('ทักษะตัดซ้ำและช่องว่าง', () => {
    expect(parsePatchMe({ skills: [' ช่างไฟ ', 'ช่างไฟ', ''] }).skills).toEqual(['ช่างไฟ']);
  });
  it('ทักษะไม่ใช่ข้อความ 400', () => {
    expect(err(() => parsePatchMe({ skills: [1] })).status).toBe(400);
  });
});
