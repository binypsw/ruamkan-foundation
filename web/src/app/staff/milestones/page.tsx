'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client/api';
import { fmtBaht } from '@/lib/format';
import { Alert, Badge, Button, Card, Empty, PageTitle, SelectField, TextField } from '@/components/ui';
import { StaffGate, StaffTabs } from '@/components/f7/StaffGate';
import { f7 } from '@/messages/f7';

const m7 = f7.milestones;

interface Evidence { id: string; kind: string; fileUrl: string }
interface Row {
  id: string; projectCode: string; projectTitle: string; seq: number; percent: number | string; amount: string;
  status: string; frozen: boolean; evidence: Evidence[];
}

function MilestoneList() {
  const [status, setStatus] = useState('requested');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payee, setPayee] = useState<'starter' | 'merchant'>('starter');
  const [merchant, setMerchant] = useState(m7.merchantDefault);
  const [merchantErr, setMerchantErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api(`/api/staff/milestones${status ? `?status=${status}` : ''}`);
    if (r.ok) { setRows(r.data.milestones ?? []); setLoadErr(null); } else setLoadErr(r.error?.message ?? f7.loadError);
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  const approve = async (id: string) => {
    setBusy(id); setOk(null); setErr(null);
    const r = await api(`/api/staff/milestones/${id}/approve`, { method: 'POST', body: {} });
    setBusy(null);
    if (r.ok) { setOk(m7.approveOk); void load(); } else setErr(r.error?.message ?? f7.loadError);
  };

  const openPay = (id: string) => {
    setPayingId(id); setPayee('starter'); setMerchant(m7.merchantDefault); setMerchantErr(null); setOk(null); setErr(null);
  };
  const pay = async (id: string) => {
    if (payee === 'merchant' && !merchant.trim()) { setMerchantErr(m7.merchantEmpty); return; }
    setMerchantErr(null); setBusy(id); setOk(null); setErr(null);
    const body = payee === 'merchant' ? { payee, merchantName: merchant.trim() } : { payee };
    const r = await api(`/api/staff/milestones/${id}/pay`, { method: 'POST', body });
    setBusy(null);
    if (r.ok) { setOk(m7.payOk); setPayingId(null); void load(); } else setErr(r.error?.message ?? f7.loadError);
  };

  return (
    <div className="stack">
      <PageTitle sub={m7.sub} testid="staff-milestones-title">{m7.title}</PageTitle>
      <StaffTabs active="milestones" />
      <SelectField label={m7.filter} testid="staff-milestones-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="requested">{f7.statusLabel.requested}</option>
        <option value="approved">{f7.statusLabel.approved}</option>
        <option value="paid">{f7.statusLabel.paid}</option>
        <option value="">{m7.filterAll}</option>
      </SelectField>
      {ok && <Alert kind="ok" testid="staff-milestones-success">{ok}</Alert>}
      {err && <Alert kind="error" testid="staff-milestones-error">{err}</Alert>}
      {loadErr && <Alert kind="error" testid="staff-milestones-load-error">{loadErr}</Alert>}
      {rows && rows.length === 0 && <Empty testid="staff-milestones-empty">{m7.empty}</Empty>}
      {rows && rows.map((m) => {
        const receipts = m.evidence.filter((e) => e.kind === 'receipt');
        const photos = m.evidence.filter((e) => e.kind === 'photo');
        return (
          <Card key={m.id} testid={`staff-milestone-${m.id}`}>
            <div className="card-body stack">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <Link href={`/staff/projects/${m.projectCode}`} data-testid={`staff-milestone-project-${m.id}`}><strong>{m.projectCode}</strong> {m.projectTitle}</Link>
                  <div>{m7.seq} {m.seq} · {m7.percent} {m.percent}% · {m7.amount} <span className="num" data-testid={`staff-milestone-amount-${m.id}`}>{fmtBaht(m.amount)}</span></div>
                </div>
                <div className="row">
                  <Badge tone={m.status === 'paid' ? 'ok' : 'info'} testid={`staff-milestone-status-${m.id}`}>{f7.statusLabel[m.status] ?? m.status}</Badge>
                  {m.frozen && <Badge tone="danger" testid={`staff-milestone-frozen-${m.id}`}>{m7.frozen}</Badge>}
                </div>
              </div>
              <div data-testid={`staff-milestone-evidence-${m.id}`}>
                <strong>{m7.evidence}</strong>
                {m.evidence.length === 0 && <p className="muted" data-testid={`staff-milestone-evidence-none-${m.id}`}>{m7.evidenceNone}</p>}
                <div className="row">
                  {receipts.map((e, i) => <a key={e.id} href={e.fileUrl} target="_blank" rel="noreferrer" data-testid={`staff-milestone-receipt-${m.id}-${i}`} className="btn btn-secondary">{m7.receipt} {i + 1}</a>)}
                  {photos.map((e, i) => (
                    <a key={e.id} href={e.fileUrl} target="_blank" rel="noreferrer" data-testid={`staff-milestone-photo-${m.id}-${i}`} aria-label={`${m7.photo} ${i + 1}`}>
                      <img src={e.fileUrl} alt={`${m7.photo} ${i + 1}`} style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                    </a>
                  ))}
                </div>
              </div>
              {m.status === 'requested' && (
                <div><Button testid={`staff-milestone-approve-${m.id}`} disabled={busy === m.id} onClick={() => approve(m.id)} aria-label={`${m7.approve} ${m.projectCode} ${m7.seq} ${m.seq}`}>{m7.approve}</Button></div>
              )}
              {m.status === 'approved' && payingId !== m.id && (
                <div><Button testid={`staff-milestone-pay-${m.id}`} variant="secondary" onClick={() => openPay(m.id)} aria-label={`${m7.pay} ${m.projectCode} ${m7.seq} ${m.seq}`}>{m7.pay}</Button></div>
              )}
              {m.status === 'approved' && payingId === m.id && (
                <div className="stack" data-testid={`staff-milestone-pay-form-${m.id}`}>
                  <SelectField label={m7.payee} testid={`staff-milestone-payee-${m.id}`} value={payee} onChange={(e) => setPayee(e.target.value as 'starter' | 'merchant')}>
                    <option value="starter">{m7.payeeStarter}</option>
                    <option value="merchant">{m7.payeeMerchant}</option>
                  </SelectField>
                  {payee === 'merchant' && (
                    <TextField label={m7.merchantName} testid={`staff-milestone-merchant-${m.id}`} value={merchant} error={merchantErr} onChange={(e) => setMerchant(e.target.value)} />
                  )}
                  <div className="row">
                    <Button testid={`staff-milestone-pay-confirm-${m.id}`} disabled={busy === m.id} onClick={() => pay(m.id)}>{m7.confirmPay}</Button>
                    <Button testid={`staff-milestone-pay-cancel-${m.id}`} variant="ghost" onClick={() => setPayingId(null)}>{m7.cancel}</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function StaffMilestonesPage() {
  return <StaffGate next="/staff/milestones"><MilestoneList /></StaffGate>;
}
