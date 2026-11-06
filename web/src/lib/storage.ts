import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/** จำลอง object storage: เก็บไฟล์ในโฟลเดอร์ volume ของ web (เสียง/วิดีโอ/ใบเสร็จ/รูปหลักฐาน) ไม่ส่งออกนอกเครื่อง */
export const storageDir = () => path.resolve(process.env.STORAGE_DIR ?? './storage');

const ALLOWED: Record<string, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/svg+xml': '.svg',
  'audio/webm': '.webm', 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a',
  'video/webm': '.webm', 'video/mp4': '.mp4', 'application/pdf': '.pdf',
};
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function saveUpload(buf: Buffer, contentType: string): Promise<{ name: string; url: string }> {
  const ext = ALLOWED[contentType.split(';')[0].trim()];
  if (!ext) throw new Error('UNSUPPORTED_TYPE');
  if (buf.length > MAX_UPLOAD_BYTES) throw new Error('TOO_LARGE');
  const dir = path.join(storageDir(), 'uploads');
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, name), buf);
  return { name, url: `/api/files/${name}` };
}

export async function readUpload(name: string): Promise<{ buf: Buffer; contentType: string } | null> {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/.test(name)) return null;
  try {
    const buf = await fs.readFile(path.join(storageDir(), 'uploads', name));
    const ext = path.extname(name);
    const contentType = Object.entries(ALLOWED).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';
    return { buf, contentType };
  } catch {
    return null;
  }
}
