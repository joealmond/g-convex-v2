// G-Matrix Service Worker
// Manual service worker for app shell caching + offline fallback
// Strategy: Cache-first for static assets, network-first for API/data

// IMPORTANT: Bump this version string on every deploy to invalidate old caches.
// The activate handler automatically deletes caches that don't match CACHE_NAME.
const CACHE_NAME = 'gmatrix-2025.02.20-v1'

// Static assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
]

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

// Fetch: routing strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Never cache Convex WebSocket or API requests
  if (
    url.hostname.includes('convex.cloud') ||
    url.hostname.includes('convex.site') ||
    url.protocol === 'wss:' ||
    url.pathname.startsWith('/api/')
  ) {
    return
  }

  // Google Fonts: cache-first (they never change once versioned)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Static assets (JS, CSS, images, SVG): stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|webp|woff2?)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            }
            return response
          })
          .catch(() => cached) // If fetch fails and we have cache, that's fine

        return cached || fetchPromise
      })
    )
    return
  }

  // HTML pages (navigation): network-first, fall back to cached shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version of the page
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => {
          // Offline: try cached version, then fall back to root shell
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/')
          })
        })
    )
    return
  }
})
