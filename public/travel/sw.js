/* 여행 허브(/travel/) 오프라인 캐시.
   허브 자체만 담당한다. 각 도시에(/travel/<도시>/)는 자기 서비스워커를 갖고 있고,
   더 깊은 스코프가 우선이라 그쪽이 그대로 자기 페이지를 맡는다.

   문서는 네트워크 우선 + 2.5초 타임아웃 — 온라인이면 항상 최신본, 오프라인이면 즉시 캐시본. */
const CACHE = 'travel-hub-2026-09-04b';
const DOC = './index.html';
const NET_TIMEOUT = 2500;
const ASSETS = ['./', DOC, './manifest.webmanifest',
                './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

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

function save(key, res) {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(key, copy));
  }
  return res;
}

function docResponse() {
  return caches.match(DOC).then((cached) => {
    const net = fetch(new Request(DOC, { cache: 'reload' }))
      .then((res) => save(DOC, res))
      .catch(() => null);
    if (!cached) return net.then((res) => res || caches.match('./'));
    const timeout = new Promise((r) => setTimeout(() => r(null), NET_TIMEOUT));
    return Promise.race([net, timeout]).then((res) => res || cached);
  });
}

const HUB = new URL('./', self.registration.scope).pathname;

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 허브 주소로 들어온 이동만 가로챈다. 하위 도시에 페이지는 건드리지 않는다.
  if (req.mode === 'navigate') {
    if (url.pathname !== HUB && url.pathname !== HUB + 'index.html') return;
    e.respondWith(docResponse());
    return;
  }

  if (!url.pathname.startsWith(HUB) || url.pathname.slice(HUB.length).includes('/')) return;
  e.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) => save(req, res)).catch(() => Response.error())
    )
  );
});
