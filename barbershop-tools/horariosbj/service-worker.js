const CACHE_NAME = 'horariosbj-v2'; // << sempre aumente a versão

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll([
        'index.html',
        'style.css',
        'script.js',
        'manifest.json',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png'
      ]);
    })
  );
  self.skipWaiting(); // ativa imediatamente
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)  // apaga caches antigos
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
