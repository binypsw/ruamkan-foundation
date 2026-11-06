'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Card, CheckField, PageTitle, TextField } from '@/components/ui';
import { api } from '@/lib/client/api';
import { f5 } from '@/messages/f5';

const t = f5.register;
type RegRole = 'starter' | 'helper' | 'voucher';
const ROLES: RegRole[] = ['starter', 'helper', 'voucher'];

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}

export default function RegisterPage() {
  const router = useRouter();
  const [next, setNext] = useState('/');
  const [role, setRole] = useState<RegRole>('helper');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get('next')));
  }, []);

  const isVoucher = role === 'voucher';

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.name = t.errName;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = t.errEmail;
    if (password.length < 8) e.password = t.errPassword;
    if (isVoucher) {
      if (!address.trim() || !province.trim() || !lat.trim() || !lng.trim()) e.address = t.errAddress;
      else {
        const la = Number(lat), lo = Number(lng);
        if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) e.coord = t.errCoord;
      }
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (!validate()) return;
    setBusy(true);
    const body: Record<string, unknown> = {
      email: email.trim(), password, displayName: displayName.trim(), role, consentShowName: consent,
    };
    if (isVoucher || address.trim() || province.trim()) {
      body.address = address.trim() || undefined;
      body.province = province.trim() || undefined;
    }
    if (isVoucher) { body.homeLat = Number(lat); body.homeLng = Number(lng); }
    const r = await api('/api/auth/register', { body });
    if (!r.ok) { setBusy(false); setError(r.error?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    // สมัครสำเร็จแล้วเข้าสู่ระบบต่อทันที
    const l = await api('/api/auth/login', { body: { email: email.trim(), password } });
    if (!l.ok) { router.push(`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`); return; }
    router.refresh();
    const dest = role === 'starter' && next === '/' ? '/kyc' : next;
    window.location.assign(dest);
  }

  return (
    <div className="stack" style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageTitle sub={t.sub} testid="register-title">{t.title}</PageTitle>
      <Card>
        <form className="card-body stack" onSubmit={submit} noValidate>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} data-testid="register-role-group">
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>{t.roleLegend}</legend>
            <div className="stack">
              {ROLES.map((r) => (
                <label key={r} className="card card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', minHeight: 44, borderWidth: role === r ? 3 : undefined }}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} data-testid={`register-role-${r}`} style={{ width: 24, height: 24, marginTop: 2 }} />
                  <span>
                    <strong>{t.roles[r].label}</strong><br />
                    <span className="muted">{t.roles[r].desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <TextField label={t.displayName} testid="register-name-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} error={errs.name} autoComplete="name" />
          <TextField label={t.email} testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errs.email} autoComplete="username" />
          <TextField label={t.password} testid="register-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errs.password} hint={t.passwordHint} autoComplete="new-password" />
          <CheckField label={t.consent} testid="register-consent-checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />

          {isVoucher && (
            <div className="stack" data-testid="register-voucher-section">
              <h2 style={{ fontSize: 18 }}>{t.voucherTitle}</h2>
              <p className="muted">{t.voucherNote}</p>
              <TextField label={t.address} testid="register-address-input" value={address} onChange={(e) => setAddress(e.target.value)} error={errs.address} autoComplete="street-address" />
              <TextField label={t.province} testid="register-province-input" value={province} onChange={(e) => setProvince(e.target.value)} />
              <TextField label={t.lat} testid="register-lat-input" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} hint={t.latHint} />
              <TextField label={t.lng} testid="register-lng-input" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} hint={t.lngHint} error={errs.coord} />
            </div>
          )}

          {error && <Alert kind="error" testid="register-error">{error}</Alert>}
          <button type="submit" data-testid="register-submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? t.submitting : t.submit}</button>
          <p className="muted">
            {t.haveAccount}{' '}
            <Link href={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} data-testid="register-login-link">{t.login}</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
