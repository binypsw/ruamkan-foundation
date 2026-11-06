/* Service worker (NFR-03): cache ไฟล์ static + หน้าออฟไลน์ · ห้าม cache /api */
const CACHE = 'rk-static-v1';
const PRECACHE = ['/img/icon-192.png', '/img/icon-512.png', '/img/icon.svg', '/img/home-hero.svg', '/manifest.webmanifest'];
const OFFLINE_HTML = '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ออฟไลน์ · ร่วมกันทำไม</title><style>body{font-family:system-ui,sans-serif;background:#fbf5ea;color:#2b2118;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center}button{font:inherit;font-weight:600;min-height:48px;padding:10px 20px;border-radius:12px;border:0;background:#a8461f;color:#fff;cursor:pointer}</style></head><body><main><h1>ตอนนี้คุณออฟไลน์</h1><p>เชื่อมต่ออินเทอร์เน็ตอีกครั้งเพื่อดูโครงการและช่วยเหลือ</p><button onclick="location.reload()">ลองโหลดหน้าใหม่</button></main></body></html>';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => new Response(OFFLINE_HTML, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/img/') || url.pathname === '/manifest.webmanifest') {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
