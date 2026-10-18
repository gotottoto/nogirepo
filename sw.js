const CACHE_NAME = 'nogirepo-pwa-v48';
const CORE = [
  './','./index.html','./supabase-config.js',
  './manifest-rep.webmanifest','./manifest-heart.webmanifest',
  './icons/nogirepo-rep-180.png','./icons/nogirepo-rep-192.png','./icons/nogirepo-rep-512.png',
  './icons/nogirepo-heart-180.png','./icons/nogirepo-heart-192.png','./icons/nogirepo-heart-512.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok&&new URL(event.request.url).origin===self.location.origin)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));
  return response;
 }).catch(()=>caches.match('./index.html'))));
});
