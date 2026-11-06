import { NextRequest, NextResponse } from 'next/server';
import { readUpload } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** ส่งไฟล์ที่อัปโหลด (เสียง/วิดีโอ/ใบเสร็จ/รูป) จาก volume ของ web */
export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const f = await readUpload(params.name);
  if (!f) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'ไม่พบไฟล์' } }, { status: 404 });
  return new NextResponse(new Uint8Array(f.buf), { headers: { 'content-type': f.contentType, 'cache-control': 'private, max-age=3600' } });
}
