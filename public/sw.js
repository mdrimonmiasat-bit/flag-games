const CACHE_NAME = 'flag-battle-v1';

// Full list of country flags to precache
const COUNTRY_CODES = [
  'us', 'gb', 'ca', 'au', 'de', 'fr', 'it', 'es', 'br', 'jp',
  'kr', 'cn', 'in', 'mx', 'ar', 'za', 'ng', 'eg', 'ke', 'sa',
  'ae', 'tr', 'nl', 'se', 'no', 'fi', 'dk', 'pl', 'pt', 'ch',
  'be', 'at', 'gr', 'cz', 'ro', 'hu', 'ie', 'nz', 'sg', 'my',
  'th', 'vn', 'ph', 'id', 'pk', 'bd', 'co', 'cl', 'pe', 'uy',
  'ua', 'hr', 'rs', 'bg', 'sk', 'si', 'is', 'ma', 'gh', 'sn',
  'ci', 'cm', 'dz', 'tn', 'et', 'il', 'qa', 'kw', 'om', 'jo',
  'lb', 'kz', 'uz', 'tw', 'hk', 'jm', 'cr', 'pa', 'ec', 've',
  'bo', 'py', 'do', 'cu', 'ee', 'lv', 'lt', 'lu', 'mt', 'cy',
  'ge', 'am', 'az', 'np', 'lk', 'kh', 'mm', 'fj', 'pg', 'ug',
  'tz', 'ao', 'zw', 'mz'
];

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/style.css',
  '/script.js',
  '/matter.min.js',
  '/confetti.min.js',
  ...COUNTRY_CODES.map(code => `/flags/${code}.svg`),
];

// Install: Precache all essential assets & notify client
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use individual puts with error tolerance so 1 missing asset does not abort install
      await Promise.all(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // Ignore missing optional asset
          }
        })
      );
    })
  );
});

// Activate: Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();

      // Notify open clients that offline precaching is complete
      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({ type: 'OFFLINE_READY' });
      }
    })()
  );
});

// Fetch: Strict Cache-First strategy with fallback & runtime caching
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore chrome-extension or external third-party requests
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(async () => {
          // If offline and requesting root navigation, return cached root '/'
          if (event.request.mode === 'navigate') {
            const root = await caches.match('/');
            if (root) return root;
          }
          return new Response('Offline: Content cached for Flag Battle', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});
