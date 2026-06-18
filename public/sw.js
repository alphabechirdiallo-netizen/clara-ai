const CACHE_NAME = 'clara-v1'
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/chat',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET and API requests
  if (request.method !== 'GET') return
  if (request.url.includes('/api/')) return
  if (request.url.includes('supabase')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached
          // Return offline message for navigation requests
          if (request.mode === 'navigate') {
            return new Response(
              `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Clara — Hors ligne</title>
  <style>
    body { margin: 0; background: #0a0a0b; color: #e4e4e7; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 600; color: #fafafa; margin-bottom: 1rem; }
    p { color: #71717a; line-height: 1.6; max-width: 360px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f97316; margin: 0 3px; animation: pulse 1.5s ease-in-out infinite; }
    .dot:nth-child(2) { animation-delay: 0.3s; }
    .dot:nth-child(3) { animation-delay: 0.6s; }
    @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
  </style>
</head>
<body>
  <div>
    <div style="margin-bottom: 1.5rem"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
    <h1>Vous êtes hors connexion</h1>
    <p>Clara reprendra automatiquement lorsque votre connexion internet sera rétablie.</p>
  </div>
</body>
</html>`,
              { headers: { 'Content-Type': 'text/html' } }
            )
          }
          return new Response('Offline', { status: 503 })
        })
      )
  )
})
