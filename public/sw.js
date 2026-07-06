// Minimal service worker — just enough to make the app installable via PWABuilder.
// Caches the app shell so it also opens instantly on repeat visits.
const CACHE_NAME = 'kaksha-shell-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Network-first: always try the network so students/fees data and new
  // deploys are fresh; fall back to cache only if offline.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
