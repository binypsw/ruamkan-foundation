'use client';
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, TextField } from '@/components/ui';
import { api } from '@/lib/client/api';
import { fmtDate } from '@/lib/format';
import { tidOf } from '@/lib/testid';
import { f2 } from '@/messages/f2';
import type { ProjectDetail } from './types';

interface Common { p: ProjectDetail; loggedIn: boolean; canAct: boolean; loginHref: string; reload: () => void }

function LoginHint({ href, testid }: { href: string; testid: string }) {
  return <p className="muted">{f2.loginNeeded} · <a data-testid={testid} href={href}>{f2.loginLink}</a></p>;
}

/* ---------- สิ่งของ ---------- */
interface PledgeLabel { trackingNo: string; itemName: string; qty: number; projectTitle: string; recipient: string; note?: string }

export function ItemsSection({ p, loggedIn, canAct, loginHref, reload }: Common) {
  const [qty, setQty] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState<Record<string, PledgeLabel>>({});

  async function pledge(id: string) {
    const n = Number(qty[id] ?? '1');
    setErr((e) => ({ ...e, [id]: '' }));
    if (!Number.isInteger(n) || n < 1) { setErr((e) => ({ ...e, [id]: 'กรุณากรอกจำนวนเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป' })); return; }
    setBusy(id);
    const r = await api<{ pledge: { trackingNo: string }; label: PledgeLabel }>(`/api/items/${id}/pledge`, { body: { qty: n } });
    setBusy(null);
    if (!r.ok) { setErr((e) => ({ ...e, [id]: r.error?.message ?? '' })); return; }
    setLabels((l) => ({ ...l, [id]: r.data.label }));
    reload();
  }

  return (
    <section className="stack" aria-labelledby="sec-items" data-testid="project-items">
      <h2 id="sec-items">{f2.items}</h2>
      {p.items.length === 0 && <Empty testid="project-items-empty">{f2.itemsEmpty}</Empty>}
      {!loggedIn && p.items.length > 0 && <LoginHint href={loginHref} testid="project-items-login" />}
      {p.items.map((it) => {
        const full = it.remaining <= 0;
        const lb = labels[it.id];
        return (
          <Card key={it.id} testid={tidOf('project-item', it.id)}>
            <div className="card-body stack">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong data-testid={tidOf('project-item-name', it.id)}>{it.name}</strong>
                {full && <Badge tone="ok" testid={tidOf('project-item-full', it.id)}>{f2.itemFull}</Badge>}
              </div>
              <div className="row">
                <span>{f2.itemNeeded} <b data-testid={tidOf('project-item-needed', it.id)}>{it.needed}</b></span>
                <span>{f2.itemReserved} <b data-testid={tidOf('project-item-reserved', it.id)}>{it.reserved}</b></span>
                <span>{f2.itemRemaining} <b data-testid={tidOf('project-item-remaining', it.id)}>{it.remaining}</b></span>
              </div>
              {loggedIn && canAct && !full && (
                <div className="row" style={{ alignItems: 'flex-end' }}>
                  <div style={{ width: 160 }}>
                    <TextField label={f2.itemQty} testid={tidOf('project-item-qty', it.id)} type="number" min={1} max={it.remaining} inputMode="numeric"
                      value={qty[it.id] ?? '1'} onChange={(e) => setQty((q) => ({ ...q, [it.id]: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <Button testid={tidOf('project-item-pledge', it.id)} disabled={busy === it.id} onClick={() => pledge(it.id)}>
                      {busy === it.id ? f2.itemPledging : f2.itemPledge}
                    </Button>
                  </div>
                </div>
              )}
              {err[it.id] && <Alert kind="error" testid={tidOf('project-item-error', it.id)}>{err[it.id]}</Alert>}
              {lb && (
                <div className="card card-body" data-testid={tidOf('project-pledge-label', it.id)} style={{ borderStyle: 'dashed', borderWidth: 2 }}>
                  <h3>{f2.labelTitle}</h3>
                  <p>{f2.labelTracking}: <b data-testid={tidOf('project-pledge-tracking', it.id)}>{lb.trackingNo}</b></p>
                  <p>{f2.labelItem}: <span data-testid={tidOf('project-pledge-item', it.id)}>{lb.itemName}</span> · {f2.labelQty}: <span data-testid={tidOf('project-pledge-qty', it.id)}>{lb.qty}</span></p>
                  <p>{f2.labelProject}: {lb.projectTitle}</p>
                  <p>{f2.labelRecipient}: <span data-testid={tidOf('project-pledge-recipient', it.id)}>{lb.recipient}</span></p>
                  {lb.note && <p className="muted">{f2.labelNote}: {lb.note}</p>}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </section>
  );
}

/* ---------- ทักษะอาสา ---------- */
export function SkillsSection({ p, loggedIn, canAct, loginHref, reload }: Common) {
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loggedIn || p.skills.length === 0) return;
    void api<{ needs: { id: string; signedUp: boolean }[] }>('/api/volunteer/needs').then((r) => {
      if (r.ok) setMine(new Set(r.data.needs.filter((n) => n.signedUp).map((n) => n.id)));
    });
  }, [loggedIn, p.skills.length, p.id]);

  async function signup(id: string) {
    setBusy(id); setErr((e) => ({ ...e, [id]: '' }));
    const r = await api(`/api/volunteer/needs/${id}/signup`, { body: {} });
    setBusy(null);
    if (!r.ok) { setErr((e) => ({ ...e, [id]: r.error?.message ?? '' })); return; }
    setMine((m) => new Set(m).add(id)); setOk((o) => ({ ...o, [id]: true }));
    reload();
  }

  return (
    <section className="stack" aria-labelledby="sec-skills" data-testid="project-skills">
      <h2 id="sec-skills">{f2.skills}</h2>
      {p.skills.length === 0 && <Empty testid="project-skills-empty">{f2.skillsEmpty}</Empty>}
      {!loggedIn && p.skills.length > 0 && <LoginHint href={loginHref} testid="project-skills-login" />}
      {p.skills.map((s) => {
        const full = s.joined >= s.headcount;
        const signed = mine.has(s.id);
        return (
          <Card key={s.id} testid={tidOf('project-skill', s.id)}>
            <div className="card-body stack">
              <strong data-testid={tidOf('project-skill-name', s.id)}>{s.skill}</strong>
              <div className="row">
                <span>{f2.skillHeadcount} {s.headcount} {f2.signUnit}</span>
                <span>{f2.skillJoined} <b data-testid={tidOf('project-skill-joined', s.id)}>{s.joined}</b> {f2.signUnit}</span>
                <span>{f2.skillWorkDate}: {fmtDate(s.workDate)}</span>
              </div>
              <p data-testid={tidOf('project-skill-checkedin', s.id)}>มาแล้ว {s.checkedIn}/{s.headcount} คน</p>
              {loggedIn && canAct && (
                <div>
                  <Button testid={tidOf('project-skill-signup', s.id)} disabled={busy === s.id || full || signed} onClick={() => signup(s.id)}>
                    {signed ? f2.skillSigned : full ? f2.skillFull : busy === s.id ? f2.skillSigning : f2.skillSignup}
                  </Button>
                </div>
              )}
              {err[s.id] && <Alert kind="error" testid={tidOf('project-skill-error', s.id)}>{err[s.id]}</Alert>}
              {ok[s.id] && <Alert kind="ok" testid={tidOf('project-skill-ok', s.id)}>{f2.skillSignupOk}</Alert>}
            </div>
          </Card>
        );
      })}
    </section>
  );
}

/* ---------- ขอยืม ---------- */
interface Contract { itemName: string; startDate: string; dueDate: string; status: string; terms?: string }

export function LoansSection({ p, loggedIn, canAct, loginHref, reload }: Common) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [contracts, setContracts] = useState<Record<string, Contract>>({});

  async function lend(id: string) {
    setBusy(id); setErr((e) => ({ ...e, [id]: '' }));
    const r = await api<{ contract: Contract }>(`/api/loan-requests/${id}/lend`, { body: {} });
    setBusy(null);
    if (!r.ok) { setErr((e) => ({ ...e, [id]: r.error?.message ?? '' })); return; }
    setContracts((c) => ({ ...c, [id]: r.data.contract }));
    reload();
  }

  return (
    <section className="stack" aria-labelledby="sec-loans" data-testid="project-loans">
      <h2 id="sec-loans">{f2.loans}</h2>
      {p.loanRequests.length === 0 && <Empty testid="project-loans-empty">{f2.loansEmpty}</Empty>}
      {!loggedIn && p.loanRequests.length > 0 && <LoginHint href={loginHref} testid="project-loans-login" />}
      {p.loanRequests.map((l) => {
        const c = contracts[l.id];
        return (
          <Card key={l.id} testid={tidOf('project-loan', l.id)}>
            <div className="card-body stack">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong data-testid={tidOf('project-loan-name', l.id)}>{l.itemName}</strong>
                <span>{f2.loanDays} {l.days} วัน</span>
              </div>
              {l.activeLoan && <Badge tone="info" testid={tidOf('project-loan-taken', l.id)}>{f2.loanTaken}</Badge>}
              {loggedIn && canAct && (
                <div>
                  <Button testid={tidOf('project-loan-lend', l.id)} disabled={busy === l.id || l.activeLoan} onClick={() => lend(l.id)}>
                    {busy === l.id ? f2.loanLending : l.activeLoan ? f2.loanTaken : f2.loanLend}
                  </Button>
                </div>
              )}
              {err[l.id] && <Alert kind="error" testid={tidOf('project-loan-error', l.id)}>{err[l.id]}</Alert>}
              {c && (
                <div className="card card-body" data-testid={tidOf('project-loan-contract', l.id)} style={{ borderStyle: 'dashed', borderWidth: 2 }}>
                  <h3>{f2.contractTitle}</h3>
                  <p>{c.itemName}</p>
                  <p>{f2.contractStart}: <span data-testid={tidOf('project-loan-start', l.id)}>{fmtDate(c.startDate)}</span></p>
                  <p>{f2.contractDue}: <span data-testid={tidOf('project-loan-due', l.id)}>{fmtDate(c.dueDate)}</span></p>
                  <p>{f2.contractStatus}: {f2.loanStatus[c.status] ?? c.status}</p>
                  {c.terms && <p className="muted">{f2.contractTerms}: {c.terms}</p>}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </section>
  );
}

/* ---------- ลงชื่อสนับสนุน ---------- */
export function SignSection({ p, loggedIn, canAct, loginHref }: Common) {
  const [count, setCount] = useState(p.signatures.count);
  const [goal, setGoal] = useState<number | null>(p.signatures.goal);
  const [mine, setMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setCount(p.signatures.count); setGoal(p.signatures.goal); }, [p.signatures.count, p.signatures.goal]);
  useEffect(() => {
    if (!loggedIn) return;
    void api<{ signedByMe: boolean }>(`/api/projects/${p.id}/signatures`).then((r) => r.ok && setMine(!!r.data.signedByMe));
  }, [loggedIn, p.id]);

  async function sign() {
    setBusy(true); setErr('');
    const r = await api<{ count: number; goal: number | null }>(`/api/projects/${p.id}/sign`, { body: {} });
    setBusy(false);
    if (!r.ok) { setErr(r.error?.message ?? ''); return; }
    setCount(r.data.count); if (r.data.goal !== undefined) setGoal(r.data.goal); setMine(true);
  }

  return (
    <section className="stack" aria-labelledby="sec-sign" data-testid="project-sign">
      <h2 id="sec-sign">{f2.sign}</h2>
      <p className="muted">{f2.signHint}</p>
      <p>{f2.signCount} <b data-testid="project-sign-count">{count}</b>{goal !== null && goal !== undefined && <> {f2.signOf} <span data-testid="project-sign-goal">{goal}</span></>} {f2.signUnit}</p>
      {!loggedIn && <LoginHint href={loginHref} testid="project-sign-login" />}
      {loggedIn && canAct && (
        <div>
          <Button testid="project-sign-submit" disabled={busy || mine} onClick={sign}>{mine ? f2.signedByMe : busy ? f2.signing : f2.signButton}</Button>
        </div>
      )}
      {mine && <Alert kind="ok" testid="project-sign-ok">{f2.signedByMe}</Alert>}
      {err && <Alert kind="error" testid="project-sign-error">{err}</Alert>}
    </section>
  );
}
