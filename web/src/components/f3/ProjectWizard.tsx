'use client';
import { useMemo, useState } from 'react';
import { api } from '@/lib/client/api';
import { fmtBaht, fmtMoney, FUNDING_LABEL, SUPPORT_LABEL } from '@/lib/format';
import { SUPPORT_TYPES, type SupportType } from '@/types';
import { Alert, Button, Card, CheckField, LinkButton, PageTitle, SelectField, TextArea, TextField } from '@/components/ui';
import { f3 } from '@/messages/f3';
import { MapPicker } from './MapPicker';
import { MediaRecorderField } from './MediaRecorderField';
import { UploadField } from './UploadField';

export interface WizardForm {
  types: SupportType[]; title: string; amount: string; duration: string; mode: '' | 'all_or_nothing' | 'flexible';
  voiceUrl: string; videoUrl: string; transcript: string; what: string; where: string; need: string; evidenceUrl: string;
  lat: string; lng: string; province: string;
  items: Array<{ name: string; qty: string }>;
  skills: Array<{ skill: string; headcount: string; workDate: string }>;
  loans: Array<{ itemName: string; days: string }>;
  sigGoal: string; drone: boolean;
  tiers: Array<{ tier: number; minAmount: string; description: string }>;
  percents: string[];
}

export const emptyForm = (): WizardForm => ({
  types: [], title: '', amount: '', duration: '', mode: '', voiceUrl: '', videoUrl: '', transcript: '', what: '', where: '', need: '', evidenceUrl: '',
  lat: '', lng: '', province: '',
  items: [{ name: '', qty: '' }], skills: [{ skill: '', headcount: '', workDate: '' }], loans: [{ itemName: '', days: '' }],
  sigGoal: '', drone: false,
  tiers: [{ tier: 1, minAmount: '50', description: '' }, { tier: 2, minAmount: '500', description: '' }, { tier: 3, minAmount: '2000', description: '' }],
  percents: ['40', '60'],
});

type StepId = 'types' | 'title' | 'goal' | 'media' | 'what' | 'where' | 'need' | 'evidence' | 'map' | 'items' | 'skills' | 'loans' | 'advocacy' | 'rewards' | 'plan' | 'review';
type Errors = Record<string, string>;

const PROVINCES = ['กรุงเทพมหานคร', 'เชียงใหม่', 'เชียงราย', 'ขอนแก่น', 'นครราชสีมา', 'อุดรธานี', 'อุบลราชธานี', 'พิษณุโลก', 'นครสวรรค์', 'สุพรรณบุรี', 'กาญจนบุรี', 'ชลบุรี', 'ระยอง', 'ประจวบคีรีขันธ์', 'นครศรีธรรมราช', 'สงขลา', 'ภูเก็ต', 'สุราษฎร์ธานี'];

const hasMedia = (f: WizardForm) => !!(f.voiceUrl || f.videoUrl);
const posInt = (s: string) => /^\d+$/.test(s.trim()) && Number(s) > 0;

function stepsFor(f: WizardForm): StepId[] {
  const s: StepId[] = ['types', 'title', 'goal', 'media', 'what', 'where', 'need', 'evidence', 'map'];
  if (f.types.includes('item')) s.push('items');
  if (f.types.includes('labor')) s.push('skills');
  if (f.types.includes('loan')) s.push('loans');
  if (f.types.includes('advocacy')) s.push('advocacy');
  if (f.types.includes('money')) s.push('rewards');
  if (f.mode !== 'flexible') s.push('plan');
  s.push('review');
  return s;
}

