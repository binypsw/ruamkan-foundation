'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, Illustration, LinkButton, PageTitle, ProgressSet } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { FUNDING_LABEL, STATUS_LABEL, SUPPORT_LABEL, fmtDateTime, fmtTimeLeft } from '@/lib/format';
import { f2 } from '@/messages/f2';
import { ItemsSection, LoansSection, SignSection, SkillsSection } from './ActionSections';
import { FlagSection, LedgerSection, RewardsSection, SupportersSection } from './PublicSections';
import type { ProjectDetail } from './types';

function donateOffReason(p: ProjectDetail): string {
  if (!p.supportTypes.includes('money')) return f2.donateOffReason.noMoney;
  if (p.status !== 'active') return f2.donateOffReason.status;
  if (p.fundraisingState !== 'open') return f2.donateOffReason.ended;
  if (p.endsAt && new Date(p.endsAt).getTime() <= new Date(p.now).getTime()) return f2.donateOffReason.time;
  return f2.donateOffReason.generic;
}

export default function ProjectView({ idParam }: { idParam: string }) {
  const { me } = useMe();
  const [p, setP] = useState<ProjectDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    const r = await api<ProjectDetail>(`/api/projects/${encodeURIComponent(idParam)}`);
    if (r.ok) { setP(r.data); setState('ok'); }
    else { setErrMsg(r.error?.message ?? f2.notFound); setState((s) => (s === 'ok' ? s : 'missing')); }
  }, [idParam]);

  useEffect(() => { void load(); }, [load]);

  if (state === 'loading') return <p className="muted" data-testid="project-loading">{f2.loading}</p>;
  if (state === 'missing' || !p) {
    return (
      <div className="stack">
        <Alert kind="error" testid="project-error">{errMsg || f2.notFound}</Alert>
        <LinkButton href="/" variant="secondary" testid="project-back-home">{f2.backHome}</LinkButton>
      </div>
    );
  }

  const loggedIn = !!me;
  const loginHref = `/login?next=${encodeURIComponent(`/projects/${p.code}`)}`;
  const isActive = p.status === 'active';
  const showSuspended = p.status === 'suspended' || p.frozen;
  const canAct = isActive && !p.frozen;
  const t = p.supportTypes;
  const timeLeft = p.status === 'pending' || p.status === 'rejected' ? null : fmtTimeLeft(p.endsAt, p.now);

  return (
    <div className="stack">
      <PageTitle testid="project-title" sub={<>{f2.area} {p.areaProvince} · {f2.starter} <span data-testid="project-starter">{p.starterName}</span></>}>{p.title}</PageTitle>

      <div className="row">
        <Badge tone={p.status === 'active' ? 'ok' : p.status === 'suspended' ? 'danger' : p.status === 'closed' ? 'info' : 'warn'} testid="project-status">{STATUS_LABEL[p.status] ?? p.status}</Badge>
        <span data-testid="project-code" className="muted">{p.code}</span>
        {p.urgent && <Badge tone="danger" testid="project-urgent">ด่วน</Badge>}
        {t.map((x) => <Badge key={x} testid={`project-type-${x}`}>{SUPPORT_LABEL[x] ?? x}</Badge>)}
        <span className="muted" data-testid="project-funding">{f2.funding}: {FUNDING_LABEL[p.fundingMode] ?? p.fundingMode}</span>
      </div>

      {showSuspended && (
        <Alert kind="warn" testid="project-suspended">
          <b>{f2.suspendedTitle}</b> <span data-testid="project-suspend-reason">{p.suspendReason || f2.suspendedNoReason}</span>
        </Alert>
      )}
      {p.status === 'closed' && (
        <Alert kind="info" testid="project-closed">
          <b>{f2.closedTitle}</b>{' '}
          <span data-testid="project-closed-reason">{p.outcome === 'success' ? f2.closedSuccess : p.outcome === 'failed' ? f2.closedFailed : f2.closedGeneric}</span>
        </Alert>
      )}
      {(p.status === 'pending' || p.status === 'rejected') && (
        <Alert kind="info" testid="project-unpublished">
          {f2.rejectedNote}{p.rejectReason ? <> · {f2.rejectReason}: <span data-testid="project-reject-reason">{p.rejectReason}</span></> : null}
        </Alert>
      )}

      <Card>
        <Illustration seed={p.code} />
        <div className="card-body stack">
          <h2>{f2.progress}</h2>
          <ProgressSet bars={p.bars} testid="project-progress" />
          {timeLeft && <p>{f2.timeLeft}: <b data-testid="project-time-left">{timeLeft}</b>{p.endsAt && <span className="muted"> ({fmtDateTime(p.endsAt)})</span>}</p>}
          {p.outcome && <p data-testid="project-outcome" className="muted">ผลโครงการ: {f2.outcome[p.outcome] ?? p.outcome}</p>}
          <div className="row">
            {p.acceptingDonations ? (
              <LinkButton href={`/donate/${p.code}`} testid="project-donate">{f2.donate}</LinkButton>
            ) : (
              <>
                <Button testid="project-donate-disabled" disabled aria-disabled="true">{f2.donate}</Button>
                <span className="muted" data-testid="project-donate-reason">{donateOffReason(p)}</span>
              </>
            )}
          </div>
        </div>
      </Card>

      <section className="stack" aria-labelledby="sec-story" data-testid="project-story">
        <h2 id="sec-story">{f2.story}</h2>
        {p.voiceUrl && (
          <div><p>{f2.voice}</p><audio controls src={p.voiceUrl} data-testid="project-voice" aria-label={f2.voice} style={{ width: '100%' }} /></div>
        )}
        {p.videoUrl && (
          <div><p>{f2.video}</p><video controls src={p.videoUrl} data-testid="project-video" aria-label={f2.video} style={{ width: '100%', maxHeight: 420 }} /></div>
        )}
        {p.transcript && (
          <div className="card card-body"><b>{f2.transcript}</b><p data-testid="project-transcript" style={{ whiteSpace: 'pre-wrap' }}>{p.transcript}</p></div>
        )}
        {p.storyWhat && <div><h3>{f2.storyWhat}</h3><p data-testid="project-story-what" style={{ whiteSpace: 'pre-wrap' }}>{p.storyWhat}</p></div>}
        {p.storyWhere && <div><h3>{f2.storyWhere}</h3><p data-testid="project-story-where" style={{ whiteSpace: 'pre-wrap' }}>{p.storyWhere}</p></div>}
        {p.storyNeed && <div><h3>{f2.storyNeed}</h3><p data-testid="project-story-need" style={{ whiteSpace: 'pre-wrap' }}>{p.storyNeed}</p></div>}
        {p.evidenceUrl && <p><a data-testid="project-evidence" href={p.evidenceUrl} target="_blank" rel="noopener noreferrer">{f2.evidence}</a></p>}
        {p.closing && (p.closing.beforeUrl || p.closing.afterUrl || p.closing.thanksVideoUrl) && (
          <div className="grid" data-testid="project-closing">
            {p.closing.beforeUrl && <figure><img src={p.closing.beforeUrl} alt={f2.closingBefore} data-testid="project-closing-before" style={{ width: '100%' }} /><figcaption>{f2.closingBefore}</figcaption></figure>}
            {p.closing.afterUrl && <figure><img src={p.closing.afterUrl} alt={f2.closingAfter} data-testid="project-closing-after" style={{ width: '100%' }} /><figcaption>{f2.closingAfter}</figcaption></figure>}
            {p.closing.thanksVideoUrl && <figure><video controls src={p.closing.thanksVideoUrl} aria-label={f2.closingThanks} data-testid="project-closing-thanks" style={{ width: '100%' }} /><figcaption>{f2.closingThanks}</figcaption></figure>}
          </div>
        )}
      </section>

      {!canAct && p.status !== 'pending' && p.status !== 'rejected' && (
        <Alert kind="info" testid="project-actions-closed">{f2.notOpenForActions}</Alert>
      )}

      {t.includes('item') && <ItemsSection p={p} loggedIn={loggedIn} canAct={canAct} loginHref={loginHref} reload={load} />}
      {t.includes('labor') && <SkillsSection p={p} loggedIn={loggedIn} canAct={canAct} loginHref={loginHref} reload={load} />}
      {t.includes('loan') && <LoansSection p={p} loggedIn={loggedIn} canAct={canAct} loginHref={loginHref} reload={load} />}
      {(t.includes('advocacy') || p.signatures.goal !== null) && <SignSection p={p} loggedIn={loggedIn} canAct={canAct} loginHref={loginHref} reload={load} />}

      <RewardsSection p={p} />
      <SupportersSection p={p} />
      <LedgerSection p={p} />
      {(isActive || p.status === 'suspended') && <FlagSection p={p} loggedIn={loggedIn} loginHref={loginHref} />}
    </div>
  );
}
