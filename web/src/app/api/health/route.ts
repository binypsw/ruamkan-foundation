import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** healthcheck: ต่อฐานข้อมูลไม่ได้ให้ตอบ db:false (ไม่ต่อตอน build) */
export async function GET() {
  let db = false;
  try {
    await getPool().query('SELECT 1');
    db = true;
  } catch {
    db = false;
  }
  return NextResponse.json({ ok: true, db });
}
