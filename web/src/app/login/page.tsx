'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, PageTitle, TextField } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { f5 } from '@/messages/f5';

const t = f5.login;

/** รับเฉพาะพาธภายในเว็บ กัน open redirect */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}

const TEST_ACCOUNTS: Array<[string, string, string, string]> = [
  ['somsri@test.local', 'สมศรี ใจดี', 'ต้นเรื่อง', 'ผ่าน KYC แล้ว เจ้าของ P01'],
  ['boonma@test.local', 'ลุงบุญมา', 'ต้นเรื่อง', 'ยังไม่ผ่าน KYC'],
  ['noi@test.local', 'ป้าน้อย', 'ต้นเรื่อง', 'เจ้าของ P05 (ส่งใหม่ครบ 2 ครั้ง)'],
  ['may@test.local', 'คุณเมย์', 'ผู้ช่วยเหลือ', 'ยินยอมแสดงชื่อ'],
  ['ton@test.local', 'คุณต้น', 'ผู้ช่วยเหลือ', 'ไม่ยินยอมแสดงชื่อ'],
  ['wichai@test.local', 'ช่างวิชัย', 'ผู้ช่วยเหลือ', 'ทักษะช่างไฟ'],
  ['tester@test.local', 'ผู้บริจาคทั่วไป', 'ผู้ช่วยเหลือ', 'ไม่มีประวัติ ใช้ลองบริจาค'],
  ['thong@test.local', 'ผู้ใหญ่บ้านทอง', 'ผู้รับรอง', 'ห่างจาก P04 4.90 กม.'],
  ['kaew@test.local', 'ครูแก้ว', 'ผู้รับรอง', 'ห่างจาก P04 5.00 กม.'],
  ['nid@test.local', 'อสม.นิด', 'ผู้รับรอง', 'ห่างจาก P04 5.10 กม.'],
  ['yai@test.local', 'ป้ายาย', 'ผู้รับรอง', 'ญาติของสมศรี (บ้านเดียวกัน)'],
  ['staff@test.local', 'เจ้าหน้าที่ปอ', 'เจ้าหน้าที่', 'อนุมัติ/ปลดล็อกได้'],
  ['wipa@test.local', 'คุณวิภา', 'ฝ่ายการเงิน', 'ดูสมุดบัญชี'],
  ['somchai@test.local', 'คุณสมชาย', 'ผู้บริหาร', 'ดูแดชบอร์ด'],
];

export default function LoginPage() {
  const router = useRouter();
  const { me } = useMe();
  const [next, setNext] = useState('/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get('next')));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) { setError(t.required); return; }
    setBusy(true);
    const r = await api('/api/auth/login', { body: { email: email.trim(), password } });
    if (!r.ok) { setBusy(false); setError(r.error?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    router.refresh();
    // โหลดหน้าใหม่เต็มหน้า เพื่อให้ Header (ที่เรียก useMe เอง) อัปเดตแน่นอน
    window.location.assign(next);
  }

  return (
    <div className="stack" style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageTitle sub={t.sub} testid="login-title">{t.title}</PageTitle>

      {me && (
        <Alert kind="info" testid="login-already">
          {t.already} {me.displayName}{' '}
          <Link href={next} data-testid="login-already-continue">{t.continue}</Link>
        </Alert>
      )}

      <Card>
        <form className="card-body stack" onSubmit={submit} noValidate>
          <TextField label={t.email} testid="login-email-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t.password} testid="login-password-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <Alert kind="error" testid="login-error">{error}</Alert>}
          <button type="submit" data-testid="login-submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? t.submitting : t.submit}</button>
          <p className="muted">
            {t.noAccount}{' '}
            <Link href={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} data-testid="login-register-link">{t.register}</Link>
          </p>
        </form>
      </Card>

      <Card testid="login-help">
        <div className="card-body stack">
          <h2 style={{ fontSize: 18 }} data-testid="login-help-title">{t.helpTitle}</h2>
          <p className="muted" data-testid="login-help-note">{t.helpNote}</p>
          <div className="table-wrap">
            <table className="table" data-testid="login-help-table">
              <caption className="sr-only">{t.helpTitle}</caption>
              <thead>
                <tr><th scope="col">{t.colEmail}</th><th scope="col">{t.colName}</th><th scope="col">{t.colRole}</th><th scope="col">{t.colNote}</th></tr>
              </thead>
              <tbody>
                {TEST_ACCOUNTS.map(([em, name, role, note]) => (
                  <tr key={em} data-testid={`login-help-row-${em.split('@')[0]}`}>
                    <td>{em}</td><td>{name}</td><td>{role}</td><td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
