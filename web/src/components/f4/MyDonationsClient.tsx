'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, LinkButton, PageTitle } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { fmtBaht, fmtDate, fmtDateTime, fmtMoney } from '@/lib/format';
import { f4 } from '@/messages/f4';

interface Donation {
  id: string; project: { id: string; code: string; title: string; status: string; outcome: string | null };
  amount: string; tip: string; status: string; paidAt: string | null; tier: number | null;
  receiptId: string | null; refundChoice: 'refund' | 'central' | null; refundDeadline: string | null; canChoose: boolean;
}
interface Choice { donationId: string; projectTitle: string; amount: string; deadline: string; dayNumber: number; choice: 'refund' | 'central' | null }

const choiceLabel = (c: string | null) => (c === 'refund' ? f4.my.choiceRefund : c === 'central' ? f4.my.choiceCentral : f4.my.choiceNone);

export default function MyDonationsClient() {
  const { me } = useMe();
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [choices, setChoices] = useState<Choice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([
      api<{ donations: Donation[] }>('/api/me/donations'),
      api<{ items: Choice[] }>('/api/me/refund-choices'),
    ]);
    if (d.ok) setDonations(d.data.donations); else { setDonations([]); setError(d.error?.message ?? null); }
    if (c.ok) setChoices(c.data.items); else { setChoices([]); setError((e) => e ?? c.error?.message ?? null); }
  }, []);

  useEffect(() => { if (me) void load(); }, [me, load]);

  async function choose(donationId: string, choice: 'refund' | 'central') {
    setError(null); setOk(null); setBusyId(donationId);
    const r = await api(`/api/donations/${donationId}/refund-choice`, { body: { choice } });
    setBusyId(null);
    if (!r.ok) { setError(r.error?.message ?? ''); return; }
    setOk(f4.my.choiceDone);
    await load();
  }

  if (me === undefined) return <div className="muted" data-testid="my-donations-loading">{f4.my.loading}</div>;
  if (me === null) {
    return (
      <div className="stack">
        <PageTitle testid="my-donations-title">{f4.my.title}</PageTitle>
        <Alert kind="info" testid="my-donations-login-needed">{f4.my.loginNeeded}</Alert>
        <LinkButton href="/login?next=%2Fmy%2Fdonations" testid="my-donations-login-link">{f4.my.loginLink}</LinkButton>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageTitle testid="my-donations-title">{f4.my.title}</PageTitle>
      {error && <Alert kind="error" testid="my-donations-error">{error}</Alert>}
      {ok && <Alert kind="ok" testid="my-donations-ok">{ok}</Alert>}

      <section aria-labelledby="refund-h" className="stack">
        <h2 id="refund-h">{f4.my.refundTitle}</h2>
        <p className="muted">{f4.my.refundIntro}</p>
        {choices === null ? <div className="muted">{f4.my.loading}</div> : choices.length === 0 ? (
          <Empty testid="refund-empty">{f4.my.refundNone}</Empty>
        ) : choices.map((c) => (
          <Card key={c.donationId} className="card-body" testid={`refund-item-${c.donationId}`}>
            <h3 data-testid={`refund-project-${c.donationId}`}>{c.projectTitle}</h3>
            <p>
              <span data-testid={`refund-amount-${c.donationId}`}>{fmtBaht(c.amount)}</span> · {f4.my.deadline} <span data-testid={`refund-deadline-${c.donationId}`}>{fmtDate(c.deadline)}</span> · <span data-testid={`refund-day-${c.donationId}`}>{f4.my.dayNumber(c.dayNumber)}</span>
            </p>
            <p>{f4.my.chosen}: <Badge testid={`refund-current-${c.donationId}`} tone={c.choice ? 'ok' : 'warn'}>{choiceLabel(c.choice)}</Badge></p>
            <div className="row">
              <Button testid={`refund-choose-refund-${c.donationId}`} variant="secondary" disabled={busyId === c.donationId} onClick={() => choose(c.donationId, 'refund')}>{f4.my.chooseRefund}</Button>
              <Button testid={`refund-choose-central-${c.donationId}`} disabled={busyId === c.donationId} onClick={() => choose(c.donationId, 'central')}>{f4.my.chooseCentral}</Button>
            </div>
          </Card>
        ))}
      </section>

      <section aria-labelledby="hist-h" className="stack">
        <h2 id="hist-h">{f4.my.historyTitle}</h2>
        {donations === null ? <div className="muted">{f4.my.loading}</div> : donations.length === 0 ? (
          <Empty testid="my-donations-empty">{f4.my.empty}</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table" data-testid="my-donations-table">
              <thead>
                <tr>
                  <th>{f4.my.colProject}</th><th className="num">{f4.my.colAmount}</th><th className="num">{f4.my.colTip}</th>
                  <th>{f4.my.colStatus}</th><th>{f4.my.colPaidAt}</th><th>{f4.my.colTier}</th><th>{f4.my.colChoice}</th><th>{f4.my.colReceipt}</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} data-testid={`my-donation-row-${d.id}`}>
                    <td>{d.project.title}</td>
                    <td className="num" data-testid={`my-donation-amount-${d.id}`}>{fmtMoney(d.amount)}</td>
                    <td className="num">{fmtMoney(d.tip)}</td>
                    <td data-testid={`my-donation-status-${d.id}`}>{f4.my.status[d.status] ?? d.status}</td>
                    <td>{fmtDateTime(d.paidAt)}</td>
                    <td>{f4.my.tier(d.tier)}</td>
                    <td data-testid={`my-donation-choice-${d.id}`}>{d.refundChoice ? choiceLabel(d.refundChoice) : d.canChoose ? f4.my.canChoose : '-'}</td>
                    <td>{d.receiptId
                      ? <LinkButton href={`/receipt/${d.id}`} variant="ghost" testid={`my-donation-receipt-${d.id}`} aria-label={`${f4.my.receipt} ${d.project.title}`}>{f4.my.receipt}</LinkButton>
                      : f4.my.noReceipt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
