'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, SelectField } from '@/components/ui';
import { api } from '@/lib/client/api';
import { fmtDateTime, fmtMoney } from '@/lib/format';
import { tidOf } from '@/lib/testid';
import { f8 } from '@/messages/f8';
import { Gate } from './Gate';

/* รูปข้อมูล wallets ในสัญญายังไม่ตายตัว จึงอ่านแบบยืดหยุ่นหลายชื่อฟิลด์ (ดู CONTRACT-NOTES/f8.md) */
interface WalletRow { id?: string; kind: string; code: string | null; title: string | null; balance: string }
interface ReconRow { walletKind: string; projectCode: string | null; balance: string; ledgerSum: string; diff: string }
interface Recon { ok: boolean; rows: ReconRow[]; totalDiff: string }
interface Entry { at: string; kind: string; amount: string; payee?: string | null; memo?: string | null; donorLabel?: string | null }
interface Ledger { entries: Entry[]; totals: { in: string; fee: string; out: string; balance: string } }

const balOf = (x: any): string => (x == null ? '0.00' : typeof x === 'object' ? String(x.balance ?? '0.00') : String(x));
function normWallet(w: any): WalletRow {
  const code = w.projectCode ?? w.code ?? w.project?.code ?? null;
  return {
    id: w.id,
    kind: w.kind ?? w.walletKind ?? (code ? 'project' : 'project'),
    code,
    title: w.projectTitle ?? w.title ?? w.project?.title ?? null,
    balance: String(w.balance ?? '0.00'),
  };
}

