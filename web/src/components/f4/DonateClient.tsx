'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, CheckField, LinkButton, PageTitle, TextField } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { fromSatang, mulDivHalfUp, toSatang } from '@/lib/decimal';
import { fmtBaht, fmtMoney } from '@/lib/format';
import { f4 } from '@/messages/f4';
import type { PayMethod } from '@/types';
import MockQr from './MockQr';

const QUICK = [50, 500, 1000, 2000];
const METHODS: PayMethod[] = ['promptpay', 'card', 'mobile'];

interface Project {
  id: string; code: string; title: string; acceptingDonations: boolean;
  bars?: { money?: { raised: string; target: string; pct: number } };
  rewardTiers?: Array<{ tier: number; minAmount: string; description: string }>;
}
interface DonationView { id: string; status: string; amount: string; tip: string; fee: string; payable: string; net: string; tier: number }
interface Created { donation: DonationView; qr: { ref: string; payload: string; expiresAt: string }; adjusted: boolean; excessRefunded: string }

export default function DonateClient({ projectKey }: { projectKey: string }) {
  const { me } = useMe();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [amountText, setAmountText] = useState('');
  const [tip, setTip] = useState(false);
  const [method, setMethod] = useState<PayMethod>('promptpay');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [secs, setSecs] = useState<number | null>(null);
  const [paid, setPaid] = useState<{ donation: DonationView; project: Project | null } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProject = useCallback(async () => {
    const r = await api<Project>(`/api/projects/${encodeURIComponent(projectKey)}`);
    return r.ok ? r.data : null;
  }, [projectKey]);

  useEffect(() => { void loadProject().then((p) => setProject(p)); }, [loadProject]);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const amountNum = /^\d+(\.\d{1,2})?$/.test(amountText.trim()) ? amountText.trim() : '';
  const preview = (() => {
    if (!amountNum) return null;
    const a = toSatang(amountNum);
    const t = tip ? mulDivHalfUp(a, 5, 100) : 0;
    return { amount: fromSatang(a), tip: fromSatang(t), total: fromSatang(a + t) };
  })();

  async function submit() {
    setError(null);
    if (!amountNum) { setError(f4.donate.needAmount); return; }
    setBusy(true);
    const r = await api<Created>('/api/donations', { body: { projectId: projectKey, amount: amountNum, tip, method } });
    if (!r.ok) { setError(r.error?.message ?? ''); setBusy(false); return; }
    const nowR = await api<{ now: string }>('/api/now');
    const left = nowR.ok ? Math.max(0, Math.floor((new Date(r.data.qr.expiresAt).getTime() - new Date(nowR.data.now).getTime()) / 1000)) : 900;
    setSecs(left);
    setCreated(r.data);
    setBusy(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setSecs((s) => (s === null ? s : Math.max(0, s - 1))), 1000);
  }

  async function mockPay() {
    if (!created) return;
    setError(null);
    setBusy(true);
    const r = await api('/api/payments/mock/pay', { body: { donationId: created.donation.id } });
    if (!r.ok) { setError(r.error?.message ?? ''); setBusy(false); return; }
    const d = await api<{ donation: DonationView }>(`/api/donations/${created.donation.id}`);
    const p = await loadProject();
    if (!d.ok) { setError(d.error?.message ?? f4.donate.fetchFailed); setBusy(false); return; }
    if (timer.current) clearInterval(timer.current);
    setPaid({ donation: d.data.donation, project: p });
    setBusy(false);
  }

  function reset() {
    setCreated(null); setPaid(null); setSecs(null); setError(null);
    void loadProject().then((p) => setProject(p));
  }

  const loginHref = `/login?next=${encodeURIComponent(`/donate/${projectKey}`)}`;
  if (me === undefined || project === undefined) return <div className="muted" data-testid="donate-loading">{f4.donate.projectLoading}</div>;
  if (me === null) {
    return (
      <div className="stack">
        <PageTitle testid="donate-title">{f4.donate.title}</PageTitle>
        <Alert kind="info" testid="donate-login-needed">{f4.donate.loginNeeded}</Alert>
        <LinkButton href={loginHref} testid="donate-login-link">{f4.donate.loginLink}</LinkButton>
      </div>
    );
  }
  if (project === null) {
    return (
      <div className="stack">
        <PageTitle testid="donate-title">{f4.donate.title}</PageTitle>
        <Alert kind="error" testid="donate-error">{f4.donate.notFound}</Alert>
      </div>
    );
  }

  const projHref = `/projects/${project.code}`;

  if (paid) {
    const d = paid.donation;
    const tierInfo = paid.project?.rewardTiers?.find((t) => t.tier === d.tier);
    const raisedNow = paid.project?.bars?.money?.raised;
    return (
      <div className="stack">
        <PageTitle testid="donate-title" sub={project.title}>{f4.donate.title}</PageTitle>
        <Alert kind="ok" testid="donate-paid">{f4.donate.paidTitle}</Alert>
        <Card className="card-body" testid="donate-paid-summary">
          <dl style={{ margin: 0 }}>
            <Row label={f4.donate.paidAmount} value={`+${fmtBaht(d.amount)}`} testid="donate-paid-amount" />
            {raisedNow && <Row label={f4.donate.paidTotal} value={fmtBaht(raisedNow)} testid="donate-paid-raised" />}
            <Row label={f4.donate.donateLine} value={`${fmtMoney(d.amount)} บาท`} testid="donate-paid-donation" />
            <Row label={f4.donate.tipLine} value={`${fmtMoney(d.tip)} บาท`} testid="donate-paid-tip" />
            <Row label={f4.donate.totalLine} value={`${fmtMoney(d.payable)} บาท`} testid="donate-paid-payable" />
            <Row label={f4.donate.feeLine} value={`${fmtMoney(d.fee)} บาท`} testid="donate-paid-fee" />
            <Row label={f4.donate.netLine} value={`${fmtMoney(d.net)} บาท`} testid="donate-paid-net" />
            <Row label={f4.donate.paidTier} value={d.tier ? `${f4.donate.tierName(d.tier)}${tierInfo ? ` · ${tierInfo.description}` : ''}` : f4.donate.noTier} testid="donate-paid-tier" />
          </dl>
        </Card>
        <div className="row">
          <LinkButton href={`/receipt/${d.id}`} testid="donate-receipt-link">{f4.donate.viewReceipt}</LinkButton>
          <LinkButton href={projHref} variant="secondary" testid="donate-back-project">{f4.donate.backToProject}</LinkButton>
          <LinkButton href="/my/donations" variant="ghost" testid="donate-my-donations-link">{f4.donate.myDonations}</LinkButton>
        </div>
      </div>
    );
  }

  if (created) {
    const d = created.donation;
    const expired = secs !== null && secs <= 0;
    const mm = String(Math.floor((secs ?? 0) / 60)).padStart(2, '0');
    const ss = String((secs ?? 0) % 60).padStart(2, '0');
    return (
      <div className="stack">
        <PageTitle testid="donate-title" sub={project.title}>{f4.donate.payTitle}</PageTitle>
        {created.adjusted && (
          <Alert kind="warn" testid="donate-adjusted">
            <strong>{f4.donate.adjustedTitle}</strong> {f4.donate.adjustedBody(fmtMoney(d.amount), fmtMoney(created.excessRefunded))}
          </Alert>
        )}
        <Card className="card-body" testid="donate-result">
          <h2>{f4.donate.resultTitle}</h2>
          <dl style={{ margin: 0 }}>
            <Row label={f4.donate.donateLine} value={`${fmtMoney(d.amount)} บาท`} testid="donate-result-amount" />
            <Row label={f4.donate.tipLine} value={`${fmtMoney(d.tip)} บาท`} testid="donate-result-tip" />
            <Row label={f4.donate.totalLine} value={`${fmtMoney(d.payable)} บาท`} testid="donate-total" strong />
            <Row label={f4.donate.feeLine} value={`${fmtMoney(d.fee)} บาท`} testid="donate-result-fee" />
            <Row label={f4.donate.netLine} value={`${fmtMoney(d.net)} บาท`} testid="donate-result-net" />
            <Row label={f4.donate.tierLine} value={d.tier ? f4.donate.tierName(d.tier) : f4.donate.noTier} testid="donate-result-tier" />
          </dl>
        </Card>
        <Card className="card-body" testid="donate-qr-card">
          <h2>{f4.donate.qrTitle}</h2>
          {method === 'promptpay' ? <MockQr payload={created.qr.payload} /> : <p className="muted" data-testid="donate-method-note">{f4.donate.cardNote}</p>}
          <p className="muted">{f4.donate.qrRef}: <span data-testid="donate-qr-ref">{created.qr.ref}</span></p>
          <p data-testid="donate-countdown" style={{ fontWeight: 700 }}>
            {expired ? f4.donate.expired : `${f4.donate.countdown} ${mm}:${ss}`}
          </p>
        </Card>
        {error && <Alert kind="error" testid="donate-error">{error}</Alert>}
        <div className="row">
          {expired
            ? <Button testid="donate-new" onClick={reset}>{f4.donate.newDonation}</Button>
            : <Button testid="donate-mock-pay" onClick={mockPay} disabled={busy}>{busy ? f4.donate.paying : f4.donate.mockPay}</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageTitle testid="donate-title" sub={<>{f4.donate.projectLabel}: <span data-testid="donate-project-title">{project.title}</span></>}>{f4.donate.title}</PageTitle>
      {!project.acceptingDonations && (
        <Alert kind="warn" testid="donate-closed">{f4.donate.closedNote}</Alert>
      )}
      <Card className="card-body">
        <h2>{f4.donate.amountTitle}</h2>
        <div className="row" role="group" aria-label={f4.donate.quickGroup}>
          {QUICK.map((q) => (
            <Button key={q} testid={`donate-quick-${q}`} variant={amountText === String(q) ? 'primary' : 'secondary'} aria-pressed={amountText === String(q)} onClick={() => setAmountText(String(q))}>{fmtBaht(q)}</Button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <TextField label={f4.donate.amountLabel} hint={f4.donate.amountHint} testid="donate-amount-input" inputMode="decimal" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
        </div>
        <CheckField label={f4.donate.tipLabel} testid="donate-tip-checkbox" checked={tip} onChange={(e) => setTip(e.target.checked)} />
        <p className="field-hint">{f4.donate.tipHint}</p>
      </Card>
      <Card className="card-body" testid="donate-summary">
        <h2>{f4.donate.summaryTitle}</h2>
        <dl style={{ margin: 0 }}>
          <Row label={f4.donate.donateLine} value={preview ? `${fmtMoney(preview.amount)} บาท` : '-'} testid="donate-preview-amount" />
          <Row label={f4.donate.tipLine} value={preview ? `${fmtMoney(preview.tip)} บาท` : '-'} testid="donate-preview-tip" />
          <Row label={f4.donate.totalLine} value={preview ? `${fmtMoney(preview.total)} บาท` : '-'} testid="donate-preview-total" strong />
        </dl>
        <p className="field-hint">{f4.donate.summaryNote}</p>
      </Card>
      <Card className="card-body">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: 8 }}>{f4.donate.methodTitle}</legend>
          {METHODS.map((m) => (
            <label key={m} className="row" style={{ minHeight: 44, cursor: 'pointer' }}>
              <input type="radio" name="method" data-testid={`donate-method-${m}`} value={m} checked={method === m} onChange={() => setMethod(m)} style={{ width: 24, height: 24 }} />
              <span>{f4.donate.methods[m]}</span>
            </label>
          ))}
        </fieldset>
      </Card>
      {error && <Alert kind="error" testid="donate-error">{error}</Alert>}
      <Button testid="donate-submit" block onClick={submit} disabled={busy || !project.acceptingDonations}>{busy ? f4.donate.submitting : f4.donate.submit}</Button>
    </div>
  );
}

function Row({ label, value, testid, strong }: { label: string; value: string; testid: string; strong?: boolean }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontWeight: strong ? 700 : 400 }}>
      <dt>{label}</dt>
      <dd style={{ margin: 0 }} data-testid={testid}>{value}</dd>
    </div>
  );
}
