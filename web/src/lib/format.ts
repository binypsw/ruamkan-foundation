/** ตัวช่วยจัดรูปแสดงผลภาษาไทย (ใช้ได้ทั้งเซิร์ฟเวอร์และเบราว์เซอร์) */
const TZ = 'Asia/Bangkok';

/** "1,050.00" จากสตริงเงิน */
export function fmtMoney(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '0.00';
  const s = typeof v === 'number' ? v.toFixed(2) : v;
  const [i, f = '00'] = s.split('.');
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${(f + '00').slice(0, 2)}`;
}
/** "1,050 บาท" (ตัดทศนิยมถ้าเป็น .00) */
export function fmtBaht(v: string | number | null | undefined): string {
  const m = fmtMoney(v);
  return `${m.endsWith('.00') ? m.slice(0, -3) : m} บาท`;
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '-';
  return new Intl.DateTimeFormat('th-TH', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
}
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '-';
  return new Intl.DateTimeFormat('th-TH', { timeZone: TZ, dateStyle: 'medium' }).format(new Date(d));
}

/** เวลาที่เหลือ: "เหลือ 24:00 ชม." (< 72 ชม.) · "เหลือ 13 วัน" · "หมดเวลาแล้ว" (FR-26) */
export function fmtTimeLeft(endsAt: string | Date | null | undefined, now: string | Date): string {
  if (!endsAt) return 'ยังไม่เริ่มนับเวลา';
  const ms = new Date(endsAt).getTime() - new Date(now).getTime();
  if (ms <= 0) return 'หมดเวลาแล้ว';
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  if (hours < 72) return `เหลือ ${String(hours).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')} ชม.`;
  return `เหลือ ${Math.ceil(hours / 24)} วัน`;
}

export const ROLE_LABEL: Record<string, string> = {
  starter: 'ต้นเรื่อง', helper: 'ผู้ช่วยเหลือ', voucher: 'ผู้รับรอง', staff: 'เจ้าหน้าที่', finance: 'ฝ่ายการเงิน', exec: 'ผู้บริหาร',
};
export const STATUS_LABEL: Record<string, string> = {
  pending: 'รอตรวจสอบ', active: 'เปิดรับ', suspended: 'ถูกระงับ', closed: 'ปิดแล้ว', rejected: 'ถูกปฏิเสธ',
};
export const SUPPORT_LABEL: Record<string, string> = {
  money: 'เงิน', item: 'สิ่งของ', labor: 'แรงคน', loan: 'ยืม', advocacy: 'เสียงสนับสนุน',
};
export const MILESTONE_LABEL: Record<string, string> = { locked: 'ล็อก', requested: 'ขอเบิก', approved: 'อนุมัติแล้ว', paid: 'จ่ายแล้ว' };
export const FUNDING_LABEL: Record<string, string> = { all_or_nothing: 'ครบเป้าถึงได้', flexible: 'ได้เท่าไหร่เอาเท่านั้น (Flexible)' };
