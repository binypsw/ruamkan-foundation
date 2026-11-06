import type { Metadata, Viewport } from 'next';
import '@fontsource/sarabun/thai-400.css';
import '@fontsource/sarabun/thai-600.css';
import '@fontsource/sarabun/thai-700.css';
import '@fontsource/sarabun/latin-400.css';
import '@fontsource/sarabun/latin-600.css';
import '@fontsource/sarabun/latin-700.css';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingHelp from '@/components/FloatingHelp';
import ReadyFlag from '@/components/ReadyFlag';
import SwRegister from '@/components/SwRegister';

// อ่าน BUG_MODE จาก env ตอนรัน (ไม่ใช่ตอน build)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ร่วมกันทำไม · ระดมความช่วยเหลือเพื่อชุมชน',
  description: 'แพลตฟอร์มระดมเงิน สิ่งของ แรงคน ของมูลนิธิร่วมกันทำไม โปร่งใส ตรวจสอบได้',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/img/icon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1f2f4d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const bugMode = process.env.BUG_MODE === '1' ? '1' : '0';
  return (
    <html lang="th" data-ready="false" data-bug-mode={bugMode}>
      <body>
        <a href="#main" className="sr-only">ข้ามไปเนื้อหาหลัก</a>
        <Header />
        <main id="main" className="container page" data-testid="page-main">{children}</main>
        <Footer />
        <FloatingHelp />
        <ReadyFlag />
        <SwRegister />
      </body>
    </html>
  );
}
