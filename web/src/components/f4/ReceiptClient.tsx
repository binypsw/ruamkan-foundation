'use client';
import { useEffect, useState } from 'react';
import { Alert, Button, Card, LinkButton, PageTitle } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { fmtDateTime, fmtMoney } from '@/lib/format';
import { f4 } from '@/messages/f4';

interface Receipt {
  receiptNo: string; issuedAt: string; donorName: string; projectTitle: string;
  amount: string; tip: string; total: string; edonation: boolean; kind: 'ordinary' | 'edonation';
}

export default function ReceiptClient({ donationId }: { donationId: string }) {
  const { me } = useMe();
  const [receipt, setReceipt] = useState<Receipt | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    void api<{ receipt: Receipt }>(`/api/receipts/${encodeURIComponent(donationId)}`).then((r) => {
      if (r.ok) setReceipt(r.data.receipt);
      else { setError(r.error?.message ?? f4.receipt.empty); setReceipt(null); }
    });
  }, [me, donationId]);

  if (me === undefined) return <div className="muted" data-testid="receipt-loading">กำลังโหลด…</div>;
  if (me === null) {
    return (
      <div className="stack">
        <PageTitle testid="receipt-title">{f4.receipt.title}</PageTitle>
        <Alert kind="info" testid="receipt-login-needed">{f4.receipt.loginNeeded}</Alert>
        <LinkButton href={`/login?next=${encodeURIComponent(`/receipt/${donationId}`)}`} testid="receipt-login-link">{f4.receipt.loginLink}</LinkButton>
      </div>
    );
  }
  if (receipt === undefined) return <div className="muted" data-testid="receipt-loading">กำลังโหลด…</div>;
  if (receipt === null) {
    return (
      <div className="stack">
        <PageTitle testid="receipt-title">{f4.receipt.title}</PageTitle>
        <Alert kind="error" testid="receipt-error">{error}</Alert>
        <LinkButton href="/my/donations" variant="secondary" testid="receipt-back">{f4.receipt.back}</LinkButton>
      </div>
    );
  }
  const ed = receipt.kind === 'edonation' || receipt.edonation;
  return (
    <div className="stack">
      <PageTitle testid="receipt-title">{ed ? f4.receipt.titleEdonation : f4.receipt.title}</PageTitle>
      <Card className="card-body" testid="receipt-card">
        <dl style={{ margin: 0 }}>
          <R label={f4.receipt.no} value={receipt.receiptNo} testid="receipt-no" />
          <R label={f4.receipt.issuedAt} value={fmtDateTime(receipt.issuedAt)} testid="receipt-issued-at" />
          <R label={f4.receipt.donor} value={receipt.donorName} testid="receipt-donor" />
          <R label={f4.receipt.project} value={receipt.projectTitle} testid="receipt-project" />
          <R label={f4.receipt.amount} value={`${fmtMoney(receipt.amount)} บาท`} testid="receipt-amount" />
          <R label={f4.receipt.tip} value={`${fmtMoney(receipt.tip)} บาท`} testid="receipt-tip" />
          <R label={f4.receipt.total} value={`${fmtMoney(receipt.total)} บาท`} testid="receipt-total" strong />
        </dl>
        <p style={{ marginTop: 12 }}>
          <span className={`badge ${ed ? 'badge-info' : ''}`} data-testid="receipt-kind">{ed ? f4.receipt.edonation : f4.receipt.ordinary}</span>
        </p>
      </Card>
      <div className="row">
        <Button testid="receipt-print" variant="secondary" onClick={() => window.print()}>{f4.receipt.print}</Button>
        <LinkButton href="/my/donations" variant="ghost" testid="receipt-back">{f4.receipt.back}</LinkButton>
      </div>
    </div>
  );
}

function R({ label, value, testid, strong }: { label: string; value: string; testid: string; strong?: boolean }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontWeight: strong ? 700 : 400 }}>
      <dt>{label}</dt>
      <dd style={{ margin: 0 }} data-testid={testid}>{value}</dd>
    </div>
  );
}
