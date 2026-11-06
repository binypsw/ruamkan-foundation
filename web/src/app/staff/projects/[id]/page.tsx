'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client/api';
import { fmtBaht, fmtDateTime } from '@/lib/format';
import { Alert, Badge, Button, Card, Empty, PageTitle, ProgressSet, TextArea, TextField } from '@/components/ui';
import { StaffGate } from '@/components/f7/StaffGate';
import { f7 } from '@/messages/f7';

const d = f7.detail;

interface Vouching { voucherName: string; distanceKm: number | string | null; status: string; photoUrl?: string | null; note?: string | null }
interface Review { decision?: string; result?: string; reason?: string | null; note?: string | null; reviewerName?: string; createdAt?: string; at?: string }

function Media({ url, kind, testid, label }: { url?: string | null; kind: 'audio' | 'video' | 'file'; testid: string; label: string }) {
  if (!url) return <p className="muted" data-testid={`${testid}-none`}>{label}: {d.noMedia}</p>;
  return (
    <div className="stack">
      <strong>{label}</strong>
      {kind === 'audio' && <audio controls src={url} data-testid={testid} aria-label={label} style={{ width: '100%' }} />}
      {kind === 'video' && <video controls src={url} data-testid={testid} aria-label={label} style={{ width: '100%', maxHeight: 360 }} />}
      {kind === 'file' && <a href={url} target="_blank" rel="noreferrer" data-testid={testid} className="btn btn-secondary">{label}</a>}
    </div>
  );
}

