// Service worker: keeps the app's files cached so the flashcards work offline.
// Bump CACHE_VERSION when the list of files changes.
const CACHE_VERSION = "sensei-v1";

const PRECACHE = [
  "./vocab.html",
  "./vocab-data.js",
  "./activity.js",
  "./theme.css",
  "./theme.js",
  "./pwa.js",
  "./dashboard.html",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Drop caches from older versions
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first, so students always get the latest version when online;
// fall back to the cache when offline.
self.addEventListener("fetch", event => {
  const { request } = event;
  // Only handle our own files (never the Anthropic API calls)
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request, { ignoreSearch: true }).then(cached =>
          // An uncached page while offline: show the flashcards instead
          cached || (request.mode === "navigate" ? caches.match("./vocab.html") : Response.error())
        )
      )
  );
});
