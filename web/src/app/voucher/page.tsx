'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, PageTitle, TextArea } from '@/components/ui';
import { api, uploadFile, useMe } from '@/lib/client/api';
import { f6 } from '@/messages/f6';
import { LoginNeeded } from '@/components/f6/common';

interface Task {
  projectId: string; code: string; title: string; areaProvince?: string;
  distanceKm: number | string | null; eligible: boolean; reason?: string;
  myStatus: null | 'taken' | 'submitted'; takenAt?: string | null;
}

function SubmitForm({ task, onDone }: { task: Task; onDone: (msg: string) => void }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const code = task.code;

  async function pick(file: File | undefined) {
    setErr(null);
    if (!file) return;
    setBusy(true);
    const r = await uploadFile(file);
    setBusy(false);
    if (!r.ok) { setErr(r.error?.message ?? f6.loadFailed); return; }
    setPhotoUrl(r.data.url); setFileName(file.name);
  }
  async function submit() {
    setErr(null);
    if (!photoUrl) { setErr(f6.voucher.needPhoto); return; }
    setBusy(true);
    const r = await api(`/api/voucher/tasks/${task.projectId}/submit`, { body: { photoUrl, note: note || undefined } });
    setBusy(false);
    if (!r.ok) { setErr(r.error?.message ?? f6.loadFailed); return; }
    onDone(f6.voucher.submitOk);
  }
  return (
    <div className="stack" style={{ marginTop: 12 }}>
      <h3>{f6.voucher.submitTitle}</h3>
      <div className="field">
        <label htmlFor={`voucher-photo-${code}`}>{f6.voucher.photo}</label>
        <input id={`voucher-photo-${code}`} data-testid={`voucher-photo-input-${code}`} className="input" type="file" accept="image/*" onChange={(e) => void pick(e.target.files?.[0])} />
        <span className="field-hint">{fileName || f6.voucher.photoHint}</span>
      </div>
      {photoUrl && <p data-testid={`voucher-photo-url-${code}`} className="muted">{photoUrl}</p>}
      <TextArea label={f6.voucher.note} testid={`voucher-note-input-${code}`} value={note} onChange={(e) => setNote(e.target.value)} />
      {err && <Alert kind="error" testid={`voucher-submit-error-${code}`}>{err}</Alert>}
      <Button testid={`voucher-submit-${code}`} onClick={() => void submit()} disabled={busy}>{busy ? f6.voucher.submitting : f6.voucher.submit}</Button>
    </div>
  );
}

export default function VoucherPage() {
  const { me } = useMe();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ tasks: Task[] }>('/api/voucher/tasks');
    if (!r.ok) { setLoadErr(r.error?.message ?? f6.loadFailed); setTasks([]); return; }
    setLoadErr(null); setTasks(r.data.tasks);
  }, []);
  useEffect(() => { if (me) void load(); }, [me, load]);

  async function take(t: Task) {
    setBusyId(t.projectId); setOkMsg(null);
    setErrs((p) => { const n = { ...p }; delete n[t.projectId]; return n; });
    const r = await api(`/api/voucher/tasks/${t.projectId}/take`, { method: 'POST', body: {} });
    setBusyId(null);
    if (!r.ok) { setErrs((p) => ({ ...p, [t.projectId]: r.error?.message ?? f6.loadFailed })); return; }
    setOkMsg(f6.voucher.takeOk);
    await load();
  }

  if (me === undefined) return <div className="container page"><p data-testid="voucher-loading">{f6.loading}</p></div>;
  if (me === null) return <div className="container page"><PageTitle sub={f6.voucher.sub}>{f6.voucher.title}</PageTitle><LoginNeeded next="/voucher" testid="voucher" /></div>;

  return (
    <div className="container page stack">
      <PageTitle sub={f6.voucher.sub}>{f6.voucher.title}</PageTitle>
      {okMsg && <Alert kind="ok" testid="voucher-ok">{okMsg}</Alert>}
      {loadErr && <Alert kind="error" testid="voucher-error">{loadErr}</Alert>}
      {tasks === null && <p data-testid="voucher-loading">{f6.loading}</p>}
      {tasks && tasks.length === 0 && !loadErr && <Empty testid="voucher-empty">{f6.voucher.empty}</Empty>}
      <div className="stack" data-testid="voucher-list">
        {tasks?.map((t) => {
          const km = t.distanceKm === null || t.distanceKm === undefined ? null : Number(t.distanceKm).toFixed(2);
          return (
            <Card key={t.projectId} testid={`voucher-task-${t.code}`}>
              <div className="card-body stack">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h2 style={{ margin: 0 }}>{t.code} · {t.title}</h2>
                  {t.myStatus === 'taken' && <Badge tone="info" testid={`voucher-status-${t.code}`}>{f6.voucher.taken}</Badge>}
                  {t.myStatus === 'submitted' && <Badge tone="ok" testid={`voucher-status-${t.code}`}>{f6.voucher.submitted}</Badge>}
                  {!t.myStatus && <Badge tone={t.eligible ? 'ok' : 'danger'} testid={`voucher-status-${t.code}`}>{t.eligible ? f6.voucher.eligible : f6.voucher.notEligible}</Badge>}
                </div>
                {t.areaProvince && <p className="muted">{f6.voucher.area}: {t.areaProvince}</p>}
                {km !== null && <p>{f6.voucher.distance}: <strong data-testid={`voucher-distance-${t.code}`}>{km} {f6.voucher.km}</strong></p>}
                {!t.eligible && t.reason && !t.myStatus && <p data-testid={`voucher-reason-${t.code}`} className="field-error">{f6.voucher.reason}: {t.reason}</p>}
                {errs[t.projectId] && <Alert kind="error" testid={`voucher-take-error-${t.code}`}>{errs[t.projectId]}</Alert>}
                {!t.myStatus && (
                  <div className="row">
                    <Button testid={`voucher-take-${t.code}`} onClick={() => void take(t)} disabled={busyId === t.projectId} aria-label={`${f6.voucher.take} ${t.code}`}>
                      {busyId === t.projectId ? f6.voucher.taking : f6.voucher.take}
                    </Button>
                  </div>
                )}
                {t.myStatus === 'taken' && <SubmitForm task={t} onDone={(m) => { setOkMsg(m); void load(); }} />}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
