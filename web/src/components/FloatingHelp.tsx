'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { common as t } from '@/messages/common';

/** ปุ่ม "ช่วยเลย" ลอยบนมือถือ: อยู่หน้าโครงการ -> ไปหน้าบริจาคของโครงการนั้น · หน้าอื่น -> เลื่อนไปรายการโครงการ */
export default function FloatingHelp() {
  const path = usePathname() ?? '/';
  const m = path.match(/^\/projects\/([^/]+)$/);
  if (path.startsWith('/donate') || path.startsWith('/staff') || path.startsWith('/login') || path.startsWith('/register')) return null;
  const href = m ? `/donate/${m[1]}` : '/#projects';
  return (
    <Link href={href} className="btn btn-primary floating-help" data-testid="floating-help" aria-label={t.helpNow}>
      ♥ {t.helpNow}
    </Link>
  );
}