function Body() {
  const [wallets, setWallets] = useState<WalletRow[] | null>(null);
  const [adminFee, setAdminFee] = useState('0.00');
  const [central, setCentral] = useState('0.00');
  const [recon, setRecon] = useState<Recon | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pick, setPick] = useState('');
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [ledgerErr, setLedgerErr] = useState<string | null>(null);
  const [options, setOptions] = useState<Array<{ code: string; title: string }>>([]);

  const load = useCallback(async () => {
    setErr(null);
    const [w, r] = await Promise.all([api<any>('/api/finance/wallets'), api<Recon>('/api/finance/reconcile')]);
    if (!w.ok) { setErr(w.error?.message ?? f8.forbidden); return; }
    if (!r.ok) { setErr(r.error?.message ?? f8.forbidden); return; }
    const all: WalletRow[] = (w.data.wallets ?? []).map(normWallet);
    setWallets(all);
    setAdminFee(w.data.adminFee != null ? balOf(w.data.adminFee) : (all.find((x) => x.kind === 'admin_fee')?.balance ?? '0.00'));
    setCentral(w.data.central != null ? balOf(w.data.central) : (all.find((x) => x.kind === 'central')?.balance ?? '0.00'));
    setRecon(r.data);
    const fromWallets = all.filter((x) => x.kind === 'project' && x.code).map((x) => ({ code: x.code as string, title: x.title ?? '' }));
    if (fromWallets.length) setOptions(fromWallets);
    else {
      const pr = await api<{ projects: Array<{ code: string; title: string }> }>('/api/projects');
      if (pr.ok) setOptions(pr.data.projects.map((p) => ({ code: p.code, title: p.title })));
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!pick) { setLedger(null); setLedgerErr(null); return; }
    let cancelled = false;
    void api<Ledger>(`/api/projects/${encodeURIComponent(pick)}/ledger`).then((r) => {
      if (cancelled) return;
      if (r.ok) { setLedger(r.data); setLedgerErr(null); } else { setLedger(null); setLedgerErr(r.error?.message ?? f8.retry); }
    });
    return () => { cancelled = true; };
  }, [pick]);

  const projectWallets = useMemo(() => (wallets ?? []).filter((x) => x.kind === 'project'), [wallets]);
  const hasDonor = !!ledger?.entries.some((e) => e.donorLabel);

  if (err) return (
    <div className="stack">
      <Alert kind="error" testid="finance-error">{err}</Alert>
      <Button variant="secondary" testid="finance-retry" onClick={() => void load()}>{f8.retry}</Button>
    </div>
  );
  if (!wallets || !recon) return <p className="muted" data-testid="finance-loading">{f8.loading}</p>;

  const totals: Array<[string, string, string]> = ledger
    ? [['in', f8.finance.totalIn, ledger.totals.in], ['fee', f8.finance.totalFee, ledger.totals.fee], ['out', f8.finance.totalOut, ledger.totals.out], ['balance', f8.finance.totalBalance, ledger.totals.balance]]
    : [];

  return (
    <div className="stack">
      <div className="row">
        <Button variant="secondary" testid="finance-refresh" onClick={() => void load()}>{f8.finance.refresh}</Button>
      </div>

      <h2>{f8.finance.walletsTitle}</h2>
      <div className="grid" data-testid="finance-special-wallets">
        <Card testid="finance-wallet-admin-fee">
          <div className="card-body">
            <div className="muted">{f8.finance.adminFee}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }} data-testid="finance-admin-fee-balance">{fmtMoney(adminFee)}</div>
            <div className="muted">{f8.finance.unitBaht}</div>
          </div>
        </Card>
        <Card testid="finance-wallet-central">
          <div className="card-body">
            <div className="muted">{f8.finance.central}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }} data-testid="finance-central-balance">{fmtMoney(central)}</div>
            <div className="muted">{f8.finance.unitBaht}</div>
          </div>
        </Card>
      </div>

      <h2>{f8.finance.projectWallets}</h2>
      {projectWallets.length === 0 ? <Empty testid="finance-wallets-empty">{f8.finance.noWallets}</Empty> : (
        <div className="table-wrap">
          <table className="table" data-testid="finance-wallets-table">
            <thead><tr><th>{f8.finance.colCode}</th><th>{f8.finance.colProject}</th><th className="num">{f8.finance.colBalance}</th></tr></thead>
            <tbody>
              {projectWallets.map((w) => (
                <tr key={w.id ?? w.code} data-testid={tidOf('finance-wallet-row', w.code)}>
                  <td>{w.code}</td><td>{w.title}</td>
                  <td className="num" data-testid={tidOf('finance-wallet-balance', w.code)}>{fmtMoney(w.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>{f8.finance.reconTitle}</h2>
      <p className="muted">{f8.finance.reconSub}</p>
      <Alert kind={recon.ok ? 'ok' : 'error'} testid="finance-recon-status">{recon.ok ? f8.finance.reconOk : f8.finance.reconBad}</Alert>
      <div className="table-wrap">
        <table className="table" data-testid="finance-recon-table">
          <thead><tr><th>{f8.finance.colWallet}</th><th className="num">{f8.finance.colBalance}</th><th className="num">{f8.finance.colLedgerSum}</th><th className="num">{f8.finance.colDiff}</th></tr></thead>
          <tbody>
            {recon.rows.map((r) => {
              const key = r.projectCode ?? r.walletKind;
              return (
                <tr key={key} data-testid={tidOf('finance-recon-row', key)}>
                  <td>{r.projectCode ?? (f8.finance.walletKind[r.walletKind] ?? r.walletKind)}</td>
                  <td className="num">{fmtMoney(r.balance)}</td>
                  <td className="num">{fmtMoney(r.ledgerSum)}</td>
                  <td className="num" data-testid={tidOf('finance-diff', key)}>{fmtMoney(r.diff)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3}>{f8.finance.totalDiff}</th>
              <th className="num" data-testid="finance-total-diff">{fmtMoney(recon.totalDiff)}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <h2>{f8.finance.ledgerTitle}</h2>
      <SelectField label={f8.finance.pickProject} testid="finance-project-select" value={pick} onChange={(e) => setPick(e.target.value)}>
        <option value="">{f8.finance.pickPlaceholder}</option>
        {options.map((o) => <option key={o.code} value={o.code}>{o.code} {o.title}</option>)}
      </SelectField>
      {ledgerErr && <Alert kind="error" testid="finance-ledger-error">{ledgerErr}</Alert>}
      {ledger && (
        <div className="stack">
          <div className="grid" data-testid="finance-ledger-totals">
            {totals.map(([k, label, v]) => (
              <Card key={k} testid={`finance-ledger-${k}`}>
                <div className="card-body">
                  <div className="muted">{label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }} data-testid={`finance-ledger-${k}-value`}>{fmtMoney(v)}</div>
                </div>
              </Card>
            ))}
          </div>
          {ledger.entries.length === 0 ? <Empty testid="finance-ledger-empty">{f8.finance.ledgerEmpty}</Empty> : (
            <div className="table-wrap">
              <table className="table" data-testid="finance-ledger-table">
                <thead>
                  <tr>
                    <th>{f8.finance.colAt}</th><th>{f8.finance.colKind}</th><th className="num">{f8.finance.colAmount}</th>
                    <th>{f8.finance.colPayee}</th><th>{f8.finance.colMemo}</th>{hasDonor && <th>{f8.finance.colDonor}</th>}
                  </tr>
                </thead>
                <tbody>
                  {ledger.entries.map((e, i) => (
                    <tr key={i} data-testid={`finance-ledger-row-${i}`}>
                      <td>{fmtDateTime(e.at)}</td>
                      <td><Badge tone={e.kind === 'in' ? 'ok' : e.kind === 'fee' ? 'warn' : 'info'}>{f8.finance.kind[e.kind] ?? e.kind}</Badge></td>
                      <td className="num">{fmtMoney(e.amount)}</td>
                      <td>{e.payee ?? '-'}</td><td>{e.memo ?? '-'}</td>
                      {hasDonor && <td>{e.donorLabel ?? '-'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hasDonor && <p className="muted" data-testid="finance-donors-note">{f8.finance.donorsNote}</p>}
        </div>
      )}
    </div>
  );
}

export function FinanceView() {
  return <Gate role="finance" prefix="finance" path="/finance"><Body /></Gate>;
}
