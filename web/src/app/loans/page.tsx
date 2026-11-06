'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, PageTitle } from '@/components/ui';
import { api, useMe, useNow } from '@/lib/client/api';
import { fmtDate } from '@/lib/format';
import { f6 } from '@/messages/f6';
import { LoginNeeded } from '@/components/f6/common';

type AnyLoan = Record<string, any>;

const pick = (l: AnyLoan, ...keys: string[]) => {
  for (const k of keys) { const v = k.split('.').reduce((o: any, p) => (o == null ? undefined : o[p]), l); if (v !== undefined && v !== null) return v; }
  return undefined;
};
/** วันที่แบบไทยจากสตริงวันที่ (YYYY-MM-DD ไม่เลื่อนวันตามเขตเวลา) */
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(`${v}T12:00:00+07:00`) : fmtDate(v as string));
const ymd = (v: unknown) => (typeof v === 'string' ? v.slice(0, 10) : '');

export default function LoansPage() {
  const { me } = useMe();
  const now = useNow();
  const [loans, setLoans] = useState<AnyLoan[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ loans: AnyLoan[] }>('/api/me/loans');
    if (!r.ok) { setLoadErr(r.error?.message ?? f6.loadFailed); setLoans([]); return; }
    setLoadErr(null); setLoans(r.data.loans);
  }, []);
  useEffect(() => { if (me) void load(); }, [me, load]);

  async function giveBack(id: string) {
    setBusyId(id); setOkMsg(null);
    setErrs((p) => { const n = { ...p }; delete n[id]; return n; });
    const r = await api(`/api/loans/${id}/return`, { method: 'POST', body: {} });
    setBusyId(null);
    if (!r.ok) { setErrs((p) => ({ ...p, [id]: r.error?.message ?? f6.loadFailed })); return; }
    setOkMsg(f6.loans.returnOk);
    await load();
  }

  if (me === undefined) return <div className="container page"><p data-testid="loans-loading">{f6.loading}</p></div>;
  if (me === null) return <div className="container page"><PageTitle sub={f6.loans.sub}>{f6.loans.title}</PageTitle><LoginNeeded next="/loans" testid="loans" /></div>;

  const today = now ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now) : '';

  return (
    <div className="container page stack">
      <PageTitle sub={f6.loans.sub}>{f6.loans.title}</PageTitle>
      {okMsg && <Alert kind="ok" testid="loans-ok">{okMsg}</Alert>}
      {loadErr && <Alert kind="error" testid="loans-error">{loadErr}</Alert>}
      {loans === null && <p data-testid="loans-loading">{f6.loading}</p>}
      {loans && loans.length === 0 && !loadErr && <Empty testid="loans-empty">{f6.loans.empty}</Empty>}
      <div className="stack" data-testid="loans-list">
        {loans?.map((l, i) => {
          const id = String(pick(l, 'id', 'loanId') ?? i);
          const item = pick(l, 'itemName', 'item_name', 'contract.itemName') ?? '-';
          const start = pick(l, 'startDate', 'start_date', 'contract.startDate');
          const due = pick(l, 'dueDate', 'due_date', 'contract.dueDate');
          const returnedAt = pick(l, 'returnedAt', 'returned_at');
          const projectTitle = pick(l, 'projectTitle', 'project.title');
          const terms = pick(l, 'terms', 'contract.terms');
          let status: 'active' | 'returned' | 'overdue' = (pick(l, 'status', 'contract.status') ?? 'active') as any;
          if (status === 'active' && today && due && ymd(due) < today) status = 'overdue';
          const label = status === 'returned' ? f6.loans.returned : status === 'overdue' ? f6.loans.overdue : f6.loans.active;
          const tone = status === 'returned' ? 'ok' : status === 'overdue' ? 'danger' : 'info';
          return (
            <Card key={id} testid={`loan-${id}`}>
              <div className="card-body stack">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h2 style={{ margin: 0 }} data-testid={`loan-item-${id}`}>{String(item)}</h2>
                  <Badge tone={tone} testid={`loan-status-${id}`}>{label}</Badge>
                </div>
                {projectTitle && <p className="muted">{f6.loans.project}: {String(projectTitle)}</p>}
                <p>{f6.loans.start}: <span data-testid={`loan-start-${id}`}>{start ? day(start) : '-'}</span></p>
                <p>{f6.loans.due}: <strong data-testid={`loan-due-${id}`}>{due ? day(due) : '-'}</strong></p>
                {returnedAt && <p>{f6.loans.returnedAt}: <span data-testid={`loan-returned-${id}`}>{fmtDate(returnedAt)}</span></p>}
                {terms && <p className="muted">{f6.loans.terms}: {String(terms)}</p>}
                {errs[id] && <Alert kind="error" testid={`loan-error-${id}`}>{errs[id]}</Alert>}
                {status !== 'returned' && (
                  <div className="row">
                    <Button testid={`loan-return-${id}`} onClick={() => void giveBack(id)} disabled={busyId === id} aria-label={`${f6.loans.ret} ${String(item)}`}>
                      {busyId === id ? f6.loans.returning : f6.loans.ret}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
