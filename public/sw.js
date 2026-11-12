const CACHE_NAME = 'weatherboard-v1';

// Cache the app shell on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle offline caching for fetch requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found, otherwise fetch from network
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        // Cache API responses for weather
        if (event.request.url.includes('openweathermap.org')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and no cache, just fail gracefully
        return new Response('Offline');
      });
    })
  );
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time to check the weather!',
    icon: 'https://openweathermap.org/img/wn/01d@4x.png'
  };
  event.waitUntil(self.registration.showNotification('WeatherBoard', options));
});