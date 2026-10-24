// Service worker: keeps the app's files cached so the flashcards work offline.
// Bump CACHE_VERSION when the list of files changes.
const CACHE_VERSION = "sensei-v3";

// The login library, cached so pages can still start (and check for a saved login) offline
const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js";

const PRECACHE = [
  SUPABASE_JS,
  "./vocab.html",
  "./vocab-data.js",
  "./activity.js",
  "./theme.css",
  "./theme.js",
  "./pwa.js",
  "./auth.js",
  "./auth.css",
  "./login.html",
  "./profile.html",
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
  // Only handle our own files and the login library (never API calls to Supabase or Anthropic)
  const isOwnFile = new URL(request.url).origin === self.location.origin;
  if (request.method !== "GET" || !(isOwnFile || request.url === SUPABASE_JS)) return;

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