function ReviewPage({ id }: { id: string }) {
  const [p, setP] = useState<any>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState<string | null>(null);
  const [required, setRequired] = useState('');
  const [requiredErr, setRequiredErr] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const r = await api(`/api/staff/projects/${encodeURIComponent(id)}`);
    if (r.ok) {
      const proj = r.data.project ?? r.data;
      setP(proj);
      setLoadErr(null);
      setRequired(String(proj.vouchers?.required ?? ''));
    } else setLoadErr(r.error?.message ?? f7.loadError);
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const act = async (path: string, body: unknown, method: string, success: string) => {
    setBusy(true); setOk(null); setErr(null);
    const r = await api(`/api/staff/projects/${encodeURIComponent(id)}/${path}`, { method, body });
    setBusy(false);
    if (r.ok) { setOk(success); await load(); return true; }
    setErr(r.error?.message ?? f7.loadError);
    return false;
  };

  const doReject = async () => {
    if (!reason.trim()) { setReasonErr(d.rejectReasonEmpty); return; }
    setReasonErr(null);
    if (await act('reject', { reason: reason.trim() }, 'POST', d.rejectOk)) { setRejecting(false); setReason(''); }
  };
  const saveRequired = async () => {
    const n = Number(required);
    if (!Number.isInteger(n) || n < 1) { setRequiredErr(d.requiredInvalid); return; }
    setRequiredErr(null);
    await act('settings', { requiredVouchers: n }, 'PATCH', d.requiredOk);
  };

  const back = <Link href="/staff" data-testid="staff-detail-back" className="btn btn-ghost">{d.back}</Link>;

  if (loadErr && !p) {
    return <div className="stack">{back}<Alert kind="error" testid="staff-detail-load-error">{loadErr}</Alert></div>;
  }
  if (!p) return <p className="muted" data-testid="staff-detail-loading">{f7.loading}</p>;

  const vouchings: Vouching[] = p.vouchings ?? [];
  const reviews: Review[] = p.reviews ?? [];
  const milestones: any[] = p.milestones ?? [];
  const sens = p.sensitive ?? {};
  const closing = p.closing ?? {};
  const pending = p.status === 'pending';
  const suspended = p.status === 'suspended' || p.frozen;
  const canClose = p.status === 'active';

  return (
    <div className="stack">
      {back}
      <PageTitle sub={`${p.code} · ${d.title}`} testid="staff-detail-title">{p.title}</PageTitle>
      <div className="row">
        <Badge tone={p.status === 'active' ? 'ok' : p.status === 'pending' ? 'info' : 'danger'} testid="staff-detail-status">{f7.statusLabel[p.status] ?? p.status}</Badge>
        {p.urgent && <Badge tone="warn" testid="staff-detail-urgent">{f7.home.urgent}</Badge>}
        {p.reviewDueAt && pending && <span className="muted" data-testid="staff-detail-due">{d.dueAt}: {fmtDateTime(p.reviewDueAt)}</span>}
      </div>

      {ok && <Alert kind="ok" testid="staff-detail-success">{ok}</Alert>}
      {err && <Alert kind="error" testid="staff-detail-error">{err}</Alert>}
      {p.suspendReason && <Alert kind="warn" testid="staff-detail-suspend-reason">{d.suspendReason}: {p.suspendReason}</Alert>}
      {p.rejectReason && <Alert kind="info" testid="staff-detail-reject-reason">{d.rejectReason}: {p.rejectReason}</Alert>}

      <Card testid="staff-detail-summary">
        <div className="card-body stack">
          <div>{d.starter}: <span data-testid="staff-detail-starter">{p.starterName ?? '-'}</span></div>
          <div>{d.area}: <span data-testid="staff-detail-area">{p.areaProvince ?? '-'}</span></div>
          <div>{d.target}: <span data-testid="staff-detail-target">{p.goalAmount !== undefined ? fmtBaht(p.goalAmount) : '-'}</span></div>
          <div>{d.mode}: <span data-testid="staff-detail-mode">{f7.modeLabel[p.fundingMode] ?? p.fundingMode ?? '-'}</span></div>
          {p.bars && <ProgressSet bars={p.bars} testid="staff-detail-bars" />}
        </div>
      </Card>

      <Card testid="staff-detail-story">
        <div className="card-body stack">
          <h2>{d.story}</h2>
          <div><strong>{d.storyWhat}</strong><p data-testid="staff-detail-story-what">{p.storyWhat || '-'}</p></div>
          <div><strong>{d.storyWhere}</strong><p data-testid="staff-detail-story-where">{p.storyWhere || '-'}</p></div>
          <div><strong>{d.storyNeed}</strong><p data-testid="staff-detail-story-need">{p.storyNeed || '-'}</p></div>
        </div>
      </Card>

      <Card testid="staff-detail-media">
        <div className="card-body stack">
          <h2>{d.media}</h2>
          <Media url={p.voiceUrl} kind="audio" testid="staff-detail-voice" label={d.voice} />
          <Media url={p.videoUrl} kind="video" testid="staff-detail-video" label={d.video} />
          <Media url={p.evidenceUrl} kind="file" testid="staff-detail-evidence" label={d.evidence} />
          <div>
            <strong>{d.transcript}</strong>
            <p data-testid="staff-detail-transcript">{p.transcript || '-'}</p>
          </div>
        </div>
      </Card>

      <Card testid="staff-detail-vouchers">
        <div className="card-body stack">
          <h2>{d.vouchers}</h2>
          <p data-testid="staff-detail-vouchers-count">{d.vouchersCount} {p.vouchers?.accepted ?? 0}/{p.vouchers?.required ?? '-'}</p>
          {vouchings.length === 0 && <p className="muted" data-testid="staff-detail-vouchers-empty">{d.vouchersNone}</p>}
          {vouchings.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>{d.voucherName}</th><th>{d.voucherDistance}</th><th>{d.voucherStatus}</th><th>{d.voucherPhoto}</th><th>{d.voucherNote}</th></tr></thead>
                <tbody>
                  {vouchings.map((v, i) => (
                    <tr key={i} data-testid={`staff-detail-voucher-${i}`}>
                      <td>{v.voucherName}</td>
                      <td>{v.distanceKm ?? '-'}</td>
                      <td>{f7.statusLabel[v.status] ?? v.status}</td>
                      <td>{v.photoUrl ? <a href={v.photoUrl} target="_blank" rel="noreferrer" data-testid={`staff-detail-voucher-photo-${i}`}>{d.voucherPhoto}</a> : '-'}</td>
                      <td>{v.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card testid="staff-detail-phases">
        <div className="card-body stack">
          <h2>{d.phases}</h2>
          {milestones.length === 0 && <p className="muted" data-testid="staff-detail-phases-empty">{d.phaseNone}</p>}
          {milestones.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>{d.phaseSeq}</th><th>{d.phasePercent}</th><th>{d.phaseAmount}</th><th>{d.phaseStatus}</th></tr></thead>
                <tbody>
                  {milestones.map((m) => (
                    <tr key={m.id} data-testid={`staff-detail-phase-${m.seq}`}>
                      <td>{m.seq}</td><td>{m.percent}%</td><td>{fmtBaht(m.amount)}</td><td>{f7.statusLabel[m.status] ?? m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card testid="staff-detail-reviews">
        <div className="card-body stack">
          <h2>{d.reviews}</h2>
          {reviews.length === 0 && <p className="muted" data-testid="staff-detail-reviews-empty">{d.reviewsNone}</p>}
          {reviews.map((r, i) => (
            <div key={i} data-testid={`staff-detail-review-${i}`}>
              <strong>{r.decision ?? r.result ?? '-'}</strong>{' '}
              <span className="muted">{fmtDateTime(r.createdAt ?? r.at)}</span>
              {(r.reason || r.note) && <div>{r.reason ?? r.note}</div>}
            </div>
          ))}
        </div>
      </Card>

      <Card testid="staff-detail-sensitive">
        <div className="card-body stack">
          <h2>{d.sensitive}</h2>
          <p className="muted">{d.sensitiveHint}</p>
          <div><strong>{d.medical}</strong><p data-testid="staff-detail-medical">{sens.medical || d.none}</p></div>
          <div><strong>{d.address}</strong><p data-testid="staff-detail-address">{sens.addressDetail || d.none}</p></div>
        </div>
      </Card>

      <Card testid="staff-detail-settings">
        <div className="card-body stack">
          <h2>{d.settings}</h2>
          <TextField label={d.requiredLabel} testid="staff-required-input" type="number" min={1} step={1} inputMode="numeric" value={required} error={requiredErr} onChange={(e) => setRequired(e.target.value)} />
          <div><Button testid="staff-required-save" variant="secondary" disabled={busy} onClick={saveRequired}>{d.requiredSave}</Button></div>
        </div>
      </Card>

      <Card testid="staff-detail-actions">
        <div className="card-body stack">
          <h2>{d.actions}</h2>
          {pending && (
            <div className="row">
              <Button testid="staff-approve" disabled={busy} onClick={() => act('approve', {}, 'POST', d.approveOk)}>{d.approve}</Button>
              <Button testid="staff-reject-open" variant="danger" disabled={busy} onClick={() => setRejecting((v) => !v)} aria-expanded={rejecting}>{d.reject}</Button>
            </div>
          )}
          {pending && rejecting && (
            <div className="stack" data-testid="staff-reject-form">
              <TextArea label={d.rejectReasonLabel} testid="staff-reject-reason" value={reason} error={reasonErr} onChange={(e) => setReason(e.target.value)} />
              <div><Button testid="staff-reject-submit" variant="danger" disabled={busy} onClick={doReject}>{d.reject}</Button></div>
            </div>
          )}
          {!pending && !suspended && !canClose && <p className="muted" data-testid="staff-detail-no-actions">{f7.statusLabel[p.status] ?? p.status}</p>}
          {suspended && (
            <div className="stack">
              <TextField label={d.unsuspendNote} testid="staff-unsuspend-note" value={note} onChange={(e) => setNote(e.target.value)} />
              <div><Button testid="staff-unsuspend" disabled={busy} onClick={() => act('unsuspend', note.trim() ? { note: note.trim() } : {}, 'POST', d.unsuspendOk)}>{d.unsuspend}</Button></div>
            </div>
          )}
          {(canClose || suspended) && (
            <div className="stack" data-testid="staff-closing">
              <h3>{d.closing}</h3>
              <div data-testid="staff-closing-before">{d.closingBefore}: {closing.beforeUrl ? <a href={closing.beforeUrl} target="_blank" rel="noreferrer" data-testid="staff-closing-before-link">{d.closingBefore}</a> : d.closingMissing}</div>
              <div data-testid="staff-closing-after">{d.closingAfter}: {closing.afterUrl ? <a href={closing.afterUrl} target="_blank" rel="noreferrer" data-testid="staff-closing-after-link">{d.closingAfter}</a> : d.closingMissing}</div>
              <div data-testid="staff-closing-thanks">{d.closingThanks}: {closing.thanksVideoUrl ? <a href={closing.thanksVideoUrl} target="_blank" rel="noreferrer" data-testid="staff-closing-thanks-link">{d.closingThanks}</a> : d.closingMissing}</div>
              <div><Button testid="staff-close" variant="danger" disabled={busy} onClick={() => act('close', {}, 'POST', d.closeOk)}>{d.closeBtn}</Button></div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function StaffProjectPage({ params }: { params: { id: string } }) {
  return <StaffGate next={`/staff/projects/${params.id}`}><ReviewPage id={params.id} /></StaffGate>;
}
