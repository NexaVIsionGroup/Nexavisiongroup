const CACHE_NAME = "nexa-admin-v4";
const STATIC = "nexa-static-v1";
// Scope /admin/ (registered by PWARegister). Speed strategy:
//   /_next/static, icons, fonts → cache-first (file names are content-hashed: they never change)
//   admin pages (navigations)   → stale-while-revalidate: open instantly from the last copy, refresh in the background
//   /api GETs                   → network-first, but fall back to the saved answer after 2.5 s on a bad connection
const PRECACHE = ["/admin", "/admin/login"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== STATIC).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

const putIn = (name, req, res) => { if (res && res.ok && req.method === "GET") { const c = res.clone(); caches.open(name).then((cache) => cache.put(req, c)); } return res; };

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(woff2?|png|svg|ico)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => putIn(STATIC, req, res))));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    if (url.pathname.startsWith("/api/admin/notifications")) return;          // always live
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => caches.match(req).then((hit) => { if (hit && !done) { done = true; resolve(hit); } }), 2500);
      fetch(req).then((res) => { clearTimeout(timer); putIn(CACHE_NAME, req, res); if (!done) { done = true; resolve(res); } })
        .catch(() => caches.match(req).then((hit) => { if (!done) { done = true; resolve(hit || Response.error()); } }));
    }));
    return;
  }

  if (req.mode === "navigate" && url.pathname.startsWith("/admin")) {
    e.respondWith(caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => putIn(CACHE_NAME, req, res)).catch(() => hit);
      return hit || fresh;
    }));
    return;
  }
});

// ── Admin notifications (Web Push from src/lib/notify.ts) ─────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "NexaVision", body: e.data ? e.data.text() : "" }; }
  // app-icon count where the launcher supports it (Android shows the dot from the notification itself)
  if (self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge().catch(() => {});
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
