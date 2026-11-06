'use client';
import { useCallback, useEffect, useState } from 'react';
import type { SessionUser } from '@/types';

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: { code: string; message: string; details?: unknown };
}

/** เรียก API ฝั่งเบราว์เซอร์: ไม่ throw · ok=false พร้อม error.message ภาษาไทยจากเซิร์ฟเวอร์ */
export async function api<T = any>(path: string, init?: { method?: string; body?: unknown; form?: FormData }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: init?.method ?? (init?.body !== undefined || init?.form ? 'POST' : 'GET'),
      headers: init?.form ? undefined : init?.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: init?.form ?? (init?.body !== undefined ? JSON.stringify(init.body) : undefined),
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) return { ok: false, status: res.status, data, error: data?.error ?? { code: 'HTTP_' + res.status, message: 'ทำรายการไม่สำเร็จ' } };
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null as any, error: { code: 'NETWORK', message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่' } };
  }
}

/** อัปโหลดไฟล์ (เสียง/วิดีโอ/รูป/ใบเสร็จ) -> url ใน volume ของ web */
export async function uploadFile(file: File | Blob, name = 'file'): Promise<ApiResult<{ url: string }>> {
  const form = new FormData();
  form.append('file', file, (file as File).name ?? name);
  return api('/api/uploads', { form });
}

/** ผู้ใช้ปัจจุบัน: undefined = กำลังโหลด · null = ยังไม่ล็อกอิน */
export function useMe(): { me: SessionUser | null | undefined; reload: () => void } {
  const [me, setMe] = useState<SessionUser | null | undefined>(undefined);
  const load = useCallback(async () => {
    const r = await api<{ user: SessionUser | null }>('/api/me');
    setMe(r.ok ? r.data.user : null);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { me, reload: load };
}

/** "วันนี้" ของเว็บจากนาฬิการะบบ (ล็อกได้ NFR-18) ห้ามใช้ Date.now() ฝั่งหน้าเว็บ */
export function useNow(): Date | null {
  const [n, setN] = useState<Date | null>(null);
  useEffect(() => {
    void api<{ now: string }>('/api/now').then((r) => r.ok && setN(new Date(r.data.now)));
  }, []);
  return n;
}
