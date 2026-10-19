const CACHE_NAME = 'nogirepo-pwa-v49';
const CORE = [
  './','./index.html','./supabase-config.js',
  './manifest-rep.webmanifest','./manifest-heart.webmanifest',
  './icons/nogirepo-rep-180.png','./icons/nogirepo-rep-192.png','./icons/nogirepo-rep-512.png',
  './icons/nogirepo-heart-180.png','./icons/nogirepo-heart-192.png','./icons/nogirepo-heart-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE); } catch (error) { console.warn('Some offline assets could not be cached', error); }
    await self.skipWaiting();
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

  // Always fetch page navigations from the network first, so GitHub Pages updates appear without a query string.
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

  // Network-first for same-site assets; use cache only when offline.
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
