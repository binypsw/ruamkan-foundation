'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Alert } from '@/components/ui';
import { useMe } from '@/lib/client/api';
import { f8 } from '@/messages/f8';
import type { Role } from '@/types';

/** ตรวจล็อกอิน/บทบาท: ไม่ล็อกอิน -> ลิงก์ login · บทบาทไม่ตรง -> ข้อความไม่มีสิทธิ์ (API ตอบ 403 อยู่แล้ว) */
export function Gate({ role, prefix, path, children }: { role: Role; prefix: string; path: string; children: ReactNode }) {
  const { me } = useMe();
  if (me === undefined) return <p className="muted" data-testid={`${prefix}-loading`}>{f8.loading}</p>;
  if (me === null) {
    return (
      <div data-testid={`${prefix}-login-needed`} className="card card-body">
        <p>{f8.loginNeeded}</p>
        <Link href={`/login?next=${path}`} data-testid={`${prefix}-login-link`} className="btn btn-primary">{f8.loginLink}</Link>
      </div>
    );
  }
  if (me.role !== role) {
    return <Alert kind="error" testid={`${prefix}-forbidden`}>{f8.forbidden} · {role === 'finance' ? f8.financeOnly : f8.execOnly}</Alert>;
  }
  return <>{children}</>;
}
