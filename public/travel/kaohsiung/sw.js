/* 가오슝 도시에 오프라인 캐시.
   문서 하나 + 지도 이미지 + 아이콘이 전부라 통째로 미리 받아둔다.

   문서(HTML)는 stale-while-revalidate 로 다룬다 — 캐시본을 즉시 보여주고
   온라인이면 뒤에서 새 버전을 받아 캐시를 덮어쓴다. 그래야 내용을 고칠 때마다
   CACHE 이름을 올리는 걸 잊어도 다음 실행에서 최신본이 뜬다.
   나머지 자산(지도·아이콘)은 잘 안 바뀌므로 캐시 우선. */
const CACHE = 'kaohsiung-2026-09-04c';
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

function refresh(req, key) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) caches.open(CACHE).then((c) => c.put(key, res.clone()));
      return res;
    })
    .catch(() => null); // 오프라인이면 조용히 포기 — 캐시본이 이미 나갔다
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 구글 지도 링크 등은 손대지 않는다

  // 주소창 접근·홈 화면 실행: 저장된 문서를 바로 주고, 뒤에서 최신본을 받아둔다
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then((hit) => {
        const net = refresh(new Request('./index.html', { cache: 'reload' }), './index.html');
        if (hit) { e.waitUntil(net); return hit; }
        return net.then((res) => res || caches.match('./'));
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || refresh(req, req).then((res) => res || Response.error()))
  );
});
