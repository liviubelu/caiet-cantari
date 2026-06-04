// Bump this version whenever you need all clients to get a fresh cache.
// On a Vercel deploy the JS/CSS hashes change automatically, so old bundles
// remain in cache until the browser evicts them — no manual bump needed for
// code changes. Bump only if you want to force-clear the navigation cache.
const CACHE = "caiet-v2"

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting())
})

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return

  // ── Navigation requests (HTML pages) ────────────────────────────────────────
  // Network-first: always try the server, cache the response for offline use.
  // If the server is unreachable (offline), serve the last cached version of
  // that page, or fall back to the cached root ("/").
  // The React OfflineOverlay component then takes over and shows the offline UI.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(request, clone))
          }
          return res
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ??
            (await caches.match("/")) ??
            new Response("Offline", { status: 503 })
          )
        })
    )
    return
  }

  // ── API routes ────────────────────────────────────────────────────────────────
  // Never cache API responses in the SW — IndexedDB handles offline data.
  if (url.pathname.startsWith("/api/")) return

  // ── Static assets (JS, CSS, fonts, images) ───────────────────────────────────
  // Cache-first: Next.js bundles use content-hash filenames so a cache hit is
  // always the correct version.
  const isStatic =
    /\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|svg|ico|webp|map)(\?.*)?$/.test(
      url.pathname
    )

  if (!isStatic || request.method !== "GET") return

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(request, clone))
        }
        return res
      })
    })
  )
})
