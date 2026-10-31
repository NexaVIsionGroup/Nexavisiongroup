const CACHE_NAME = "nexa-admin-v3";
const PRECACHE = ["/admin", "/admin/login"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Network-first for API routes and admin pages
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/admin")) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && request.method === "GET") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// ── Admin notifications (Web Push from src/lib/notify.ts) ─────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "NexaVision", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "NexaVision", {
    body: d.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || "/admin" },
  }));
});

// tap → focus an open admin window on that page, else open one
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/admin", self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.includes("/admin") && "focus" in w) { await w.focus(); if ("navigate" in w) return w.navigate(url); return; }
    }
    return self.clients.openWindow(url);
  })());
});
