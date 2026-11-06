'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client/api';
import { fmtDateTime } from '@/lib/format';
import { Alert, Badge, Button, Card, Empty, PageTitle } from '@/components/ui';
import { StaffGate, StaffTabs } from '@/components/f7/StaffGate';
import { f7 } from '@/messages/f7';

interface QueueRow {
  id: string; code: string; title: string; status: string; urgent: boolean; submittedAt: string | null;
  reviewDueAt: string | null; overdue: boolean; vouchersAccepted: number; vouchersRequired: number; starterName: string;
}
interface RewardRow { id: string; projectTitle: string; tier: number | string; description: string; overdue: boolean }

function StaffHome() {
  const [queue, setQueue] = useState<QueueRow[] | null>(null);
  const [queueErr, setQueueErr] = useState<string | null>(null);
  const [msCount, setMsCount] = useState<number | null>(null);
  const [flagCount, setFlagCount] = useState<number | null>(null);
  const [rewards, setRewards] = useState<RewardRow[] | null>(null);
  const [rewardsErr, setRewardsErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [actErr, setActErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [q, m, f, r] = await Promise.all([
      api('/api/staff/projects?status=pending'),
      api('/api/staff/milestones?status=requested'),
      api('/api/staff/flags'),
      api('/api/staff/rewards'),
    ]);
    if (q.ok) { setQueue(q.data.projects ?? []); setQueueErr(null); } else setQueueErr(q.error?.message ?? f7.loadError);
    if (m.ok) setMsCount((m.data.milestones ?? []).length);
    if (f.ok) setFlagCount((f.data.projects ?? []).length);
    if (r.ok) { setRewards(r.data.pending ?? []); setRewardsErr(null); } else setRewardsErr(r.error?.message ?? f7.loadError);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const delivered = async (id: string) => {
    setBusy(id); setOkMsg(null); setActErr(null);
    const r = await api(`/api/staff/rewards/${id}/delivered`, { method: 'POST', body: {} });
    setBusy(null);
    if (r.ok) { setOkMsg(f7.home.rewardDeliveredOk); void load(); } else setActErr(r.error?.message ?? f7.loadError);
  };

  const overdueCount = (queue ?? []).filter((p) => p.overdue).length;
  const stat = (testid: string, label: string, v: number | null) => (
    <Card testid={`staff-stat-${testid}`}>
      <div className="card-body">
        <div className="muted">{label}</div>
        <div className="num" data-testid={`staff-stat-${testid}-value`} style={{ fontSize: 28, fontWeight: 700 }}>{v === null ? '-' : v}</div>
      </div>
    </Card>
  );

  return (
    <div className="stack">
      <PageTitle sub={f7.home.sub} testid="staff-title">{f7.home.title}</PageTitle>
      <StaffTabs active="home" />
      {okMsg && <Alert kind="ok" testid="staff-success">{okMsg}</Alert>}
      {actErr && <Alert kind="error" testid="staff-error">{actErr}</Alert>}

      <div className="grid">
        {stat('pending', f7.home.countPending, queue ? queue.length : null)}
        {stat('overdue', f7.home.countOverdue, queue ? overdueCount : null)}
        {stat('milestones', f7.home.countMilestones, msCount)}
        {stat('flags', f7.home.countFlags, flagCount)}
        {stat('rewards', f7.home.countRewards, rewards ? rewards.length : null)}
      </div>

      <section aria-labelledby="queue-h" className="stack">
        <h2 id="queue-h">{f7.home.queueTitle}</h2>
        {queueErr && <Alert kind="error" testid="staff-queue-error">{queueErr}</Alert>}
        {queue && queue.length === 0 && <Empty testid="staff-queue-empty">{f7.home.queueEmpty}</Empty>}
        {queue && queue.length > 0 && (
          <div className="table-wrap">
            <table className="table" data-testid="staff-queue">
              <thead>
                <tr>
                  <th>{f7.home.colProject}</th><th>{f7.home.colStarter}</th><th>{f7.home.colSubmitted}</th>
                  <th>{f7.home.colDue}</th><th>{f7.home.colVouchers}</th><th>{f7.home.colStatus}</th><th>{f7.home.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((p) => (
                  <tr key={p.id} data-testid={`staff-queue-row-${p.code}`}>
                    <td>
                      <strong>{p.code}</strong> {p.title}{' '}
                      {p.urgent && <Badge tone="warn" testid={`staff-queue-urgent-${p.code}`}>{f7.home.urgent}</Badge>}
                    </td>
                    <td>{p.starterName}</td>
                    <td>{fmtDateTime(p.submittedAt)}</td>
                    <td>{fmtDateTime(p.reviewDueAt)}</td>
                    <td data-testid={`staff-queue-vouchers-${p.code}`}>{p.vouchersAccepted}/{p.vouchersRequired}</td>
                    <td>
                      {p.overdue
                        ? <Badge tone="danger" testid={`staff-queue-overdue-${p.code}`}>{f7.home.overdue}</Badge>
                        : <Badge tone="ok" testid={`staff-queue-ontime-${p.code}`}>{f7.home.onTime}</Badge>}
                    </td>
                    <td>
                      <Link href={`/staff/projects/${p.code}`} data-testid={`staff-queue-review-${p.code}`} className="btn btn-primary" aria-label={`${f7.home.review} ${p.code}`}>{f7.home.review}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="links-h" className="stack">
        <h2 id="links-h">{f7.home.linksTitle}</h2>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Link href="/staff/milestones" data-testid="staff-link-milestones" className="btn btn-secondary">{f7.nav.milestones}</Link>
          <Link href="/staff/flags" data-testid="staff-link-flags" className="btn btn-secondary">{f7.nav.flags}</Link>
        </div>
      </section>

      <section aria-labelledby="rewards-h" className="stack">
        <h2 id="rewards-h">{f7.home.rewardsTitle}</h2>
        {rewardsErr && <Alert kind="error" testid="staff-rewards-error">{rewardsErr}</Alert>}
        {rewards && rewards.length === 0 && <Empty testid="staff-rewards-empty">{f7.home.rewardsEmpty}</Empty>}
        {rewards && rewards.map((w) => (
          <Card key={w.id} testid={`staff-reward-${w.id}`}>
            <div className="card-body row" style={{ flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{w.projectTitle}</strong>{' '}
                <Badge testid={`staff-reward-tier-${w.id}`}>{f7.home.rewardTier} {w.tier}</Badge>{' '}
                {w.overdue && <Badge tone="danger" testid={`staff-reward-overdue-${w.id}`}>{f7.home.rewardOverdue}</Badge>}
                <div className="muted">{w.description}</div>
              </div>
              <Button testid={`staff-reward-delivered-${w.id}`} variant="secondary" disabled={busy === w.id} onClick={() => delivered(w.id)} aria-label={`${f7.home.rewardDelivered}: ${w.projectTitle}`}>{f7.home.rewardDelivered}</Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}

export default function StaffPage() {
  return <StaffGate next="/staff"><StaffHome /></StaffGate>;
}
