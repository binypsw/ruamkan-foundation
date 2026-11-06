'use client';
import { Alert, LinkButton } from '@/components/ui';
import { f5 } from '@/messages/f5';

export function LoginRequired({ path, testid }: { path: string; testid: string }) {
  return (
    <div className="stack">
      <Alert kind="info" testid={`${testid}-need-login`}>{f5.needLogin}</Alert>
      <LinkButton href={`/login?next=${encodeURIComponent(path)}`} testid={`${testid}-login-link`}>{f5.goLogin}</LinkButton>
    </div>
  );
}

/** แสดงเวลาเป็นเวลาไทยจาก ISO (แปลงค่าที่มีอยู่แล้ว ไม่ใช้เวลาปัจจุบัน) */
export function fmtThai(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' });
  } catch { return iso; }
}
