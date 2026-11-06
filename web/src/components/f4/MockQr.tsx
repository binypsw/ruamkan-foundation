import { f4 } from '@/messages/f4';

/** QR จำลอง (SVG เขียนเอง) สร้างลวดลายคงที่จากสตริง payload · สแกนจริงไม่ได้ */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export default function MockQr({ payload, testid = 'donate-qr' }: { payload: string; testid?: string }) {
  const N = 25;
  let seed = hash(payload) || 1;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (inFinder(x, y)) continue;
    if (next() % 100 < 48) cells.push([x, y]);
  }
  const finder = (ox: number, oy: number) => (
    <g key={`${ox}-${oy}`}>
      <rect x={ox} y={oy} width="7" height="7" fill="#1f2f4d" />
      <rect x={ox + 1} y={oy + 1} width="5" height="5" fill="#fff" />
      <rect x={ox + 2} y={oy + 2} width="3" height="3" fill="#1f2f4d" />
    </g>
  );
  return (
    <svg data-testid={testid} role="img" aria-label={f4.donate.qrAlt} viewBox={`-2 -2 ${N + 4} ${N + 4}`} width="220" height="220" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, maxWidth: '100%' }}>
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1f2f4d" />)}
      {finder(0, 0)}{finder(N - 7, 0)}{finder(0, N - 7)}
    </svg>
  );
}
