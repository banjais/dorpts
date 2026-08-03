// Service Worker strategy to cache critical API responses for Overall Weight Progress & Indicator stats
const CACHE_VERSION = 'dorpts-sw-v2';
const STATIC_CACHE = 'static-assets-v2';
const CRITICAL_API_CACHE = 'critical-api-stats-cache';
const INDICATOR_CSV_CACHE = 'indicator-overall-weight-csv-cache';

const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/GovtLogo.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/manifest.webmanifest'
];

// Install Event: Pre-cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(ESSENTIAL_ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, CRITICAL_API_CACHE, INDICATOR_CSV_CACHE, 'pages-cache', 'firestore-cache', 'images-cache'].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception Strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests
  if (req.method !== 'GET') return;

  // Strategy 1: Google Sheets Published CSV Data (Overall Weight Progress & Indicator Stats)
  if (url.hostname.includes('docs.google.com') && url.pathname.includes('/spreadsheets/')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && (networkRes.status === 200 || networkRes.status === 0)) {
            const resCopy = networkRes.clone();
            caches.open(INDICATOR_CSV_CACHE).then((cache) => cache.put(req, resCopy));
          }
          return networkRes;
        })
        .catch(async () => {
          // Network unavailable: fall back to cached indicator CSV
          const cachedRes = await caches.match(req);
          if (cachedRes) {
            return cachedRes;
          }
          return new Response('', { status: 503, statusText: 'Offline Cache Unavailable' });
        })
    );
    return;
  }

  // Strategy 2: Critical Backend API Responses (/api/sheets, /api/stats, /api/indicators, /api/overall-progress)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resCopy = networkRes.clone();
            caches.open(CRITICAL_API_CACHE).then((cache) => cache.put(req, resCopy));
          }
          return networkRes;
        })
        .catch(async () => {
          // Fall back to cached API response when offline
          const cachedRes = await caches.match(req);
          if (cachedRes) {
            return cachedRes;
          }
          return new Response(
            JSON.stringify({
              error: 'Network unavailable',
              offline: true,
              message: 'Serving cached offline metrics fallback'
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'X-Offline-Fallback': 'true' }
            }
          );
        })
    );
    return;
  }

  // Strategy 3: Navigation Fallback for SPA
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const staticCache = await caches.open(STATIC_CACHE);
        const indexPage = await staticCache.match('/index.html') || await staticCache.match('/');
        if (indexPage) return indexPage;
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }
});

// Skip Waiting handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
