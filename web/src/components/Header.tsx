'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, useMe } from '@/lib/client/api';
import { common as t } from '@/messages/common';
import type { Role } from '@/types';

const ROLE_LINKS: Record<Role, Array<[string, string, string]>> = {
  starter: [['/my/projects', t.nav.myProjects, 'nav-my-projects'], ['/my/projects/new', t.nav.newProject, 'nav-new-project']],
  helper: [['/my/donations', t.nav.myDonations, 'nav-my-donations'], ['/volunteer', t.nav.volunteer, 'nav-volunteer']],
  voucher: [['/voucher', t.nav.voucher, 'nav-voucher']],
  staff: [['/staff', t.nav.staff, 'nav-staff']],
  finance: [['/finance', t.nav.finance, 'nav-finance']],
  exec: [['/exec', t.nav.exec, 'nav-exec']],
};

/** header ทึบ (NFR-15): โลโก้ + เมนูตามบทบาท · มือถือมีปุ่มเปิด/ปิดเมนู */
export default function Header() {
  const { me, reload } = useMe();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const links = me ? ROLE_LINKS[me.role] : [];

  async function logout() {
    await api('/api/auth/logout', { method: 'POST', body: {} });
    reload();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="site-header" data-testid="site-header">
      <div className="container wrap">
        <div className="bar" style={{ width: '100%' }}>
          <Link href="/" className="brand" data-testid="nav-brand" aria-label="ร่วมกันทำไม กลับหน้าแรก">
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#a8461f" /><path d="M16 24c-7-5-8-10-5-11.5 2-1 4 .5 5 2.5 1-2 3-3.5 5-2.5 3 1.5 2 6.5-5 11.5z" fill="#fbf5ea" /></svg>
            <span>{t.brand}</span>
          </Link>
          <button type="button" className="menu-btn" data-testid="nav-menu-toggle" aria-expanded={open} aria-controls="main-nav" aria-label={open ? t.menuClose : t.menuOpen} onClick={() => setOpen(!open)}>
            {open ? '✕' : '☰'}
          </button>
        </div>
        <nav id="main-nav" aria-label="เมนูหลัก" className={`nav${open ? ' open' : ''}`} data-testid="main-nav">
          <Link href="/" data-testid="nav-home" aria-current={path === '/' ? 'page' : undefined} onClick={() => setOpen(false)}>{t.home}</Link>
          {links.map(([href, label, id]) => (
            <Link key={href} href={href} data-testid={id} aria-current={path === href ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          {me && <Link href="/notifications" data-testid="nav-notifications" onClick={() => setOpen(false)}>{t.notifications}</Link>}
          {me && <Link href="/account" data-testid="nav-account" onClick={() => setOpen(false)}>{me.displayName}</Link>}
          {me === null && <Link href="/login" data-testid="nav-login" onClick={() => setOpen(false)}>{t.login}</Link>}
          {me === null && <Link href="/register" data-testid="nav-register" onClick={() => setOpen(false)}>{t.register}</Link>}
          {me && <button type="button" className="linklike" data-testid="nav-logout" onClick={logout}>{t.logout}</button>}
        </nav>
      </div>
    </header>
  );
}
