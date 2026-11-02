/* 여행 정산 페이지 오프라인 캐시. 문서는 네트워크 우선 + 2.5초 타임아웃.
   데이터는 페이지가 localStorage 에 따로 두므로 여기서는 화면만 담는다. */
const CACHE = 'settle-2026-11-02a';
const DOC = './index.html';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', DOC])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(new Promise((resolve) => {
    let settled = false;
    const fromCache = () => caches.match(DOC);
    const t = setTimeout(() => { fromCache().then((r) => { if (r && !settled) { settled = true; resolve(r); } }); }, 2500);
    fetch(e.request).then((r) => {
      clearTimeout(t);
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(DOC, copy)); }
      if (!settled) { settled = true; resolve(r); }
    }).catch(() => {
      clearTimeout(t);
      fromCache().then((r) => { if (!settled) { settled = true; resolve(r || Response.error()); } });
    });
  }));
});
