'use client';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, LinkButton, PageTitle, TextField } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { f6 } from '@/messages/f6';
import { LoginNeeded } from '@/components/f6/common';

/** ถ้าข้อความที่สแกน/วางเป็น URL หรือ payload ที่มี token=… ให้ดึงเฉพาะโทเคน */
function extractToken(raw: string): string {
  const t = raw.trim();
  const m = t.match(/[?&]token=([^&\s]+)/);
  return m ? decodeURIComponent(m[1]) : t;
}

interface CheckinResult { checkedIn: number; total: number; label: string; hours?: number | string | null }

export default function CheckinPage() {
  const { me } = useMe();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [canScan, setCanScan] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    setCanScan(typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia);
    return () => { stopRef.current = true; streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function doCheckin(raw: string) {
    setErr(null); setResult(null);
    const tk = extractToken(raw);
    if (!tk) { setErr(f6.checkin.needToken); return; }
    setBusy(true);
    const r = await api<CheckinResult>('/api/volunteer/checkin', { body: { token: tk } });
    setBusy(false);
    if (!r.ok) { setErr(r.error?.message ?? f6.loadFailed); return; }
    setResult(r.data);
  }

  function stopScan() {
    stopRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    setScanMsg(null); setErr(null);
    if (!canScan) { setScanMsg(f6.checkin.noScanner); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream; stopRef.current = false; setScanning(true);
      const v = videoRef.current;
      if (v) { v.srcObject = stream; await v.play(); }
      const Detector = (window as any).BarcodeDetector;
      const det = new Detector({ formats: ['qr_code'] });
      const loop = async () => {
        if (stopRef.current || !videoRef.current) return;
        try {
          const codes = await det.detect(videoRef.current);
          if (codes.length > 0) {
            const val: string = codes[0].rawValue;
            setToken(val); stopScan(); await doCheckin(val); return;
          }
        } catch { /* ลองใหม่รอบถัดไป */ }
        setTimeout(() => void loop(), 300);
      };
      void loop();
    } catch {
      stopScan(); setScanMsg(f6.checkin.camFail);
    }
  }

  if (me === undefined) return <div className="container page"><p data-testid="checkin-loading">{f6.loading}</p></div>;
  if (me === null) return <div className="container page"><PageTitle sub={f6.checkin.sub}>{f6.checkin.title}</PageTitle><LoginNeeded next="/volunteer/checkin" testid="checkin" /></div>;

  return (
    <div className="container page stack">
      <PageTitle sub={f6.checkin.sub}>{f6.checkin.title}</PageTitle>
      <Card testid="checkin-card">
        <div className="card-body stack">
          <TextField label={f6.checkin.tokenLabel} testid="checkin-token-input" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
          {err && <Alert kind="error" testid="checkin-error">{err}</Alert>}
          {scanMsg && <Alert kind="warn" testid="checkin-scan-message">{scanMsg}</Alert>}
          <div className="row">
            <Button testid="checkin-submit" onClick={() => void doCheckin(token)} disabled={busy}>{busy ? f6.checkin.submitting : f6.checkin.submit}</Button>
            {!scanning
              ? <Button variant="secondary" testid="checkin-scan-start" onClick={() => void startScan()}>{f6.checkin.scan}</Button>
              : <Button variant="secondary" testid="checkin-scan-stop" onClick={stopScan}>{f6.checkin.scanStop}</Button>}
          </div>
          <video ref={videoRef} data-testid="checkin-video" aria-label="กล้องสแกน QR" muted playsInline style={{ display: scanning ? 'block' : 'none', width: '100%', maxWidth: 360, borderRadius: 12 }} />
          {scanning && <p className="muted" data-testid="checkin-scanning">{f6.checkin.scanning}</p>}
        </div>
      </Card>
      {result && (
        <Alert kind="ok" testid="checkin-result">
          <strong>{f6.checkin.result}: </strong>
          <span data-testid="checkin-label">{result.label}</span>
          {result.hours !== undefined && result.hours !== null && <span> · {f6.checkin.hours} <span data-testid="checkin-hours">{String(result.hours)}</span></span>}
        </Alert>
      )}
      <div className="row"><LinkButton href="/volunteer" variant="ghost" testid="checkin-back">{f6.checkin.back}</LinkButton></div>
    </div>
  );
}
