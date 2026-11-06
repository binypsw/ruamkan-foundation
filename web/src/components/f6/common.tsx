'use client';
import Link from 'next/link';
import { Alert } from '@/components/ui';
import { f6 } from '@/messages/f6';

export function LoginNeeded({ next, testid }: { next: string; testid: string }) {
  return (
    <Alert kind="info" testid={`${testid}-login-needed`}>
      {f6.loginNeeded}{' '}
      <Link href={`/login?next=${encodeURIComponent(next)}`} data-testid={`${testid}-login-link`}>{f6.loginLink}</Link>
    </Alert>
  );
}

/** QR จำลอง: วาดตารางจุดจากโทเคนแบบคงที่ (ไม่ใช่ QR มาตรฐาน) พร้อมตัวหมุดมุม 3 มุม */
export function MockQr({ value, testid }: { value: string; testid: string }) {
  const N = 25;
  let h = 2166136261;
  for (const ch of value) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let s = h || 1;
  const cells: boolean[] = [];
  for (let i = 0; i < N * N; i++) {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    cells.push((s & 1) === 1);
  }
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  const rects: JSX.Element[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!inFinder(x, y) && cells[y * N + x]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  }
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`} transform={`translate(${fx} ${fy})`}>
      <rect width="7" height="7" /><rect x="1" y="1" width="5" height="5" fill="#fff" /><rect x="2" y="2" width="3" height="3" />
    </g>
  );
  return (
    <svg data-testid={testid} role="img" aria-label="QR เช็กอินจำลอง" viewBox={`-2 -2 ${N + 4} ${N + 4}`} width="220" height="220" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, maxWidth: '100%' }}>
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#fff" />
      <g fill="#1f2f4d">{rects}{finder(0, 0)}{finder(N - 7, 0)}{finder(0, N - 7)}</g>
    </svg>
  );
}
