'use client';
import { useState } from 'react';
import { uploadFile } from '@/lib/client/api';
import { Alert } from '@/components/ui';
import { f3 } from '@/messages/f3';

/** เลือกไฟล์แล้วอัปโหลดไป /api/uploads · onUploaded ได้ url */
export function UploadField({ testid, label, accept, onUploaded, value, buttonLabel }: {
  testid: string; label: string; accept: string; onUploaded: (url: string) => void | Promise<void>; value?: string | null; buttonLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = `f-${testid}`;
  return (
    <div className="field">
      <label htmlFor={id}>{buttonLabel ?? label}</label>
      <input
        id={id} type="file" accept={accept} data-testid={testid} className="input" disabled={busy} aria-label={buttonLabel ?? label}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true); setErr(null);
          const r = await uploadFile(file);
          if (r.ok) await onUploaded(r.data.url); else setErr(r.error?.message ?? 'อัปโหลดไม่สำเร็จ');
          setBusy(false);
          e.target.value = '';
        }}
      />
      {busy && <span className="field-hint" data-testid={`${testid}-busy`}>{f3.step.media.uploading}</span>}
      {value && <span className="field-hint" data-testid={`${testid}-done`}>{f3.step.media.uploaded}: <a href={value} target="_blank" rel="noreferrer">{value}</a></span>}
      {err && <Alert kind="error" testid={`${testid}-error`}>{err}</Alert>}
    </div>
  );
}
