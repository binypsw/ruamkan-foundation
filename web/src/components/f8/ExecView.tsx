'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card } from '@/components/ui';
import { api } from '@/lib/client/api';
import { fmtDateTime, fmtMoney } from '@/lib/format';
import { f8 } from '@/messages/f8';
import { Gate } from './Gate';
import { BarChart, toUnits } from './BarChart';

interface Dash {
  projectsByStatus: Record<string, number>;
  moneyIn: string; moneyOut: string; fees: string; tips: string;
  pendingReview: number; now?: string;
}
const ORDER = ['pending', 'active', 'suspended', 'closed', 'rejected'];
const COLOR: Record<string, string> = { pending: '#b58300', active: '#2f6b2f', suspended: '#a31515', closed: '#1f2f4d', rejected: '#5c4c40' };

function Body() {
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    const r = await api<Dash>('/api/exec/dashboard');
    if (r.ok) setD(r.data); else setErr(r.error?.message ?? f8.forbidden);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (err) return (
    <div className="stack">
      <Alert kind="error" testid="exec-error">{err}</Alert>
      <Button variant="secondary" testid="exec-retry" onClick={() => void load()}>{f8.retry}</Button>
    </div>
  );
  if (!d) return <p className="muted" data-testid="exec-loading">{f8.loading}</p>;

  const money = [
    { key: 'in', label: f8.exec.moneyIn, v: d.moneyIn, color: '#2f6b2f' },
    { key: 'out', label: f8.exec.moneyOut, v: d.moneyOut, color: '#a8461f' },
    { key: 'fees', label: f8.exec.fees, v: d.fees, color: '#1f2f4d' },
    { key: 'tips', label: f8.exec.tips, v: d.tips, color: '#55642a' },
  ];
  const count = (s: string) => d.projectsByStatus?.[s] ?? 0;
  return (
    <div className="stack">
      {d.now && <p className="muted" data-testid="exec-now">{f8.exec.asOf} {fmtDateTime(d.now)}</p>}
      <h2>{f8.exec.statusTitle}</h2>
      <div className="grid" data-testid="exec-status-cards">
        {ORDER.map((s) => (
          <Card key={s} testid={`exec-status-${s}`}>
            <div className="card-body">
              <div className="muted">{f8.exec.status[s]}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }} data-testid={`exec-status-${s}-count`}>{count(s)}</div>
              <div className="muted">{f8.exec.unitProjects}</div>
            </div>
          </Card>
        ))}
        <Card testid="exec-pending-review">
          <div className="card-body">
            <div className="muted">{f8.exec.pendingReview}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }} data-testid="exec-pending-review-count">{d.pendingReview}</div>
            <div className="muted">{f8.exec.unitCases}</div>
          </div>
        </Card>
      </div>

      <h2>{f8.exec.moneyTitle}</h2>
      <div className="grid" data-testid="exec-money-cards">
        {money.map((m) => (
          <Card key={m.key} testid={`exec-money-${m.key}`}>
            <div className="card-body">
              <div className="muted">{m.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }} data-testid={`exec-money-${m.key}-value`}>{fmtMoney(m.v)}</div>
              <div className="muted">{f8.exec.unitBaht}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card testid="exec-chart-status-card">
        <div className="card-body">
          <BarChart testid="exec-chart-status" title={f8.exec.chartTitle}
            bars={ORDER.map((s) => ({ key: s, label: f8.exec.status[s], value: String(count(s)), raw: toUnits(count(s), 1), color: COLOR[s] }))} />
        </div>
      </Card>
      <Card testid="exec-chart-money-card">
        <div className="card-body">
          <BarChart testid="exec-chart-money" title={f8.exec.moneyChartTitle}
            bars={money.map((m) => ({ key: m.key, label: m.label, value: fmtMoney(m.v), raw: toUnits(m.v, 100), color: m.color }))} />
        </div>
      </Card>
    </div>
  );
}

export function ExecView() {
  return <Gate role="exec" prefix="exec" path="/exec"><Body /></Gate>;
}
