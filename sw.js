const CACHE_NAME = 'vibecourse-v1';

// Всё что кэшируем для офлайн-работы
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Установка: кэшируем файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация: удаляем старый кэш
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Перехват запросов: сначала кэш, потом сеть
self.addEventListener('fetch', event => {
  // Для Google Fonts — только сеть (не кэшируем)
  if (event.request.url.includes('fonts.googleapis') ||
      event.request.url.includes('fonts.gstatic')) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Кэшируем новые успешные ответы
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // Офлайн fallback
        return caches.match('./index.html');
      });
    })
  );
});
