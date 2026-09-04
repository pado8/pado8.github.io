/* 가오슝 도시에 오프라인 캐시.
   문서 하나 + 지도 이미지 + 아이콘이 전부라 통째로 미리 받아둔다.
   CACHE 값을 바꾸면 이전 캐시는 activate 에서 지워진다 — 내용 갱신 시 반드시 올릴 것. */
const CACHE = 'kaohsiung-2026-09-04a';
const ASSETS = [
  './',
  './index.html',
  './map.jpg',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 구글 지도 링크 등은 손대지 않는다

  // 주소창 접근·홈 화면 실행은 무조건 저장된 문서로 응답 (오프라인 우선)
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then((hit) => hit || fetch(req).catch(() => caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
