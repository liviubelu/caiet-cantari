const CACHE = "caiet-v1"

// Install: skip waiting so the new SW activates immediately
self.addEventListener("install", () => self.skipWaiting())

// Activate: clean up old caches, claim clients
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

// Fetch: cache-first for static assets, network-only for everything else
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)

  // Only cache GET requests to static assets (JS, CSS, fonts, images)
  const isStatic = /\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|svg|ico|webp)(\?.*)?$/.test(
    url.pathname
  )

  if (!isStatic || e.request.method !== "GET") return

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
    })
  )
})
