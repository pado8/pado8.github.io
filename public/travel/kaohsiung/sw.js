/* 가오슝 도시에 오프라인 캐시.
   문서 하나 + 지도 이미지 + 아이콘이 전부라 통째로 미리 받아둔다.

   문서(HTML)는 **네트워크 우선 + 2.5초 타임아웃**이다.
   온라인이면 항상 최신본이 바로 뜨고(예전 stale-while-revalidate 는 한 번 더 열어야
   새 내용이 보여서 "고쳤는데 왜 그대로냐"가 됐다), 오프라인이거나 느리면 즉시 캐시본으로 떨어진다.
   나머지 자산(지도·아이콘)은 잘 안 바뀌므로 캐시 우선. */
const CACHE = 'kaohsiung-2026-09-06n';
const DOC = './index.html';
const NET_TIMEOUT = 2500;
const SCOPE = new URL('./', self.registration.scope).pathname;
const ASSETS = [
  './',
  DOC,
  './map.jpg?v=2',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

// 확대용 상세 지도. 설치를 막지 않도록 활성화 뒤에 뒤에서 천천히 받아둔다.
// 실패해도 무시한다 — 온라인일 때 다시 열면 그때 채워진다.
const DETAIL = [
  "./map16_00.jpg?v=1",
  "./map16_01.jpg?v=1",
  "./map16_10.jpg?v=1",
  "./map16_11.jpg?v=1",
  "./map17_00.jpg?v=1",
  "./map17_10.jpg?v=1"
];

function prefetchDetail() {
  // 6.7MB짜리라 데이터 아끼기 모드나 느린 회선에서는 미리 받지 않는다.
  // 그런 환경에서도 지도를 확대하면 그 조각만 그때 받아 캐시에 남는다.
  const c2 = self.navigator && self.navigator.connection;
  if (c2 && (c2.saveData || /(^|-)(2g|3g)$/.test(c2.effectiveType || ''))) return Promise.resolve();
  return caches.open(CACHE).then((c) =>
    DETAIL.reduce((p, u) => p.then(() =>
      c.match(u).then((hit) => hit ? null :
        fetch(u, { cache: 'no-cache' })
          .then((res) => (res && res.ok) ? c.put(u, res) : null)
          .catch(() => null))
    ), Promise.resolve())
  );
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => prefetchDetail())
  );
});

function save(key, res) {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(key, copy));
  }
  return res;
}

// 네트워크를 기다리되, 정해진 시간을 넘기면 캐시본으로 넘어간다.
// 타임아웃으로 캐시본을 내보낸 경우에도 네트워크 응답은 계속 받아 캐시를 갱신한다.
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

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 구글 지도 링크 등은 손대지 않는다
  // 내 폴더 밖(예: /tools/pick.js)은 캐시하지 않는다 — 한 번 캐시되면 영영 옛 버전을 물고 있다
  if (!url.pathname.startsWith(SCOPE)) return;

  if (req.mode === 'navigate') {
    e.respondWith(docResponse());
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) => save(req, res)).catch(() => Response.error())
    )
  );
});
