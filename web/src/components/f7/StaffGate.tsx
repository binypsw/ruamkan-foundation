'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMe } from '@/lib/client/api';
import { Alert } from '@/components/ui';
import { f7 } from '@/messages/f7';

/** ตรวจบทบาท: ไม่ล็อกอิน -> ลิงก์ login · ไม่ใช่ staff -> ไม่มีสิทธิ์ (API ตอบ 403 อยู่แล้ว) */
export function StaffGate({ next, children }: { next: string; children: ReactNode }) {
  const { me } = useMe();
  if (me === undefined) return <p className="muted" data-testid="staff-loading">{f7.loading}</p>;
  if (me === null) {
    return (
      <div className="stack">
        <Alert kind="info" testid="staff-login-required">{f7.needLogin}</Alert>
        <Link href={`/login?next=${encodeURIComponent(next)}`} data-testid="staff-login-link" className="btn btn-primary">{f7.loginLink}</Link>
      </div>
    );
  }
  if (me.role !== 'staff') return <Alert kind="error" testid="staff-forbidden">{f7.forbidden}</Alert>;
  return <>{children}</>;
}

export function StaffTabs({ active }: { active: 'home' | 'milestones' | 'flags' }) {
  const items: Array<[string, string, string]> = [
    ['home', '/staff', f7.nav.home],
    ['milestones', '/staff/milestones', f7.nav.milestones],
    ['flags', '/staff/flags', f7.nav.flags],
  ];
  return (
    <nav className="row" aria-label="เมนูหลังบ้าน" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      {items.map(([k, href, label]) => (
        <Link key={k} href={href} data-testid={`staff-tab-${k}`} className={`btn ${active === k ? 'btn-primary' : 'btn-secondary'}`} aria-current={active === k ? 'page' : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
