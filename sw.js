const CACHE_NAME = 'nogirepo-pwa-v54';
const CORE = [
  './','./index.html','./supabase-config.js',
  './manifest-rep.webmanifest','./manifest-heart.webmanifest',
  './icons/nogirepo-rep-180.png','./icons/nogirepo-rep-192.png','./icons/nogirepo-rep-512.png',
  './icons/nogirepo-heart-180.png','./icons/nogirepo-heart-192.png','./icons/nogirepo-heart-512.png'
];

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE); } catch (error) { console.warn('一部のオフライン用ファイルを保存できませんでした', error); }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('nogirepo-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations always use the network. Fall back to the cached page only when offline.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith((async () => {
      try {
        return await fetch(new Request(request, { cache: 'no-store' }));
      } catch (error) {
        const cached = await caches.match(request) || await caches.match('./index.html');
        if (cached) return cached;
        return new Response('ネットワークに接続できません。オンラインで再読み込みしてください。', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw error;
    }
  })());
});
