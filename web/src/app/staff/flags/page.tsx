'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client/api';
import { fmtDateTime } from '@/lib/format';
import { Alert, Badge, Button, Card, Empty, PageTitle } from '@/components/ui';
import { StaffGate, StaffTabs } from '@/components/f7/StaffGate';
import { f7 } from '@/messages/f7';

const t = f7.flags;

interface Flag { id: string; projectCode: string; reporterName: string; reason: string | null; evidenceUrl: string | null; createdAt: string }
interface FlagProject { code: string; title: string; distinctReporters: number; frozen: boolean }

function FlagsView() {
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [projects, setProjects] = useState<FlagProject[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api('/api/staff/flags');
    if (r.ok) { setFlags(r.data.flags ?? []); setProjects(r.data.projects ?? []); setLoadErr(null); } else setLoadErr(r.error?.message ?? f7.loadError);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const unsuspend = async (code: string) => {
    setBusy(code); setOk(null); setErr(null);
    const r = await api(`/api/staff/projects/${encodeURIComponent(code)}/unsuspend`, { method: 'POST', body: {} });
    setBusy(null);
    if (r.ok) { setOk(t.unsuspendOk); void load(); } else setErr(r.error?.message ?? f7.loadError);
  };

  return (
    <div className="stack">
      <PageTitle sub={t.sub} testid="staff-flags-title">{t.title}</PageTitle>
      <StaffTabs active="flags" />
      {ok && <Alert kind="ok" testid="staff-flags-success">{ok}</Alert>}
      {err && <Alert kind="error" testid="staff-flags-error">{err}</Alert>}
      {loadErr && <Alert kind="error" testid="staff-flags-load-error">{loadErr}</Alert>}

      <section aria-labelledby="fp-h" className="stack">
        <h2 id="fp-h">{t.projectsTitle}</h2>
        {projects && projects.length === 0 && <Empty testid="staff-flags-projects-empty">{t.projectsEmpty}</Empty>}
        {projects && projects.map((p) => (
          <Card key={p.code} testid={`staff-flag-project-${p.code}`}>
            <div className="card-body row" style={{ justifyContent: 'space-between' }}>
              <div>
                <Link href={`/staff/projects/${p.code}`} data-testid={`staff-flag-project-link-${p.code}`}><strong>{p.code}</strong> {p.title}</Link>
                <div>{t.reporters}: <span className="num" data-testid={`staff-flag-reporters-${p.code}`}>{p.distinctReporters}</span></div>
              </div>
              <div className="row">
                <Badge tone={p.frozen ? 'danger' : 'info'} testid={`staff-flag-state-${p.code}`}>{p.frozen ? t.frozen : t.notFrozen}</Badge>
                {p.frozen && (
                  <Button testid={`staff-flag-unsuspend-${p.code}`} disabled={busy === p.code} onClick={() => unsuspend(p.code)} aria-label={`${t.unsuspend} ${p.code}`}>{t.unsuspend}</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section aria-labelledby="fl-h" className="stack">
        <h2 id="fl-h">{t.listTitle}</h2>
        {flags && flags.length === 0 && <Empty testid="staff-flags-empty">{t.listEmpty}</Empty>}
        {flags && flags.length > 0 && (
          <div className="table-wrap">
            <table className="table" data-testid="staff-flags-table">
              <thead><tr><th>{t.project}</th><th>{t.reporter}</th><th>{t.reason}</th><th>{t.evidence}</th><th>{t.at}</th></tr></thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={f.id} data-testid={`staff-flag-row-${f.id}`}>
                    <td>{f.projectCode}</td>
                    <td>{f.reporterName}</td>
                    <td>{f.reason || t.noReason}</td>
                    <td>{f.evidenceUrl ? <a href={f.evidenceUrl} target="_blank" rel="noreferrer" data-testid={`staff-flag-evidence-${f.id}`}>{t.openEvidence}</a> : '-'}</td>
                    <td>{fmtDateTime(f.createdAt)}</td>
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

export default function StaffFlagsPage() {
  return <StaffGate next="/staff/flags"><FlagsView /></StaffGate>;
}