/** ตรวจเฉพาะ "ต้องตอบ" (FR-13) · กฎเงิน/งวดให้เซิร์ฟเวอร์ตัดสิน แล้วแสดงข้อความตรง ๆ */
function validate(id: StepId, f: WizardForm): Errors {
  const e: Errors = {};
  switch (id) {
    case 'types': if (!f.types.length) e.types = f3.step.types.err; break;
    case 'title': if (!f.title.trim()) e.title = f3.required; break;
    case 'goal':
      if (!f.amount.trim() || !Number.isFinite(Number(f.amount.replace(/,/g, '')))) e.amount = f3.step.goal.errAmount;
      if (!f.duration) e.duration = f3.step.goal.errDuration;
      if (!f.mode) e.mode = f3.step.goal.errMode;
      break;
    case 'what': if (!hasMedia(f) && !f.what.trim()) e.what = f3.required; break;
    case 'where': if (!hasMedia(f) && !f.where.trim()) e.where = f3.required; break;
    case 'need': if (!hasMedia(f) && !f.need.trim()) e.need = f3.required; break;
    case 'map': {
      const la = Number(f.lat), lo = Number(f.lng);
      if (f.lat.trim() === '' || !Number.isFinite(la) || la < -90 || la > 90) e.lat = f3.step.map.errCoord;
      if (f.lng.trim() === '' || !Number.isFinite(lo) || lo < -180 || lo > 180) e.lng = f3.step.map.errCoord;
      if (!f.province.trim()) e.province = f3.step.map.errProvince;
      break;
    }
    case 'items': if (!f.items.some((i) => i.name.trim() && posInt(i.qty))) e.items = f3.step.items.err; break;
    case 'skills': if (!f.skills.some((i) => i.skill.trim() && posInt(i.headcount) && i.workDate)) e.skills = f3.step.skills.err; break;
    case 'loans': if (!f.loans.some((i) => i.itemName.trim() && posInt(i.days))) e.loans = f3.step.loans.err; break;
    case 'advocacy': if (!posInt(f.sigGoal)) e.sigGoal = f3.step.advocacy.err; break;
    case 'plan': {
      const ps = f.percents.map((p) => Number(p));
      if (!ps.length || ps.some((p) => !Number.isFinite(p) || p <= 0) || Math.abs(ps.reduce((a, b) => a + b, 0) - 100) > 1e-9) e.plan = f3.step.plan.errSum;
      break;
    }
    default: break;
  }
  return e;
}

export function buildBody(f: WizardForm) {
  return {
    title: f.title.trim(),
    supportTypes: f.types,
    fundingMode: f.mode,
    targetAmount: Number(f.amount.replace(/,/g, '')),
    durationHours: Number(f.duration),
    storyWhat: f.what.trim(), storyWhere: f.where.trim(), storyNeed: f.need.trim(),
    evidenceUrl: f.evidenceUrl || undefined, voiceUrl: f.voiceUrl || undefined, videoUrl: f.videoUrl || undefined,
    transcript: f.transcript.trim() || undefined,
    lat: Number(f.lat), lng: Number(f.lng), areaProvince: f.province.trim(),
    items: f.types.includes('item') ? f.items.filter((i) => i.name.trim() && posInt(i.qty)).map((i) => ({ name: i.name.trim(), qty: Number(i.qty) })) : undefined,
    skills: f.types.includes('labor') ? f.skills.filter((i) => i.skill.trim() && posInt(i.headcount) && i.workDate).map((i) => ({ skill: i.skill.trim(), headcount: Number(i.headcount), workDate: i.workDate })) : undefined,
    loans: f.types.includes('loan') ? f.loans.filter((i) => i.itemName.trim() && posInt(i.days)).map((i) => ({ itemName: i.itemName.trim(), days: Number(i.days) })) : undefined,
    signatureGoal: f.types.includes('advocacy') ? Number(f.sigGoal) : undefined,
    droneWanted: f.types.includes('advocacy') ? f.drone : undefined,
    rewardTiers: f.types.includes('money')
      ? f.tiers.filter((t) => t.description.trim() && t.minAmount.trim() !== '').map((t) => ({ tier: t.tier, minAmount: Number(t.minAmount), description: t.description.trim() }))
      : undefined,
    milestones: f.mode === 'all_or_nothing' ? f.percents.map((p) => ({ percent: Number(p) })) : undefined,
  };
}

