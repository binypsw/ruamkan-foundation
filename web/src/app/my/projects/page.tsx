'use client';
import { useEffect, useState } from 'react';
import { api, useMe } from '@/lib/client/api';
import { fmtDateTime, fmtTimeLeft } from '@/lib/format';
import type { ProgressBars } from '@/types';
import { Alert, Badge, Card, Empty, LinkButton, PageTitle, ProgressSet } from '@/components/ui';
import { f3 } from '@/messages/f3';

interface MyProject {
  id: string; code: string; title: string; status: string; statusLabel: string; rejectReason: string | null; suspendReason: string | null;
  resubmitCount: number; canResubmit: boolean; endsAt: string | null; bars: ProgressBars;
  vouchers: { required: number; accepted: number }; reviewDueAt: string | null;
}
const TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | ''> = { pending: 'warn', active: 'ok', suspended: 'danger', rejected: 'danger', closed: 'info' };

export default function MyProjectsPage() {
  const { me } = useMe();
  const [list, setList] = useState<MyProject[] | null>(null);
  const [now, setNow] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    void api<{ projects: MyProject[]; now: string }>('/api/my/projects').then((r) => {
      if (r.ok) { setList(r.data.projects); setNow(r.data.now); } else setError(r.error?.message ?? 'โหลดไม่สำเร็จ');
    });
  }, [me]);

  if (me === undefined) return <p data-testid="myprojects-loading">{f3.loading}</p>;
  if (me === null) {
    return (
      <div className="stack">
        <Alert kind="warn" testid="myprojects-login-required">{f3.needLogin}</Alert>
        <LinkButton href="/login?next=/my/projects" testid="myprojects-login-link">{f3.loginLink}</LinkButton>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageTitle testid="myprojects-title" sub={f3.my.sub}>{f3.my.title}</PageTitle>
      <div className="row"><LinkButton href="/my/projects/new" testid="myprojects-new">{f3.my.newProject}</LinkButton></div>
      {error && <Alert kind="error" testid="myprojects-error">{error}</Alert>}
      {!error && list === null && <p data-testid="myprojects-loading">{f3.loading}</p>}
      {list && list.length === 0 && <Empty testid="myprojects-empty">{f3.my.empty}</Empty>}
      {list?.map((p) => (
        <Card key={p.id} testid={`myproject-${p.code}`}>
          <div className="card-body stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }} data-testid={`myproject-title-${p.code}`}>{p.title}</h2>
              <Badge tone={TONE[p.status] ?? ''} testid={`myproject-status-${p.code}`}>{p.statusLabel}</Badge>
            </div>
            <span className="muted" data-testid={`myproject-code-${p.code}`}>รหัส {p.code}</span>
            {p.status === 'rejected' && (
              <Alert kind="error" testid={`myproject-reject-reason-${p.code}`}>
                <strong>{f3.my.rejectReason}:</strong> {p.rejectReason ?? '-'}
                <div data-testid={`myproject-resubmit-${p.code}`}>
                  {p.canResubmit ? f3.my.resubmitLeft(Math.max(0, 2 - p.resubmitCount)) : f3.my.resubmitNone}
                  {' · '}{f3.my.resubmitCount(p.resubmitCount)}
                </div>
              </Alert>
            )}
            {p.status === 'suspended' && (
              <Alert kind="warn" testid={`myproject-suspend-reason-${p.code}`}><strong>{f3.my.suspendReason}:</strong> {p.suspendReason ?? '-'}</Alert>
            )}
            {p.status === 'pending' && (
              <div className="muted">
                <span data-testid={`myproject-vouchers-${p.code}`}>{f3.my.vouchers(p.vouchers.accepted, p.vouchers.required)}</span>
                {p.reviewDueAt && <span data-testid={`myproject-review-due-${p.code}`}> · {f3.my.reviewDue} {fmtDateTime(p.reviewDueAt)}</span>}
              </div>
            )}
            {p.status === 'active' && p.endsAt && <span className="muted" data-testid={`myproject-timeleft-${p.code}`}>{f3.my.timeLeft}: {fmtTimeLeft(p.endsAt, now)}</span>}
            {p.status !== 'pending' && p.status !== 'rejected' && <ProgressSet bars={p.bars} testid={`myproject-bars-${p.code}`} />}
            <div className="row">
              <LinkButton href={`/my/projects/${p.code}`} variant="secondary" testid={`myproject-view-${p.code}`} aria-label={`${f3.my.view} ${p.title}`}>{f3.my.view}</LinkButton>
              {p.status === 'rejected' && p.canResubmit && (
                <LinkButton href={`/my/projects/${p.code}/edit`} testid={`myproject-edit-${p.code}`} aria-label={`${f3.my.edit} ${p.title}`}>{f3.my.edit}</LinkButton>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
