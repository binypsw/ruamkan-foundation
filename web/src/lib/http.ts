import { NextRequest, NextResponse } from 'next/server';
import type { Role, SessionUser } from '@/types';
import { getSessionUser } from './auth';

/** ข้อผิดพลาดที่ตั้งใจให้ตอบกลับ: ใช้ throw ใน handler/lib ได้ทุกที่ */
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const bad = (code: string, message: string, details?: unknown) => new AppError(400, code, message, details);
export const unauthorized = (message = 'กรุณาเข้าสู่ระบบก่อน') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'บทบาทของคุณไม่มีสิทธิ์ทำรายการนี้') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'ไม่พบข้อมูลที่ต้องการ') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string, details?: unknown) => new AppError(409, code, message, details);
/** ผิดกฎมูลนิธิ BR-xx */
export const rule = (code: string, message: string, details?: unknown) => new AppError(422, code, message, details);

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export interface Ctx<P = Record<string, string>> {
  req: NextRequest;
  params: P;
  user: SessionUser | null;
  body: any;
  query: URLSearchParams;
}

interface RouteOpts {
  /** ต้องล็อกอิน (401 ถ้ายังไม่ล็อกอิน) */
  auth?: boolean;
  /** จำกัดบทบาท (403 ถ้าไม่ใช่) */
  roles?: Role[];
}

/**
 * ห่อ route handler: อ่านเซสชัน, ตรวจบทบาท (NFR-10), parse JSON body, แปลง AppError เป็น JSON {error:{code,message}}
 * ตัวอย่าง: export const POST = route({ roles: ['staff'] }, async ({ body, user, params }) => ok({...}));
 */
export function route<P = Record<string, string>>(opts: RouteOpts, handler: (ctx: Ctx<P>) => Promise<NextResponse | Response>) {
  return async (req: NextRequest, routeCtx: { params: P }) => {
    try {
      const user = await getSessionUser();
      if ((opts.auth || opts.roles) && !user) throw unauthorized();
      if (opts.roles && user && !opts.roles.includes(user.role)) throw forbidden();
      let body: any = {};
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const ct = req.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
          try { body = await req.json(); } catch { throw bad('INVALID_JSON', 'รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง'); }
        }
      }
      return await handler({ req, params: routeCtx?.params ?? ({} as P), user, body, query: req.nextUrl.searchParams });
    } catch (e) {
      return toErrorResponse(e);
    }
  };
}

export function toErrorResponse(e: unknown): NextResponse {
  if (e instanceof AppError) {
    return NextResponse.json({ error: { code: e.code, message: e.message, details: e.details } }, { status: e.status });
  }
  const pg = e as { code?: string; constraint?: string; message?: string };
  // ข้อจำกัดของฐานข้อมูลที่รับกฎร้าน (DESIGN §4 "กลไกในฐานข้อมูล")
  if (pg?.code === '23514') return NextResponse.json({ error: { code: 'DB_CHECK', message: 'ข้อมูลไม่เป็นไปตามกฎของมูลนิธิ', details: pg.constraint } }, { status: 422 });
  if (pg?.code === '23505') return NextResponse.json({ error: { code: 'DUPLICATE', message: 'ข้อมูลนี้มีอยู่แล้ว', details: pg.constraint } }, { status: 409 });
  console.error('[api error]', e);
  return NextResponse.json({ error: { code: 'INTERNAL', message: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' } }, { status: 500 });
}

/** อ่านเลขเงินจาก body (รับ number หรือสตริง) -> สตริง 2 ตำแหน่ง หรือ throw 400 */
export function money(v: unknown, field = 'amount'): string {
  const s = typeof v === 'number' ? v.toFixed(2) : typeof v === 'string' ? v.trim() : '';
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw bad('INVALID_MONEY', `กรุณากรอก${field === 'amount' ? 'จำนวนเงิน' : field}เป็นตัวเลข`);
  const [i, f = ''] = s.split('.');
  return `${parseInt(i, 10)}.${(f + '00').slice(0, 2)}`;
}

export function uuid(v: unknown, name = 'id'): string {
  if (typeof v !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) throw notFound(`ไม่พบ ${name}`);
  return v;
}
