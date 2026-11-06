'use client';
import { useEffect, useRef, useState } from 'react';
import { uploadFile } from '@/lib/client/api';
import { Alert, Button } from '@/components/ui';
import { UploadField } from './UploadField';
import { f3 } from '@/messages/f3';

/** อัดเสียง/วิดีโอด้วย MediaRecorder แล้วอัปโหลด หรือเลือกไฟล์แทน (FR-09) */
export function MediaRecorderField({ kind, testid, label, value, onChange }: {
  kind: 'audio' | 'video'; testid: string; label: string; value: string; onChange: (url: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const supported = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  async function start() {
    setErr(null);
    if (!supported) { setErr(f3.step.media.noRecorder); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === 'audio' ? { audio: true } : { audio: true, video: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || (kind === 'audio' ? 'audio/webm' : 'video/webm');
        const blob = new Blob(chunks.current, { type });
        const ext = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
        setBusy(true);
        const r = await uploadFile(blob, `${kind}-recording.${ext}`);
        setBusy(false);
        if (r.ok) onChange(r.data.url); else setErr(r.error?.message ?? 'อัปโหลดไม่สำเร็จ');
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setErr(f3.step.media.denied);
    }
  }
  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="card card-body stack" data-testid={`${testid}-box`}>
      <h3>{label}</h3>
      <div className="row">
        {!recording
          ? <Button testid={`${testid}-record`} variant="secondary" onClick={start} disabled={busy}>{kind === 'audio' ? f3.step.media.record : f3.step.media.recordVideo}</Button>
          : <Button testid={`${testid}-stop`} variant="danger" onClick={stop}>{f3.step.media.stop}</Button>}
        {recording && <span role="status" data-testid={`${testid}-recording`}>{f3.step.media.recording}</span>}
        {busy && <span role="status" data-testid={`${testid}-busy`}>{f3.step.media.uploading}</span>}
      </div>
      <UploadField testid={`${testid}-file`} label={label} buttonLabel={kind === 'audio' ? f3.step.media.pickAudio : f3.step.media.pickVideo}
        accept={kind === 'audio' ? 'audio/*' : 'video/*'} onUploaded={onChange} />
      {value && (
        <div className="stack">
          <span data-testid={`${testid}-done`}>{f3.step.media.uploaded}</span>
          {kind === 'audio'
            ? <audio controls src={value} aria-label={label} style={{ width: '100%' }} />
            : <video controls src={value} aria-label={label} style={{ width: '100%', maxHeight: 240 }} />}
          <Button testid={`${testid}-remove`} variant="ghost" onClick={() => onChange('')}>{f3.step.media.remove}</Button>
        </div>
      )}
      {err && <Alert kind="error" testid={`${testid}-error`}>{err}</Alert>}
    </div>
  );
}
