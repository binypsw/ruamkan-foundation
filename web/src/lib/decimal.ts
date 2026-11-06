/**
 * เงินคิดเป็นจำนวนเต็มสตางค์ · ห้าม float
 * ปัดครึ่งขึ้น (half-up) 2 ตำแหน่ง (A-13)
 */
export type Satang = number;

export function toSatang(v: string | number): Satang {
  const s = typeof v === 'number' ? v.toFixed(2) : String(v).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new Error(`รูปแบบเงินไม่ถูกต้อง: ${s}`);
  const neg = s.startsWith('-');
  const [i, f = ''] = s.replace('-', '').split('.');
  const n = parseInt(i, 10) * 100 + parseInt((f + '00').slice(0, 2), 10);
  return neg ? -n : n;
}

export function fromSatang(n: Satang): string {
  const neg = n < 0;
  const a = Math.abs(n);
  const s = `${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`;
  return neg ? `-${s}` : s;
}

/** satang × num / den ปัดครึ่งขึ้น (ค่าไม่ติดลบ) */
export function mulDivHalfUp(satang: Satang, num: number, den: number): Satang {
  return Math.floor((satang * num * 2 + den) / (den * 2));
}

export const addMoney = (a: string, b: string): string => fromSatang(toSatang(a) + toSatang(b));
export const subMoney = (a: string, b: string): string => fromSatang(toSatang(a) - toSatang(b));
export const cmpMoney = (a: string, b: string): number => Math.sign(toSatang(a) - toSatang(b));
