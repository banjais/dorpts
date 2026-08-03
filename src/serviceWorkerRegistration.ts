/**
 * Service Worker Registration and Offline Cache Strategy Helper
 * Handles registration and caching for Overall Weight Progress & Indicator stats.
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service worker registered successfully:', registration.scope);
          
          // Check for service worker updates periodically
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[SW] New content is available and will be used when all tabs are closed.');
                } else {
                  console.log('[SW] Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.debug('[SW] Service worker registration note:', error);
        });
    });
  }
}

/**
 * Cache API Response in CacheStorage for Offline Fallback
 */
export async function cacheApiResponse(url: string, data: any, cacheName = 'critical-api-stats-cache'): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(cacheName);
    const response = new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cached-At': new Date().toISOString() }
    });
    await cache.put(url, response);
  } catch (err) {
    console.debug('[SW Cache] Caching response error:', err);
  }
}

/**
 * Retrieve Cached API Response from CacheStorage
 */
export async function getCachedApiResponse<T = any>(url: string, cacheName = 'critical-api-stats-cache'): Promise<T | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await caches.open(cacheName);
    const match = await cache.match(url);
    if (match) {
      return (await match.json()) as T;
    }
  } catch (err) {
    console.debug('[SW Cache] Match response error:', err);
  }
  return null;
}
