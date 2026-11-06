'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, LinkButton, PageTitle, TextField } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { fmtDateTime } from '@/lib/format';
import { f6 } from '@/messages/f6';
import { LoginNeeded, MockQr } from '@/components/f6/common';

interface Need {
  id: string; projectId: string; projectTitle: string; skill: string; headcount: number; joined: number;
  workDate: string; matchesMySkill: boolean; signedUp: boolean;
}

function QrPanel({ need }: { need: Need }) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<{ token: string; payload: string } | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    if (open) { setOpen(false); return; }
    setErr(null);
    const r = await api<{ token: string; payload: string }>(`/api/needs/${need.id}/qr`);
    if (!r.ok) { setErr(r.error?.message ?? f6.loadFailed); return; }
    setQr(r.data); setOpen(true);
    const s = await api<{ label: string }>(`/api/needs/${need.id}/stats`);
    if (s.ok) setLabel(s.data.label);
  }
  return (
    <div className="stack">
      <div className="row">
        <Button variant="secondary" testid={`volunteer-qr-toggle-${need.id}`} onClick={() => void toggle()}>{open ? f6.volunteer.hideQr : f6.volunteer.showQr}</Button>
      </div>
      {err && <Alert kind="error" testid={`volunteer-qr-error-${need.id}`}>{err}</Alert>}
      {open && qr && (
        <div className="stack" data-testid={`volunteer-qr-panel-${need.id}`}>
          <h3>{f6.volunteer.qrTitle}</h3>
          <MockQr value={qr.token} testid={`volunteer-qr-image-${need.id}`} />
          <p>{f6.volunteer.qrToken}: <code data-testid={`volunteer-qr-token-${need.id}`} style={{ wordBreak: 'break-all' }}>{qr.token}</code></p>
          <p className="muted">{f6.volunteer.qrHint}</p>
          {label && <p><strong data-testid={`volunteer-qr-stats-${need.id}`}>{label}</strong></p>}
        </div>
      )}
    </div>
  );
}

export default function VolunteerPage() {
  const { me, reload } = useMe();
  const [skillsText, setSkillsText] = useState('');
  const [skillsInit, setSkillsInit] = useState(false);
  const [skillsBusy, setSkillsBusy] = useState(false);
  const [skillsErr, setSkillsErr] = useState<string | null>(null);
  const [skillsOk, setSkillsOk] = useState(false);
  const [needs, setNeeds] = useState<Need[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const loadNeeds = useCallback(async () => {
    const r = await api<{ needs: Need[] }>('/api/volunteer/needs');
    if (!r.ok) { setLoadErr(r.error?.message ?? f6.loadFailed); setNeeds([]); return; }
    setLoadErr(null); setNeeds(r.data.needs);
  }, []);

  useEffect(() => { if (me) void loadNeeds(); }, [me, loadNeeds]);
  useEffect(() => {
    if (me && !skillsInit) { setSkillsText((me.skills ?? []).join(', ')); setSkillsInit(true); }
  }, [me, skillsInit]);

  async function saveSkills() {
    setSkillsBusy(true); setSkillsErr(null); setSkillsOk(false);
    const skills = skillsText.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    const r = await api('/api/me', { method: 'PATCH', body: { skills } });
    setSkillsBusy(false);
    if (!r.ok) { setSkillsErr(r.error?.message ?? f6.loadFailed); return; }
    setSkillsOk(true); reload(); await loadNeeds();
  }

  async function signup(n: Need) {
    setBusyId(n.id); setOkMsg(null);
    setErrs((p) => { const x = { ...p }; delete x[n.id]; return x; });
    const r = await api(`/api/volunteer/needs/${n.id}/signup`, { method: 'POST', body: {} });
    setBusyId(null);
    if (!r.ok) { setErrs((p) => ({ ...p, [n.id]: r.error?.message ?? f6.loadFailed })); return; }
    setOkMsg(f6.volunteer.signupOk);
    await loadNeeds();
  }

  if (me === undefined) return <div className="container page"><p data-testid="volunteer-loading">{f6.loading}</p></div>;
  if (me === null) return <div className="container page"><PageTitle sub={f6.volunteer.sub}>{f6.volunteer.title}</PageTitle><LoginNeeded next="/volunteer" testid="volunteer" /></div>;

  const canShowQr = me.role === 'starter' || me.role === 'staff';

  return (
    <div className="container page stack">
      <PageTitle sub={f6.volunteer.sub}>{f6.volunteer.title}</PageTitle>

      <Card testid="volunteer-skills-card">
        <div className="card-body stack">
          <h2>{f6.volunteer.skillsTitle}</h2>
          <TextField label={f6.volunteer.skillsLabel} testid="volunteer-skills-input" value={skillsText} onChange={(e) => { setSkillsText(e.target.value); setSkillsOk(false); }} />
          {skillsErr && <Alert kind="error" testid="volunteer-skills-error">{skillsErr}</Alert>}
          {skillsOk && <Alert kind="ok" testid="volunteer-skills-ok">{f6.volunteer.skillsOk}</Alert>}
          <div className="row">
            <Button testid="volunteer-skills-save" onClick={() => void saveSkills()} disabled={skillsBusy}>{skillsBusy ? f6.volunteer.skillsSaving : f6.volunteer.skillsSave}</Button>
            <LinkButton href="/volunteer/checkin" variant="secondary" testid="volunteer-checkin-link">{f6.volunteer.goCheckin}</LinkButton>
          </div>
        </div>
      </Card>

      <h2>{f6.volunteer.needsTitle}</h2>
      {okMsg && <Alert kind="ok" testid="volunteer-ok">{okMsg}</Alert>}
      {loadErr && <Alert kind="error" testid="volunteer-error">{loadErr}</Alert>}
      {needs === null && <p data-testid="volunteer-loading">{f6.loading}</p>}
      {needs && needs.length === 0 && !loadErr && <Empty testid="volunteer-empty">{f6.volunteer.empty}</Empty>}
      <div className="stack" data-testid="volunteer-list">
        {needs?.map((n) => (
          <Card key={n.id} testid={`volunteer-need-${n.id}`}>
            <div className="card-body stack">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{n.skill}</h3>
                <span className="row">
                  {n.matchesMySkill && <Badge tone="ok" testid={`volunteer-match-${n.id}`}>{f6.volunteer.matches}</Badge>}
                  {n.signedUp && <Badge tone="info" testid={`volunteer-signed-${n.id}`}>{f6.volunteer.signedUp}</Badge>}
                </span>
              </div>
              <p>{f6.volunteer.project}: {n.projectTitle}</p>
              <p>{f6.volunteer.workDate}: {fmtDateTime(n.workDate)}</p>
              <p>{f6.volunteer.joined} <strong data-testid={`volunteer-joined-${n.id}`}>{n.joined}/{n.headcount}</strong> {f6.volunteer.people}</p>
              {errs[n.id] && <Alert kind="error" testid={`volunteer-signup-error-${n.id}`}>{errs[n.id]}</Alert>}
              {!n.signedUp && !canShowQr && (
                <div className="row">
                  <Button testid={`volunteer-signup-${n.id}`} onClick={() => void signup(n)} disabled={busyId === n.id} aria-label={`${f6.volunteer.signup} ${n.skill}`}>
                    {busyId === n.id ? f6.volunteer.signingUp : f6.volunteer.signup}
                  </Button>
                </div>
              )}
              {canShowQr && <QrPanel need={n} />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
