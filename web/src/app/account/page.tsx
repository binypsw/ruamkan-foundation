'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, CheckField, LinkButton, PageTitle, TextField } from '@/components/ui';
import { LoginRequired, fmtThai } from '@/components/f5/LoginRequired';
import { api, useMe } from '@/lib/client/api';
import { f5 } from '@/messages/f5';

const t = f5.account;
interface Don { id: string; project: { code: string; title: string }; amount: string; status: string; paidAt: string | null }
interface Notif { id: string; title: string; read: boolean; createdAt: string }

const STATUS_LABEL: Record<string, string> = { paid: t.paid, pending: t.pending, refunded: t.refunded, expired: t.expired };

export default function AccountPage() {
  const { me, reload } = useMe();
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillText, setSkillText] = useState('');
  const [line, setLine] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dons, setDons] = useState<Don[] | null>(null);
  const [notifs, setNotifs] = useState<Notif[] | null>(null);

  useEffect(() => {
    if (!me || ready) return;
    setDisplayName(me.displayName); setConsent(me.consentShowName); setSkills(me.skills ?? []); setLine(me.lineLinked);
    setReady(true);
  }, [me, ready]);

  useEffect(() => {
    if (!me) return;
    void api<{ donations: Don[] }>('/api/me/donations').then((r) => setDons(r.ok ? (r.data.donations ?? []).slice(0, 5) : []));
    void api<{ items: Notif[] }>('/api/notifications').then((r) => setNotifs(r.ok ? (r.data.items ?? []).slice(0, 3) : []));
  }, [me]);

  function addSkill() {
    const s = skillText.trim();
    if (!s) return;
    if (!skills.includes(s)) setSkills([...skills, s]);
    setSkillText(''); setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    if (!displayName.trim()) { setError('กรุณากรอกชื่อที่ใช้แสดง'); return; }
    setBusy(true);
    const r = await api('/api/me', { method: 'PATCH', body: { displayName: displayName.trim(), consentShowName: consent, skills, lineLinked: line } });
    setBusy(false);
    if (!r.ok) { setError(r.error?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    setSaved(true);
    reload();
  }

  if (me === undefined) return <p className="muted" data-testid="account-loading">{f5.loading}</p>;

  return (
    <div className="stack" style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageTitle sub={t.sub} testid="account-title">{t.title}</PageTitle>
      {me === null ? <LoginRequired path="/account" testid="account" /> : (
        <>
          <Card testid="account-info">
            <div className="card-body stack">
              <h2 style={{ fontSize: 18 }}>{t.info}</h2>
              <p style={{ margin: 0 }}>{t.email}: <strong data-testid="account-email">{me.email}</strong></p>
              <p style={{ margin: 0 }}>{t.role}: <strong data-testid="account-role">{t.roles[me.role] ?? me.role}</strong></p>
              {me.code && <p style={{ margin: 0 }}>{t.code}: <span data-testid="account-code">{me.code}</span></p>}
            </div>
          </Card>

          <Card testid="account-kyc">
            <div className="card-body stack">
              <h2 style={{ fontSize: 18 }}>{t.kycTitle}</h2>
              <p style={{ margin: 0 }}>
                <Badge tone={me.kycVerified ? 'ok' : 'warn'} testid="account-kyc-status">{me.kycVerified ? t.kycOk : t.kycNo}</Badge>
              </p>
              {!me.kycVerified && <div><LinkButton href="/kyc" variant="secondary" testid="account-kyc-link">{t.kycGo}</LinkButton></div>}
            </div>
          </Card>

          <Card>
            <form className="card-body stack" onSubmit={save} noValidate>
              <TextField label={t.displayName} testid="account-name-input" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }} />

              <div className="stack">
                <h2 style={{ fontSize: 18 }}>{t.consentTitle}</h2>
                <CheckField label={t.consent} testid="account-consent-checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setSaved(false); }} />
                <p className="muted" data-testid="account-consent-note">{consent ? t.consentOnNote : t.consentOffNote}</p>
              </div>

              <div className="stack">
                <h2 style={{ fontSize: 18 }}>{t.skillsTitle}</h2>
                <p className="muted">{t.skillsHint}</p>
                {skills.length === 0 ? <p className="muted" data-testid="account-skills-empty">{t.skillsEmpty}</p> : (
                  <ul className="row" style={{ listStyle: 'none', padding: 0, margin: 0 }} data-testid="account-skills">
                    {skills.map((s) => (
                      <li key={s} className="row" style={{ alignItems: 'center', gap: 4 }}>
                        <Badge testid={`account-skill-${s}`}>{s}</Badge>
                        <Button testid={`account-skill-remove-${s}`} variant="ghost" aria-label={`${t.skillRemove} ${s}`} onClick={() => { setSkills(skills.filter((x) => x !== s)); setSaved(false); }}>×</Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="row" style={{ alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <TextField label={t.skillInput} testid="account-skill-input" value={skillText} onChange={(e) => setSkillText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  </div>
                  <Button testid="account-skill-add" variant="secondary" onClick={addSkill}>{t.skillAdd}</Button>
                </div>
              </div>

              <div className="stack">
                <h2 style={{ fontSize: 18 }}>{t.lineTitle}</h2>
                <p data-testid="account-line-status" style={{ margin: 0 }}>{line ? t.lineOn : t.lineOff}</p>
                <div>
                  <Button testid="account-line-toggle" variant="secondary" onClick={() => { setLine(!line); setSaved(false); }}>{line ? t.lineUnlink : t.lineLink}</Button>
                </div>
              </div>

              {error && <Alert kind="error" testid="account-error">{error}</Alert>}
              {saved && <Alert kind="ok" testid="account-saved">{t.saved}</Alert>}
              <button type="submit" data-testid="account-save" className="btn btn-primary btn-block" disabled={busy}>{busy ? t.saving : t.save}</button>
            </form>
          </Card>

          <Card testid="account-history">
            <div className="card-body stack">
              <h2 style={{ fontSize: 18 }}>{t.historyTitle}</h2>
              <h3 style={{ fontSize: 16 }}>{t.historyDonations}</h3>
              {dons === null ? <p className="muted">{f5.loading}</p> : dons.length === 0 ? <p className="muted" data-testid="account-history-empty">{t.historyNone}</p> : (
                <ul style={{ margin: 0, paddingLeft: 20 }} data-testid="account-history-list">
                  {dons.map((d) => (
                    <li key={d.id} data-testid={`account-history-${d.id}`}>
                      {d.project?.title} · <span className="num">{d.amount}</span> {t.baht} · {STATUS_LABEL[d.status] ?? d.status}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/my/donations" data-testid="account-history-link">{t.historyAll}</Link>

              <h3 style={{ fontSize: 16 }}>{t.historyNotif}</h3>
              {notifs === null ? <p className="muted">{f5.loading}</p> : notifs.length === 0 ? <p className="muted" data-testid="account-notif-empty">{t.notifNone}</p> : (
                <ul style={{ margin: 0, paddingLeft: 20 }} data-testid="account-notif-list">
                  {notifs.map((n) => <li key={n.id}>{n.title} · <span className="muted">{fmtThai(n.createdAt)}</span></li>)}
                </ul>
              )}
              <Link href="/notifications" data-testid="account-notif-link">{t.notifAll}</Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
