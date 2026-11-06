import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { fmtBaht } from '@/lib/format';
import type { ProgressBars } from '@/types';

/** ชุดคอมโพเนนต์กลาง · ทุกตัวรับ testid (ไม่ใส่ prefix) -> data-testid และต้องมี accessible name เสมอ */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({ variant = 'primary', block, testid, className = '', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean; testid: string }) {
  return <button type="button" data-testid={testid} className={`btn btn-${variant}${block ? ' btn-block' : ''} ${className}`} {...rest} />;
}

export function LinkButton({ href, variant = 'primary', block, testid, children, className = '', ...rest }:
  { href: string; variant?: Variant; block?: boolean; testid: string; children: ReactNode; className?: string; 'aria-label'?: string }) {
  return <Link href={href} data-testid={testid} className={`btn btn-${variant}${block ? ' btn-block' : ''} ${className}`} {...rest}>{children}</Link>;
}

export function Card({ children, href, testid, className = '' }: { children: ReactNode; href?: string; testid?: string; className?: string }) {
  if (href) return <Link href={href} data-testid={testid} className={`card ${className}`}>{children}</Link>;
  return <div data-testid={testid} className={`card ${className}`}>{children}</div>;
}

type Tone = 'ok' | 'warn' | 'danger' | 'info' | '';
export function Badge({ children, tone = '', testid }: { children: ReactNode; tone?: Tone; testid?: string }) {
  return <span data-testid={testid} className={`badge${tone ? ` badge-${tone}` : ''}`}>{children}</span>;
}

export function Alert({ kind = 'info', children, testid }: { kind?: 'error' | 'ok' | 'info' | 'warn'; children: ReactNode; testid: string }) {
  return <div role={kind === 'error' ? 'alert' : 'status'} data-testid={testid} className={`alert alert-${kind}`}>{children}</div>;
}

/** หลอดความคืบหน้า (FR-25): kind = money | item | people · เปอร์เซ็นต์อาจเกิน 100 ได้ (เพดาน 120%) หลอดตัดที่ 100 */
export function ProgressBar({ kind, label, valueText, pct, testid }:
  { kind: 'money' | 'item' | 'people'; label: string; valueText: string; pct: number; testid: string }) {
  const shown = Math.max(0, Math.min(100, pct));
  return (
    <div className={`progress progress-${kind}`} data-testid={testid}>
      <div className="progress-head">
        <span>{label}</span>
        <span data-testid={`${testid}-value`}>{valueText} ({Math.round(pct)}%)</span>
      </div>
      <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(shown)} aria-valuetext={`${valueText} (${Math.round(pct)}%)`}>
        <div className="progress-fill" style={{ width: `${shown}%` }} />
      </div>
    </div>
  );
}

/** ชุดหลอดแยกประเภทจากข้อมูล ProgressBars ของ API (เงิน · สิ่งของ · คน) */
export function ProgressSet({ bars, testid }: { bars: ProgressBars; testid: string }) {
  return (
    <div data-testid={testid}>
      {bars.money && <ProgressBar kind="money" label="เงิน" valueText={`${fmtBaht(bars.money.raised)} จาก ${fmtBaht(bars.money.target)}`} pct={bars.money.pct} testid={`${testid}-money`} />}
      {bars.item && <ProgressBar kind="item" label="สิ่งของ" valueText={`จองแล้ว ${bars.item.reserved}/${bars.item.needed} ชิ้น`} pct={bars.item.pct} testid={`${testid}-item`} />}
      {bars.people && <ProgressBar kind="people" label="คน" valueText={`${bars.people.joined}/${bars.people.needed} คน`} pct={bars.people.pct} testid={`${testid}-people`} />}
    </div>
  );
}

