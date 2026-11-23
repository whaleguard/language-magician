/* 오프라인에서도 화면이 열리도록 정적 파일을 캐시합니다. 번역·AI 요청은 캐시하지 않습니다. */
const CACHE = 'lm-v1';
const FILES = ['./', 'index.html', 'css/app.css', 'js/config.js', 'js/i18n.js', 'js/data.js', 'js/engine.js', 'js/saju.js', 'js/store.js', 'js/admin.js', 'js/app.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
