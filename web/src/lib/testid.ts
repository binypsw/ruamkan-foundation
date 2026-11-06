/**
 * helper data-testid (NFR-19)
 * กติกาชื่อ: kebab-case `<หน้า/ส่วน>-<องค์ประกอบ>[-<รหัส>]` เช่น home-search-input, donate-submit, project-card-P01
 *  - ปุ่ม/ช่องกรอก/ลิงก์ทุกตัวต้องมี data-testid และมี accessible name (ข้อความ, aria-label หรือ <label>)
 *  - ผลลัพธ์/ข้อมูลสำคัญ: `<ส่วน>-<ชื่อ>` เช่น donate-total, wallet-balance
 *  - ข้อความ error: `<ฟิลด์หรือส่วน>-error` เช่น donate-amount-error, login-error
 * ใช้: <button {...tid('donate','submit')}>…</button>  หรือ  data-testid={tidOf('project-card', code)}
 */
const clean = (s: string | number) => String(s).toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '');

export const tidOf = (...parts: Array<string | number | undefined | null>): string =>
  parts.filter((p) => p !== undefined && p !== null && p !== '').map((p) => clean(p as string)).join('-');

export const tid = (...parts: Array<string | number | undefined | null>) => ({ 'data-testid': tidOf(...parts) });
