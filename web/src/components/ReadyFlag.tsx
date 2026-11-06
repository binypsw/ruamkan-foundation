'use client';
import { useEffect } from 'react';

/** ตั้ง <html data-ready="true"> เมื่อหน้า hydrate เสร็จ (ให้ Playwright รอ) */
export default function ReadyFlag() {
  useEffect(() => {
    document.documentElement.setAttribute('data-ready', 'true');
    return () => document.documentElement.setAttribute('data-ready', 'false');
  }, []);
  return null;
}
