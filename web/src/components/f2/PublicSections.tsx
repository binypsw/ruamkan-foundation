'use client';
import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, TextArea } from '@/components/ui';
import { api, uploadFile } from '@/lib/client/api';
import { fmtBaht, fmtDateTime, fmtMoney } from '@/lib/format';
import { tidOf } from '@/lib/testid';
import { f2 } from '@/messages/f2';
import type { ProjectDetail } from './types';

/* ---------- ทำเนียบผู้ร่วมสร้าง ---------- */
export function SupportersSection({ p }: { p: ProjectDetail }) {
  const [rows, setRows] = useState<{ label: string; total: string; tier: number }[] | null>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    void api<{ supporters: { label: string; total: string; tier: number }[]; count: number }>(`/api/projects/${p.id}/supporters`).then((r) => {
      if (r.ok) { setRows(r.data.supporters); setCount(r.data.count); } else setRows([]);
    });
  }, [p.id, p.bars.money?.raised]);
  return (
    <section className="stack" aria-labelledby="sec-supporters" data-testid="project-supporters">
      <h2 id="sec-supporters">{f2.supporters}</h2>
      {rows === null ? <p className="muted">กำลังโหลด…</p> : rows.length === 0 ? <Empty testid="project-supporters-empty">{f2.supportersEmpty}</Empty> : (
        <>
          <p>{f2.supportersCount} <b data-testid="project-supporters-count">{count}</b> {f2.signUnit}</p>
          <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
            {rows.map((s, i) => (
              <li key={i} className="card card-body row" style={{ justifyContent: 'space-between' }} data-testid={tidOf('project-supporter', i + 1)}>
                <span data-testid={tidOf('project-supporter-label', i + 1)}>{s.label}</span>
                <span className="row">
                  <b data-testid={tidOf('project-supporter-total', i + 1)}>{fmtBaht(s.total)}</b>
                  <Badge tone={s.tier > 0 ? 'ok' : ''} testid={tidOf('project-supporter-tier', i + 1)}>{s.tier > 0 ? `${f2.supporterTier} ${s.tier}` : f2.supporterNoTier}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* ---------- สมุดบัญชีสาธารณะ ---------- */
interface Entry { at: string; kind: 'in' | 'fee' | 'out'; amount: string; payee?: string | null; memo?: string | null; donorLabel?: string | null }
export function LedgerSection({ p }: { p: ProjectDetail }) {
  const [data, setData] = useState<{ entries: Entry[]; totals: { in: string; fee: string; out: string; balance: string } } | null>(null);
  useEffect(() => {
    void api(`/api/projects/${p.id}/ledger`).then((r) => r.ok && setData(r.data));
  }, [p.id, p.bars.money?.raised]);
  const kindLabel: Record<string, string> = { in: f2.ledgerIn, fee: f2.ledgerFee, out: f2.ledgerOut };
  return (
    <section className="stack" aria-labelledby="sec-ledger" data-testid="project-ledger">
      <h2 id="sec-ledger">{f2.ledger}</h2>
      <p className="muted">{f2.ledgerHint}</p>
      {!data ? <p className="muted">กำลังโหลด…</p> : (
        <>
          <div className="grid">
            <Card><div className="card-body">{f2.ledgerTotalIn}<br /><b data-testid="project-ledger-total-in">{fmtMoney(data.totals.in)}</b></div></Card>
            <Card><div className="card-body">{f2.ledgerTotalFee}<br /><b data-testid="project-ledger-total-fee">{fmtMoney(data.totals.fee)}</b></div></Card>
            <Card><div className="card-body">{f2.ledgerTotalOut}<br /><b data-testid="project-ledger-total-out">{fmtMoney(data.totals.out)}</b></div></Card>
            <Card><div className="card-body">{f2.ledgerBalance}<br /><b data-testid="project-ledger-balance">{fmtMoney(data.totals.balance)}</b></div></Card>
          </div>
          {data.entries.length === 0 ? <Empty testid="project-ledger-empty">{f2.ledgerEmpty}</Empty> : (
            <div className="table-wrap">
              <table className="table" data-testid="project-ledger-table">
                <thead><tr><th>{f2.ledgerAt}</th><th>{f2.ledgerKind}</th><th className="num">{f2.ledgerAmount}</th><th>{f2.ledgerWho}</th><th>{f2.ledgerMemo}</th></tr></thead>
                <tbody>
                  {data.entries.map((e, i) => (
                    <tr key={i} data-testid={tidOf('project-ledger-row', i + 1)}>
                      <td>{fmtDateTime(e.at)}</td>
                      <td data-testid={tidOf('project-ledger-kind', i + 1)}>{kindLabel[e.kind] ?? e.kind}</td>
                      <td className="num" data-testid={tidOf('project-ledger-amount', i + 1)}>{fmtMoney(e.amount)}</td>
                      <td>{e.donorLabel ?? e.payee ?? '-'}</td>
                      <td>{e.memo ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- สิ่งตอบแทน ---------- */
export function RewardsSection({ p }: { p: ProjectDetail }) {
  return (
    <section className="stack" aria-labelledby="sec-rewards" data-testid="project-rewards">
      <h2 id="sec-rewards">{f2.rewards}</h2>
      {p.rewardTiers.length === 0 ? <Empty testid="project-rewards-empty">{f2.rewardsEmpty}</Empty> : (
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          {[...p.rewardTiers].sort((a, b) => a.tier - b.tier).map((t) => (
            <li key={t.tier} className="card card-body" data-testid={tidOf('project-reward', t.tier)}>
              <strong>{f2.supporterTier} {t.tier}</strong> · {f2.rewardMin} {fmtBaht(t.minAmount)}
              <div>{t.description}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- แจ้งเบาะแส ---------- */
export function FlagSection({ p, loggedIn, loginHref }: { p: ProjectDetail; loggedIn: boolean; loginHref: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'' | 'upload' | 'send'>('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ distinctReporters: number; suspended: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setErr('');
    if (!file) { setErr(f2.flagNoFile); return; }
    setBusy('upload');
    const up = await uploadFile(file);
    if (!up.ok) { setBusy(''); setErr(up.error?.message ?? ''); return; }
    setBusy('send');
    const r = await api<{ distinctReporters: number; suspended: boolean }>(`/api/projects/${p.id}/flags`, { body: { evidenceUrl: up.data.url, reason: reason.trim() || undefined } });
    setBusy('');
    if (!r.ok) { setErr(r.error?.message ?? ''); return; }
    setDone({ distinctReporters: r.data.distinctReporters, suspended: r.data.suspended });
    setFile(null); setReason(''); if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section className="stack" aria-labelledby="sec-flag" data-testid="project-flag">
      <h2 id="sec-flag">{f2.flag}</h2>
      <p className="muted">{f2.flagHint}</p>
      {!loggedIn ? (
        <p className="muted">{f2.loginNeeded} · <a data-testid="project-flag-login" href={loginHref}>{f2.loginLink}</a></p>
      ) : (
        <>
          <div>
            <Button variant="secondary" testid="project-flag-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? f2.flagClose : f2.flagOpen}</Button>
          </div>
          {open && (
            <div className="card card-body" data-testid="project-flag-form">
              <div className="field">
                <label htmlFor="project-flag-file">{f2.flagFile}</label>
                <input id="project-flag-file" ref={inputRef} data-testid="project-flag-file" className="input" type="file" accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <TextArea label={f2.flagReason} testid="project-flag-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div>
                <Button testid="project-flag-submit" disabled={busy !== ''} onClick={submit}>
                  {busy === 'upload' ? f2.flagUploading : busy === 'send' ? f2.flagSubmitting : f2.flagSubmit}
                </Button>
              </div>
              {err && <Alert kind="error" testid="project-flag-error">{err}</Alert>}
            </div>
          )}
          {done && (
            <Alert kind="ok" testid="project-flag-ok">
              {f2.flagOk} {f2.flagReporters}: <b data-testid="project-flag-reporters">{done.distinctReporters}</b>
              {done.suspended && <> · <span data-testid="project-flag-suspended">{f2.flagSuspended}</span></>}
            </Alert>
          )}
        </>
      )}
    </section>
  );
}
