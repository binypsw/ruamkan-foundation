/** กราฟแท่งแนวนอนด้วย SVG เขียนเอง · ความยาวแท่งคำนวณจากจำนวนเต็ม (สตางค์) ไม่ใช้ float กับตัวเลขที่แสดง */
export interface Bar { key: string; label: string; value: string; raw: bigint; color: string }

/** "1050.00" -> 105000 (scale 100) · "12" -> 12 (scale 1) */
export function toUnits(s: string | number | null | undefined, scale: 1 | 100): bigint {
  const str = String(s ?? '0');
  const neg = str.startsWith('-');
  const [i, f = ''] = str.replace('-', '').split('.');
  const frac = scale === 100 ? (f + '00').slice(0, 2) : '';
  const v = BigInt((i || '0') + frac);
  return neg ? -v : v;
}

export function BarChart({ bars, title, testid }: { bars: Bar[]; title: string; testid: string }) {
  const zero = BigInt(0);
  const max = bars.reduce((m, b) => (b.raw > m ? b.raw : m), zero);
  const rowH = 44, left = 120, W = 640, barMax = W - left - 170;
  const H = rowH * bars.length + 8;
  return (
    <figure style={{ margin: 0 }} data-testid={testid}>
      <figcaption style={{ fontWeight: 700, marginBottom: 8 }}>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} style={{ width: '100%', height: 'auto', maxWidth: 680 }}>
        {bars.map((b, i) => {
          const w = max > zero ? (Number((b.raw * BigInt(1000)) / max) / 1000) * barMax : 0;
          const bw = b.raw > zero ? Math.max(w, 3) : 0;
          const y = i * rowH + 4;
          return (
            <g key={b.key} data-testid={`${testid}-bar-${b.key}`}>
              <text x={0} y={y + 26} fontSize={16} fill="#2b2118">{b.label}</text>
              <rect x={left} y={y + 6} width={bw} height={28} rx={6} fill={b.color} />
              <text x={left + bw + 8} y={y + 26} fontSize={16} fontWeight={700} fill="#2b2118">{b.value}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