interface FieldProps { label: string; testid: string; error?: string | null; hint?: string }
export function TextField({ label, testid, error, hint, id, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const fid = id ?? `f-${testid}`;
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      <input id={fid} data-testid={testid} className="input" aria-invalid={error ? true : undefined} aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined} {...rest} />
      {hint && !error && <span id={`${fid}-hint`} className="field-hint">{hint}</span>}
      {error && <span id={`${fid}-error`} role="alert" data-testid={`${testid}-error`} className="field-error">{error}</span>}
    </div>
  );
}
export function TextArea({ label, testid, error, hint, id, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fid = id ?? `f-${testid}`;
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      <textarea id={fid} data-testid={testid} className="input" rows={4} aria-invalid={error ? true : undefined} {...rest} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span role="alert" data-testid={`${testid}-error`} className="field-error">{error}</span>}
    </div>
  );
}
export function SelectField({ label, testid, error, hint, id, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const fid = id ?? `f-${testid}`;
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      <select id={fid} data-testid={testid} className="input" aria-invalid={error ? true : undefined} {...rest}>{children}</select>
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span role="alert" data-testid={`${testid}-error`} className="field-error">{error}</span>}
    </div>
  );
}
export function CheckField({ label, testid, id, ...rest }: { label: string; testid: string } & InputHTMLAttributes<HTMLInputElement>) {
  const fid = id ?? `f-${testid}`;
  return (
    <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <input id={fid} type="checkbox" data-testid={testid} style={{ width: 24, height: 24 }} {...rest} />
      <label htmlFor={fid}>{label}</label>
    </div>
  );
}

export function PageTitle({ children, sub, testid = 'page-title' }: { children: ReactNode; sub?: ReactNode; testid?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h1 data-testid={testid}>{children}</h1>
      {sub && <p className="muted">{sub}</p>}
    </div>
  );
}

export function Empty({ children, testid }: { children: ReactNode; testid: string }) {
  return <div data-testid={testid} className="card card-body muted" style={{ textAlign: 'center' }}>{children}</div>;
}

/** ภาพประกอบ SVG เขียนเอง (ไม่ใช้รูปถ่าย/รูปคนจริง) · เลือกลวดลายจากรหัสโครงการให้คงที่ */
export function Illustration({ seed = '', kind }: { seed?: string; kind?: 'weir' | 'house' | 'heart' | 'bridge' | 'book' | 'paw' }) {
  const kinds = ['weir', 'house', 'heart', 'bridge', 'book', 'paw'] as const;
  const k = kind ?? kinds[Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0) % kinds.length];
  return (
    <svg className="card-art" viewBox="0 0 320 180" role="img" aria-label={`ภาพประกอบโครงการ (${k})`} preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" fill="#f6dccd" />
      <circle cx="268" cy="44" r="26" fill="#fbf5ea" />
      <path d="M0 140 Q80 110 160 140 T320 130 V180 H0Z" fill="#e3e9cd" />
      <path d="M0 160 Q90 135 180 158 T320 150 V180 H0Z" fill="#55642a" opacity=".85" />
      {k === 'weir' && <g><path d="M40 120h240v14H40z" fill="#1f2f4d" /><path d="M60 134q20 12 40 0t40 0 40 0 40 0 40 0v14H60z" fill="#8fb3d9" /></g>}
      {k === 'house' && <g><path d="M110 120l50-40 50 40z" fill="#a8461f" /><rect x="122" y="120" width="76" height="40" fill="#fff" stroke="#1f2f4d" strokeWidth="3" /><rect x="152" y="136" width="16" height="24" fill="#1f2f4d" /></g>}
      {k === 'heart' && <path d="M160 150C90 105 110 62 140 72c10 3 17 10 20 18 3-8 10-15 20-18 30-10 50 33-20 78z" fill="#a8461f" />}
      {k === 'bridge' && <g><path d="M50 120h220" stroke="#a8461f" strokeWidth="10" /><path d="M70 120v30M130 120v30M190 120v30M250 120v30" stroke="#1f2f4d" strokeWidth="6" /></g>}
      {k === 'book' && <g><path d="M110 90h50v60h-50zM160 90h50v60h-50z" fill="#fff" stroke="#1f2f4d" strokeWidth="3" /><path d="M118 105h34M118 117h34M168 105h34M168 117h34" stroke="#a8461f" strokeWidth="3" /></g>}
      {k === 'paw' && <g fill="#1f2f4d"><ellipse cx="160" cy="132" rx="26" ry="20" /><circle cx="122" cy="102" r="10" /><circle cx="148" cy="88" r="10" /><circle cx="174" cy="88" r="10" /><circle cx="200" cy="102" r="10" /></g>}
    </svg>
  );
}
