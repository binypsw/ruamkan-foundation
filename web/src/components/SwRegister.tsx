'use client';
import { useEffect } from 'react';

/** ลงทะเบียน service worker (PWA · NFR-03) · ไฟล์ /sw.js เป็นของงาน F1 */
export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);
  return null;
}
