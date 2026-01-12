// This is the "Offline page" service worker

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
);

// Ensure SW updates take effect without requiring manual "refresh twice".
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Optional performance win for navigations.
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Precache our "app shell" bits.
// Note: `revision: null` means "update when the SW updates".
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  { url: OFFLINE_URL, revision: null },
  { url: "/public/assets/fat.png", revision: null },
  { url: "/public/assets/normal.png", revision: null },
  { url: "/public/assets/stress.png", revision: null },
  { url: "/public/assets/thin.png", revision: null },
  { url: "/public/assets/icon-192x192.png", revision: null },
  { url: "/public/assets/icon-512x512.png", revision: null },
];

workbox.precaching.cleanupOutdatedCaches();
workbox.precaching.precacheAndRoute(PRECACHE_URLS);

// Runtime caching: images (cache-first).
workbox.routing.registerRoute(
  ({ request }) => request.destination === "image",
  new workbox.strategies.CacheFirst({
    cacheName: "images-v1",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Runtime caching: navigations (network-first) with offline fallback.
workbox.routing.registerRoute(
  ({ request }) => request.mode === "navigate",
  new workbox.strategies.NetworkFirst({
    cacheName: "pages-v1",
  })
);

workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.mode === "navigate") {
    const cached = await workbox.precaching.matchPrecache(OFFLINE_URL);
    return cached || Response.error();
  }

  return Response.error();
});
