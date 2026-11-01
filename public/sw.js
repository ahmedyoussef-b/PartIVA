const CACHE_NAME = 'partiva-v2';
const PRECACHE = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

function offlineFallback(req) {
  if (req.mode === 'navigate') {
    return new Response('<h1>Hors-ligne</h1>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
  return new Response('', { status: 503, statusText: 'Offline' });
}

function networkFirst(event) {
  const req = event.request;
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || offlineFallback(req))),
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)));
            }
            return res;
          })
          .catch(() => new Response('', { status: 504 }));
      }),
    );
    return;
  }

  networkFirst(event);
});