function RemoveBtn({ testid, onClick, label }: { testid: string; onClick: () => void; label: string }) {
  return <Button testid={testid} variant="ghost" onClick={onClick} aria-label={label}>{label}</Button>;
}

export function ProjectWizard({ mode, projectId, initial }: { mode: 'create' | 'edit'; projectId?: string; initial?: WizardForm }) {
  const [f, setF] = useState<WizardForm>(initial ?? emptyForm());
  const [idx, setIdx] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitErr, setSubmitErr] = useState<{ code: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);

  const steps = useMemo(() => stepsFor(f), [f]);
  const cur = steps[Math.min(idx, steps.length - 1)];
  const set = <K extends keyof WizardForm>(k: K, v: WizardForm[K]) => { setF((p) => ({ ...p, [k]: v })); setErrors((p) => { const n = { ...p }; delete n[k as string]; return n; }); };

  function go(delta: number) {
    if (delta > 0) {
      const e = validate(cur, f);
      setErrors(e);
      if (Object.keys(e).length) return;
    } else setErrors({});
    setSubmitErr(null);
    setIdx((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  }

  async function submit() {
    // ตรวจทุกข้ออีกรอบ ถ้ามีข้อที่ยังไม่ตอบให้พากลับไปข้อนั้น (FR-13)
    for (let i = 0; i < steps.length; i++) {
      const e = validate(steps[i], f);
      if (Object.keys(e).length) { setErrors(e); setIdx(i); return; }
    }
    setBusy(true); setSubmitErr(null);
    const body = buildBody(f);
    const r = mode === 'edit' ? await api(`/api/projects/${projectId}`, { method: 'PUT', body }) : await api('/api/projects', { method: 'POST', body });
    setBusy(false);
    if (!r.ok) { setSubmitErr({ code: r.error?.code ?? '', message: r.error?.message ?? 'ส่งโครงการไม่สำเร็จ' }); return; }
    setDone({ code: r.data?.project?.code ?? '' });
  }

  if (done) {
    return (
      <div className="stack">
        <Alert kind="ok" testid="wizard-success">
          <strong data-testid="wizard-success-title">{f3.wizard.successTitle}</strong>
          <div data-testid="wizard-success-body">{f3.wizard.successBody(done.code)}</div>
        </Alert>
        <LinkButton href="/my/projects" testid="wizard-to-my-projects">{f3.wizard.toMyProjects}</LinkButton>
      </div>
    );
  }

  const isLast = cur === 'review';
  const err = (k: string) => errors[k] ?? null;
  const n = steps.indexOf(cur) + 1;
  const planPcts = f.percents.map((p) => Number(p) || 0);
  const planSum = planPcts.reduce((a, b) => a + b, 0);
  const target = Number(f.amount.replace(/,/g, '')) || 0;

  const toggleType = (t: SupportType) => set('types', f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t]);
  const upd = <T,>(arr: T[], i: number, patch: Partial<T>) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));

  return (
    <div className="stack" data-testid="wizard">
      <PageTitle testid="wizard-title" sub={mode === 'edit' ? f3.wizard.editSub : f3.wizard.sub}>{mode === 'edit' ? f3.wizard.editTitle : f3.wizard.title}</PageTitle>
      <p className="muted" data-testid="wizard-progress" aria-live="polite">{f3.stepOf(n, steps.length)}</p>
      <div role="progressbar" aria-label="ความคืบหน้าการตอบ" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={n} style={{ height: 8, background: 'var(--cream-2)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ width: `${(n / steps.length) * 100}%`, height: '100%', background: 'var(--olive)', transition: 'width .2s' }} />
      </div>

      <Card testid={`wizard-step-${cur}`}>
        <div className="card-body stack">
          {cur === 'types' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.types.q}</h2>
              <p className="muted">{f3.step.types.hint}</p>
              {SUPPORT_TYPES.map((t) => (
                <CheckField key={t} label={SUPPORT_LABEL[t]} testid={`wizard-type-${t}`} checked={f.types.includes(t)} onChange={() => toggleType(t)} />
              ))}
              {err('types') && <Alert kind="error" testid="wizard-types-error">{err('types')}</Alert>}
            </>
          )}

          {cur === 'title' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.title.q}</h2>
              <TextField label={f3.step.title.label} hint={f3.step.title.hint} testid="wizard-title-input" value={f.title} maxLength={120} error={err('title')} onChange={(e) => set('title', e.target.value)} />
            </>
          )}

          {cur === 'goal' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.goal.q}</h2>
              <TextField label={f3.step.goal.amount} hint={f3.step.goal.amountHint} testid="wizard-amount-input" inputMode="decimal" value={f.amount} error={err('amount')} onChange={(e) => set('amount', e.target.value)} />
              <SelectField label={f3.step.goal.duration} testid="wizard-duration-select" value={f.duration} error={err('duration')} onChange={(e) => set('duration', e.target.value)}>
                <option value="">{f3.step.goal.durationPlaceholder}</option>
                {f3.step.goal.durations.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </SelectField>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ fontWeight: 700, marginBottom: 8 }}>{f3.step.goal.mode}</legend>
                {([['all_or_nothing', f3.step.goal.modeAon], ['flexible', f3.step.goal.modeFlex]] as const).map(([v, l]) => (
                  <div key={v} className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <input id={`f-wizard-mode-${v}`} type="radio" name="funding-mode" value={v} checked={f.mode === v} data-testid={`wizard-mode-${v}`} style={{ width: 24, height: 24, marginTop: 4 }} onChange={() => set('mode', v)} />
                    <label htmlFor={`f-wizard-mode-${v}`}>{l}</label>
                  </div>
                ))}
                {err('mode') && <span role="alert" data-testid="wizard-mode-error" className="field-error">{err('mode')}</span>}
              </fieldset>
            </>
          )}

          {cur === 'media' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.media.q}</h2>
              <p className="muted">{f3.step.media.hint}</p>
              <MediaRecorderField kind="audio" testid="wizard-voice" label="เสียงเล่าเรื่อง" value={f.voiceUrl} onChange={(u) => set('voiceUrl', u)} />
              <MediaRecorderField kind="video" testid="wizard-video" label="วิดีโอเล่าเรื่อง" value={f.videoUrl} onChange={(u) => set('videoUrl', u)} />
              {hasMedia(f) && <TextArea label={f3.step.media.transcript} hint={f3.step.media.transcriptHint} testid="wizard-transcript-input" value={f.transcript} onChange={(e) => set('transcript', e.target.value)} />}
            </>
          )}

          {cur === 'what' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.what.q}</h2>
              {hasMedia(f) && <p className="muted">{f3.step.mediaOrText}</p>}
              <TextArea label={f3.step.what.label} hint={f3.step.what.hint} testid="wizard-what-input" value={f.what} error={err('what')} onChange={(e) => set('what', e.target.value)} />
            </>
          )}
          {cur === 'where' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.where.q}</h2>
              {hasMedia(f) && <p className="muted">{f3.step.mediaOrText}</p>}
              <TextArea label={f3.step.where.label} hint={f3.step.where.hint} testid="wizard-where-input" value={f.where} error={err('where')} onChange={(e) => set('where', e.target.value)} />
            </>
          )}
          {cur === 'need' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.need.q}</h2>
              {hasMedia(f) && <p className="muted">{f3.step.mediaOrText}</p>}
              <TextArea label={f3.step.need.label} hint={f3.step.need.hint} testid="wizard-need-input" value={f.need} error={err('need')} onChange={(e) => set('need', e.target.value)} />
            </>
          )}
          {cur === 'evidence' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.evidence.q}</h2>
              <p className="muted">{f3.step.evidence.hint}</p>
              <UploadField testid="wizard-evidence-file" label={f3.step.evidence.pick} accept="image/*,application/pdf" value={f.evidenceUrl} onUploaded={(u) => set('evidenceUrl', u)} />
              {f.evidenceUrl && <Button testid="wizard-evidence-remove" variant="ghost" onClick={() => set('evidenceUrl', '')}>{f3.step.media.remove}</Button>}
            </>
          )}

          {cur === 'map' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.map.q}</h2>
              <p className="muted">{f3.step.map.hint}</p>
              <MapPicker lat={f.lat} lng={f.lng} latError={err('lat')} lngError={err('lng')}
                onChange={(la, lo) => { setF((p) => ({ ...p, lat: la, lng: lo })); setErrors((p) => { const x = { ...p }; delete x.lat; delete x.lng; return x; }); }} />
              <TextField label={f3.step.map.province} testid="wizard-province-input" list="wizard-province-list" value={f.province} error={err('province')} onChange={(e) => set('province', e.target.value)} />
              <datalist id="wizard-province-list">{PROVINCES.map((p) => <option key={p} value={p} />)}</datalist>
            </>
          )}

          {cur === 'items' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.items.q}</h2>
              <p className="muted">{f3.step.items.hint}</p>
              {f.items.map((it, i) => (
                <div key={i} className="row" style={{ alignItems: 'flex-end' }} data-testid={`wizard-item-row-${i}`}>
                  <div style={{ flex: '2 1 180px' }}><TextField label={`${f3.step.items.name} ${i + 1}`} testid={`wizard-item-name-${i}`} value={it.name} onChange={(e) => set('items', upd(f.items, i, { name: e.target.value }))} /></div>
                  <div style={{ flex: '1 1 100px' }}><TextField label={`${f3.step.items.qty} ${i + 1}`} testid={`wizard-item-qty-${i}`} inputMode="numeric" value={it.qty} onChange={(e) => set('items', upd(f.items, i, { qty: e.target.value }))} /></div>
                  {f.items.length > 1 && <RemoveBtn testid={`wizard-item-remove-${i}`} label={`${f3.step.items.remove} ${i + 1}`} onClick={() => set('items', f.items.filter((_, j) => j !== i))} />}
                </div>
              ))}
              <Button testid="wizard-item-add" variant="secondary" onClick={() => set('items', [...f.items, { name: '', qty: '' }])}>{f3.step.items.add}</Button>
              {err('items') && <Alert kind="error" testid="wizard-items-error">{err('items')}</Alert>}
            </>
          )}

          {cur === 'skills' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.skills.q}</h2>
              <p className="muted">{f3.step.skills.hint}</p>
              {f.skills.map((it, i) => (
                <div key={i} className="row" style={{ alignItems: 'flex-end' }} data-testid={`wizard-skill-row-${i}`}>
                  <div style={{ flex: '2 1 160px' }}><TextField label={`${f3.step.skills.skill} ${i + 1}`} testid={`wizard-skill-name-${i}`} value={it.skill} onChange={(e) => set('skills', upd(f.skills, i, { skill: e.target.value }))} /></div>
                  <div style={{ flex: '1 1 90px' }}><TextField label={`${f3.step.skills.headcount} ${i + 1}`} testid={`wizard-skill-count-${i}`} inputMode="numeric" value={it.headcount} onChange={(e) => set('skills', upd(f.skills, i, { headcount: e.target.value }))} /></div>
                  <div style={{ flex: '1 1 150px' }}><TextField label={`${f3.step.skills.workDate} ${i + 1}`} testid={`wizard-skill-date-${i}`} type="date" value={it.workDate} onChange={(e) => set('skills', upd(f.skills, i, { workDate: e.target.value }))} /></div>
                  {f.skills.length > 1 && <RemoveBtn testid={`wizard-skill-remove-${i}`} label={`${f3.step.skills.remove} ${i + 1}`} onClick={() => set('skills', f.skills.filter((_, j) => j !== i))} />}
                </div>
              ))}
              <Button testid="wizard-skill-add" variant="secondary" onClick={() => set('skills', [...f.skills, { skill: '', headcount: '', workDate: '' }])}>{f3.step.skills.add}</Button>
              {err('skills') && <Alert kind="error" testid="wizard-skills-error">{err('skills')}</Alert>}
            </>
          )}

          {cur === 'loans' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.loans.q}</h2>
              <p className="muted">{f3.step.loans.hint}</p>
              {f.loans.map((it, i) => (
                <div key={i} className="row" style={{ alignItems: 'flex-end' }} data-testid={`wizard-loan-row-${i}`}>
                  <div style={{ flex: '2 1 180px' }}><TextField label={`${f3.step.loans.itemName} ${i + 1}`} testid={`wizard-loan-name-${i}`} value={it.itemName} onChange={(e) => set('loans', upd(f.loans, i, { itemName: e.target.value }))} /></div>
                  <div style={{ flex: '1 1 100px' }}><TextField label={`${f3.step.loans.days} ${i + 1}`} testid={`wizard-loan-days-${i}`} inputMode="numeric" value={it.days} onChange={(e) => set('loans', upd(f.loans, i, { days: e.target.value }))} /></div>
                  {f.loans.length > 1 && <RemoveBtn testid={`wizard-loan-remove-${i}`} label={`${f3.step.loans.remove} ${i + 1}`} onClick={() => set('loans', f.loans.filter((_, j) => j !== i))} />}
                </div>
              ))}
              <Button testid="wizard-loan-add" variant="secondary" onClick={() => set('loans', [...f.loans, { itemName: '', days: '' }])}>{f3.step.loans.add}</Button>
              {err('loans') && <Alert kind="error" testid="wizard-loans-error">{err('loans')}</Alert>}
            </>
          )}

          {cur === 'advocacy' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.advocacy.q}</h2>
              <p className="muted">{f3.step.advocacy.hint}</p>
              <TextField label={f3.step.advocacy.goal} testid="wizard-sig-goal-input" inputMode="numeric" value={f.sigGoal} error={err('sigGoal')} onChange={(e) => set('sigGoal', e.target.value)} />
              <CheckField label={f3.step.advocacy.drone} testid="wizard-drone-check" checked={f.drone} onChange={(e) => set('drone', e.target.checked)} />
            </>
          )}

          {cur === 'rewards' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.rewards.q}</h2>
              <p className="muted">{f3.step.rewards.hint}</p>
              {f.tiers.map((t, i) => (
                <div key={t.tier} className="card card-body stack" data-testid={`wizard-tier-box-${t.tier}`}>
                  <h3>{f3.step.rewards.tierLabel(t.tier)}</h3>
                  <TextField label={`${f3.step.rewards.min} (${f3.step.rewards.tierLabel(t.tier)})`} testid={`wizard-tier-min-${t.tier}`} inputMode="decimal" value={t.minAmount} onChange={(e) => set('tiers', upd(f.tiers, i, { minAmount: e.target.value }))} />
                  <TextArea label={`${f3.step.rewards.desc} (${f3.step.rewards.tierLabel(t.tier)})`} testid={`wizard-tier-desc-${t.tier}`} rows={2} value={t.description} onChange={(e) => set('tiers', upd(f.tiers, i, { description: e.target.value }))} />
                </div>
              ))}
            </>
          )}

          {cur === 'plan' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.plan.q}</h2>
              <p className="muted">{f3.step.plan.hint}</p>
              <Alert kind="info" testid="wizard-plan-br09">{f3.step.plan.br09}</Alert>
              <Alert kind="info" testid="wizard-plan-br10">{f3.step.plan.br10}</Alert>
              <div className="row">
                <Button testid="wizard-plan-preset-1" variant="secondary" onClick={() => set('percents', ['100'])}>{f3.step.plan.preset1}</Button>
                <Button testid="wizard-plan-preset-2" variant="secondary" onClick={() => set('percents', ['40', '60'])}>{f3.step.plan.preset2}</Button>
                <Button testid="wizard-plan-preset-3" variant="secondary" onClick={() => set('percents', ['30', '30', '40'])}>{f3.step.plan.preset3}</Button>
              </div>
              {f.percents.map((p, i) => (
                <div key={i} className="row" style={{ alignItems: 'flex-end' }} data-testid={`wizard-plan-row-${i}`}>
                  <div style={{ flex: '1 1 160px' }}><TextField label={f3.step.plan.percent(i + 1)} testid={`wizard-plan-percent-${i}`} inputMode="decimal" value={p} onChange={(e) => set('percents', f.percents.map((x, j) => (j === i ? e.target.value : x)))} /></div>
                  <span className="muted" data-testid={`wizard-plan-amount-${i}`}>{f3.step.plan.amountOf(fmtBaht(((target * (Number(p) || 0)) / 100).toFixed(2)))}</span>
                  {f.percents.length > 1 && <RemoveBtn testid={`wizard-plan-remove-${i}`} label={`${f3.step.plan.remove} ${i + 1}`} onClick={() => set('percents', f.percents.filter((_, j) => j !== i))} />}
                </div>
              ))}
              <Button testid="wizard-plan-add" variant="secondary" onClick={() => set('percents', [...f.percents, ''])}>{f3.step.plan.add}</Button>
              <p data-testid="wizard-plan-sum"><strong>{f3.step.plan.sum}: {planSum}%</strong></p>
              {planPcts.length >= 2 && planPcts[0] > 40 && <Alert kind="warn" testid="wizard-plan-warn-first">{f3.step.plan.warnFirst}</Alert>}
              {target > 20000 && planPcts.length < 2 && <Alert kind="warn" testid="wizard-plan-warn-count">{f3.step.plan.warnCount}</Alert>}
              {err('plan') && <Alert kind="error" testid="wizard-plan-error">{err('plan')}</Alert>}
            </>
          )}

          {cur === 'review' && (
            <>
              <h2 data-testid="wizard-question">{f3.step.review.q}</h2>
              <p className="muted">{f3.step.review.hint}</p>
              <dl style={{ margin: 0 }} data-testid="wizard-review">
                {([
                  [f3.step.review.rows.title, f.title],
                  [f3.step.review.rows.types, f.types.map((t) => SUPPORT_LABEL[t]).join(' · ')],
                  [f3.step.review.rows.goal, fmtBaht(fmtMoney(target))],
                  [f3.step.review.rows.duration, f3.step.goal.durations.find(([v]) => v === f.duration)?.[1] ?? '-'],
                  [f3.step.review.rows.mode, f.mode ? FUNDING_LABEL[f.mode] : '-'],
                  [f3.step.review.rows.pin, `${f.lat}, ${f.lng} · ${f.province}`],
                  [f3.step.review.rows.story, [f.what, f.where, f.need].filter(Boolean).join(' / ') || '-'],
                  [f3.step.review.rows.media, hasMedia(f) ? f3.step.review.hasMedia : f3.step.review.noMedia],
                  [f3.step.review.rows.plan, f.mode === 'all_or_nothing' ? f.percents.map((p) => `${p}%`).join(' · ') : f3.step.review.noPlan],
                ] as Array<[string, string]>).map(([k, v]) => (
                  <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <dt style={{ fontWeight: 700 }}>{k}</dt>
                    <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      </Card>

      {submitErr && (
        <Alert kind="error" testid="wizard-error">
          <div data-testid="wizard-error-message">{submitErr.message}</div>
          {/KYC/i.test(submitErr.code) && <LinkButton href="/kyc" variant="secondary" testid="wizard-kyc-link">{f3.kycLink}</LinkButton>}
        </Alert>
      )}

      <div className="row">
        {idx > 0 && <Button testid="wizard-back" variant="secondary" onClick={() => go(-1)} disabled={busy}>{f3.back}</Button>}
        {!isLast
          ? <Button testid="wizard-next" onClick={() => go(1)}>{f3.next}</Button>
          : <Button testid="wizard-submit" onClick={submit} disabled={busy}>{busy ? f3.submitting : mode === 'edit' ? f3.resubmit : f3.submit}</Button>}
      </div>
    </div>
  );
}
