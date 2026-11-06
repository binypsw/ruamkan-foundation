/** ความเป็นส่วนตัว (BR-25, BR-30, NFR-06) */
export const ANONYMOUS_LABEL = 'ผู้ไม่ประสงค์ออกนาม';

/** ชื่อผู้บริจาคบนหน้าสาธารณะ: เฉพาะผู้ยินยอมเท่านั้น (BR-25) · donorId ว่าง/ไม่ยินยอม = ผู้ไม่ประสงค์ออกนาม */
export function donorLabel(consentShowName: boolean | null | undefined, displayName: string | null | undefined): string {
  return consentShowName && displayName ? displayName : ANONYMOUS_LABEL;
}

/** คอลัมน์ที่ห้ามออกหน้า/API สาธารณะ (BR-30): เลขบัตร ที่อยู่ละเอียด ประวัติรักษา */
export const SENSITIVE_COLUMNS = ['address_enc', 'id_card_enc', 'medical_enc', 'address_detail_enc'] as const;

/** ปิดบังเลขบัตร 13 หลัก -> "x-xxxx-xxxxx-34-5" */
export function maskIdCard(id: string): string {
  const d = id.replace(/\D/g, '');
  if (d.length !== 13) return 'x-xxxx-xxxxx-xx-x';
  return `x-xxxx-xxxxx-${d.slice(10, 12)}-${d.slice(12)}`;
}
