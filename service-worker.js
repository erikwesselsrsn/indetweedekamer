// service-worker.js
// Cacht de statische bestanden zodat het spel snel laadt.
// API-calls naar Netlify/Anthropic worden nooit gecacht (altijd live).

const CACHE_NAME = 'kamerlid-v1';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Installatie: cache statische bestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// Activatie: verwijder oude caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: statische bestanden uit cache, API-calls altijd live
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls nooit cachen
  if (url.pathname.startsWith('/.netlify/functions/') ||
      url.hostname.includes('anthropic') ||
      url.hostname.includes('supabase')) {
    return; // laat de browser het normaal afhandelen
  }

  // Statische bestanden: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Sla nieuwe statische bestanden ook op in cache
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
