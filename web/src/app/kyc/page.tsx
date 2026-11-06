'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, LinkButton, PageTitle, TextField } from '@/components/ui';
import { LoginRequired, fmtThai } from '@/components/f5/LoginRequired';
import { api, useMe } from '@/lib/client/api';
import { f5 } from '@/messages/f5';

const t = f5.kyc;
type Scan = null | 'scanning' | 'self' | 'other';
interface KycState { verified: boolean; verifiedAt: string | null; idCardMasked?: string | null }

function FaceCamera({ state }: { state: Scan }) {
  const done = state === 'self' || state === 'other';
  return (
    <svg viewBox="0 0 240 180" role="img" aria-label={t.cameraLabel} data-testid="kyc-camera"
      style={{ width: '100%', maxWidth: 320, borderRadius: 12, background: '#1f2f4d', display: 'block' }}>
      <ellipse cx="120" cy="86" rx="52" ry="66" fill="none" stroke={done ? '#8fd18f' : '#fbf5ea'} strokeWidth="3" strokeDasharray={done ? '0' : '8 6'} />
      <circle cx="120" cy="70" r="20" fill="#fbf5ea" opacity=".25" />
      <path d="M78 150q42-46 84 0" fill="#fbf5ea" opacity=".25" />
      {state === 'scanning' && <rect x="60" y="20" width="120" height="3" fill="#8fd18f"><animate attributeName="y" values="24;148;24" dur="1.2s" repeatCount="indefinite" /></rect>}
      {done && <path d="M100 90l14 14 28-30" fill="none" stroke="#8fd18f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export default function KycPage() {
  const { me, reload } = useMe();
  const [kyc, setKyc] = useState<KycState | null>(null);
  const [idCard, setIdCard] = useState('');
  const [scan, setScan] = useState<Scan>(null);
  const [assistedBy, setAssistedBy] = useState('');
  const [idErr, setIdErr] = useState<string | null>(null);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadKyc = useCallback(async () => {
    const r = await api<KycState>('/api/kyc');
    if (r.ok) setKyc(r.data);
  }, []);

  useEffect(() => { if (me) void loadKyc(); }, [me, loadKyc]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function startScan(by: 'self' | 'other') {
    setScanErr(null); setError(null);
    setScan('scanning');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setScan(by), 900);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = idCard.replace(/\s|-/g, '');
    let bad = false;
    if (!/^\d{13}$/.test(digits)) { setIdErr(t.errIdCard); bad = true; } else setIdErr(null);
    if (scan !== 'self' && scan !== 'other') { setScanErr(t.errNoScan); bad = true; } else setScanErr(null);
    if (bad) return;
    setBusy(true);
    const body: Record<string, unknown> = { idCard: digits, faceScannedBy: scan };
    if (assistedBy.trim()) body.assistedBy = assistedBy.trim();
    const r = await api('/api/kyc', { body });
    setBusy(false);
    if (!r.ok) { setError(r.error?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setJustDone(true);
    setIdCard('');
    await loadKyc();
    reload();
  }

  if (me === undefined) return <p className="muted" data-testid="kyc-loading">{f5.loading}</p>;

  return (
    <div className="stack" style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageTitle sub={t.sub} testid="kyc-title">{t.title}</PageTitle>
      {me === null ? <LoginRequired path="/kyc" testid="kyc" /> : (kyc?.verified || me.kycVerified) ? (
        <Card testid="kyc-verified">
          <div className="card-body stack">
            {justDone && <Alert kind="ok" testid="kyc-success">{t.success}</Alert>}
            <h2 style={{ fontSize: 20 }} data-testid="kyc-status">{t.verifiedTitle}</h2>
            <p>{t.verifiedBody}</p>
            {kyc?.verifiedAt && <p className="muted">{t.verifiedAt} <span data-testid="kyc-verified-at">{fmtThai(kyc.verifiedAt)}</span></p>}
            {kyc?.idCardMasked && <p className="muted">{t.idCardMasked} <span data-testid="kyc-id-masked">{kyc.idCardMasked}</span></p>}
            <div className="row">
              {me.role === 'starter' && <LinkButton href="/my/projects/new" testid="kyc-to-project">{t.toProject}</LinkButton>}
              <LinkButton href="/account" variant="secondary" testid="kyc-to-account">{f5.account.title}</LinkButton>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <form className="card-body stack" onSubmit={submit} noValidate>
            <Alert kind="info" testid="kyc-sim-note">{t.sim}</Alert>
            <TextField label={t.idCard} testid="kyc-idcard-input" inputMode="numeric" maxLength={17} autoComplete="off"
              value={idCard} onChange={(e) => setIdCard(e.target.value)} hint={t.idCardHint} error={idErr} />

            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
              <legend style={{ fontWeight: 700, marginBottom: 6 }}>{t.faceLegend}</legend>
              <p className="muted">{t.faceNote}</p>
              <FaceCamera state={scan} />
              <div className="row">
                <Button testid="kyc-scan-self" variant="secondary" onClick={() => startScan('self')} disabled={scan === 'scanning'}>{t.scanSelf}</Button>
                <Button testid="kyc-scan-other" variant="ghost" onClick={() => startScan('other')} disabled={scan === 'scanning'}>{t.scanOther}</Button>
              </div>
              <div aria-live="polite" data-testid="kyc-scan-status">
                {scan === 'scanning' && <Badge2 text={t.scanning} />}
                {scan === 'self' && <Badge2 text={t.scannedSelf} ok />}
                {scan === 'other' && <Badge2 text={t.scannedOther} />}
              </div>
              {scanErr && <span role="alert" data-testid="kyc-scan-error" className="field-error">{scanErr}</span>}
            </fieldset>

            <TextField label={t.assisted} testid="kyc-assisted-input" value={assistedBy} onChange={(e) => setAssistedBy(e.target.value)} hint={t.assistedHint} />

            {error && <Alert kind="error" testid="kyc-error">{error}</Alert>}
            <button type="submit" data-testid="kyc-submit" className="btn btn-primary btn-block" disabled={busy || scan === 'scanning'}>{busy ? t.submitting : t.submit}</button>
          </form>
        </Card>
      )}
    </div>
  );
}

function Badge2({ text, ok }: { text: string; ok?: boolean }) {
  return <span className={`badge${ok ? ' badge-ok' : ''}`}>{text}</span>;
}
