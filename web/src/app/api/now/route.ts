import { NextResponse } from 'next/server';
import { now } from '@/lib/clock';

export const dynamic = 'force-dynamic';

/** "วันนี้" ของเว็บ (นาฬิการะบบที่ล็อกได้) */
export async function GET() {
  try {
    return NextResponse.json({ now: (await now()).toISOString() });
  } catch {
    return NextResponse.json({ error: { code: 'DB_DOWN', message: 'ระบบขัดข้อง' } }, { status: 503 });
  }
}
