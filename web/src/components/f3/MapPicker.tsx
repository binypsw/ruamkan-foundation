'use client';
import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Alert, Button, TextField } from '@/components/ui';
import { f3 } from '@/messages/f3';

/** แผนที่ SVG จำลองประเทศไทย (ไม่ใช้ไลบรารีแผนที่) คลิกปักหมุด + กรอก lat/lng + ใช้ตำแหน่งปัจจุบัน (FR-12) */
const LAT_MAX = 20.6, LAT_MIN = 5.5, LNG_MIN = 97.3, LNG_MAX = 105.8;
const W = 300, H = 480;
const x = (lng: number) => ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
const y = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
const OUTLINE: Array<[number, number]> = [
  [99.1, 20.4], [100.1, 20.4], [100.4, 19.7], [101.2, 19.5], [101.1, 18.5], [100.9, 17.8], [101.9, 17.9], [102.1, 18.2], [103.1, 18.3],
  [104.3, 17.8], [104.7, 17.4], [105.5, 16.2], [105.1, 15.7], [105.0, 14.4], [103.1, 14.3], [102.3, 13.5], [102.5, 12.2], [101.0, 12.7],
  [100.9, 13.4], [100.0, 13.4], [99.9, 12.5], [100.0, 11.3], [99.3, 10.2], [99.9, 9.2], [100.4, 8.1], [100.4, 7.2], [101.2, 6.9],
  [101.9, 6.3], [102.0, 5.9], [101.3, 5.7], [100.3, 6.4], [99.7, 6.9], [99.3, 7.5], [98.3, 8.3], [98.4, 9.5], [98.7, 10.6], [99.1, 11.5],
  [99.1, 12.5], [99.5, 13.1], [99.2, 13.7], [99.6, 14.5], [98.6, 14.9], [98.2, 15.8], [98.1, 16.9], [97.7, 17.4], [97.6, 18.5], [98.5, 19.7],
];
const PATH = OUTLINE.map(([lng, lat], i) => `${i ? 'L' : 'M'}${x(lng).toFixed(1)} ${y(lat).toFixed(1)}`).join(' ') + 'Z';

const r5 = (n: number) => String(Math.round(n * 1e5) / 1e5);
const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

export function MapPicker({ lat, lng, onChange, latError, lngError }: {
  lat: string; lng: string; onChange: (lat: string, lng: string) => void; latError?: string | null; lngError?: string | null;
}) {
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const la = num(lat), lo = num(lng);
  const has = Number.isFinite(la) && Number.isFinite(lo) && la >= LAT_MIN && la <= LAT_MAX && lo >= LNG_MIN && lo <= LNG_MAX;

  function click(e: MouseEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const py = ((e.clientY - box.top) / box.height) * H;
    onChange(r5(LAT_MAX - (py / H) * (LAT_MAX - LAT_MIN)), r5(LNG_MIN + (px / W) * (LNG_MAX - LNG_MIN)));
  }
  function key(e: KeyboardEvent<SVGSVGElement>) {
    const step = e.shiftKey ? 0.5 : 0.05;
    const base = has ? [la, lo] : [13.75, 100.5];
    const d: Record<string, [number, number]> = { ArrowUp: [step, 0], ArrowDown: [-step, 0], ArrowLeft: [0, -step], ArrowRight: [0, step] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    onChange(r5(base[0] + m[0]), r5(base[1] + m[1]));
  }
  function geo() {
    setGeoErr(null);
    if (!navigator.geolocation) { setGeoErr(f3.step.map.geoFail); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => onChange(r5(p.coords.latitude), r5(p.coords.longitude)),
      () => setGeoErr(f3.step.map.geoFail),
    );
  }

  return (
    <div className="stack">
      <svg
        viewBox={`0 0 ${W} ${H}`} role="application" tabIndex={0} aria-label={f3.step.map.mapLabel} data-testid="wizard-map"
        onClick={click} onKeyDown={key}
        style={{ width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto', background: '#dbe2f0', borderRadius: 14, cursor: 'crosshair', border: '2px solid var(--navy)' }}
      >
        <path d={PATH} fill="#e3e9cd" stroke="#55642a" strokeWidth="2" />
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="#fff" strokeOpacity=".5" strokeDasharray="4 6" />)}
        {[0.33, 0.66].map((f) => <line key={f} y1={0} y2={H} x1={W * f} x2={W * f} stroke="#fff" strokeOpacity=".5" strokeDasharray="4 6" />)}
        {has && (
          <g data-testid="wizard-map-pin" transform={`translate(${x(lo)} ${y(la)})`}>
            <path d="M0 0C-12-16-12-30 0-30s12 14 0 30z" fill="#a8461f" stroke="#fff" strokeWidth="2" />
            <circle cx="0" cy="-20" r="4" fill="#fff" />
          </g>
        )}
      </svg>
      {has && <p className="muted" role="status" data-testid="wizard-map-status">{f3.step.map.pinned}: {la.toFixed(5)}, {lo.toFixed(5)}</p>}
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 140px' }}>
          <TextField label={f3.step.map.lat} testid="wizard-lat-input" inputMode="decimal" value={lat} error={latError} onChange={(e) => onChange(e.target.value, lng)} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <TextField label={f3.step.map.lng} testid="wizard-lng-input" inputMode="decimal" value={lng} error={lngError} onChange={(e) => onChange(lat, e.target.value)} />
        </div>
      </div>
      <Button testid="wizard-use-location" variant="secondary" onClick={geo}>{f3.step.map.useMe}</Button>
      {geoErr && <Alert kind="warn" testid="wizard-geo-error">{geoErr}</Alert>}
    </div>
  );
}
