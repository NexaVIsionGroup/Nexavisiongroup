const CACHE_NAME = "nexa-admin-v6";
const STATIC = "nexa-static-v1";
// Scope /admin/ (registered by PWARegister). Speed strategy:
//   /_next/static, icons, fonts → cache-first (file names are content-hashed: they never change)
//   admin pages (navigations)   → stale-while-revalidate: open instantly from the last copy, refresh in the background
//   /api GETs                   → network-first, but fall back to the saved answer after 2.5 s on a bad connection
//
// ⚠️ Never store a REDIRECTED response (e.g. the login page that /admin redirects to when the session is out):
// Chrome refuses to serve a redirected response for a navigation ("redirect mode is not follow") → the page
// fails with ERR_FAILED. That was the "app doesn't load half the time" bug (v5 and earlier precached it).
const PRECACHE = ["/admin", "/admin/login", "/admin/inbox"];

const storable = (res) => !!res && res.ok && !res.redirected && res.type === "basic";

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(PRECACHE.map(async (u) => {
        try {
          const res = await fetch(u, { credentials: "include", redirect: "follow" });
          if (storable(res) && new URL(res.url).pathname === u) await cache.put(u, res);
        } catch { /* offline at install — fine */ }
      }));
    } catch { /* ignore */ }
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== STATIC).map((k) => caches.delete(k)));
    // drop any poisoned (redirected) page copies left by older versions
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const req of await cache.keys()) {
        const res = await cache.match(req);
        if (!storable(res)) await cache.delete(req);
      }
    } catch { /* ignore */ }
    await self.clients.claim();
  })());
});

const putIn = (name, req, res) => {
  if (storable(res) && req.method === "GET") {
    const c = res.clone();
    caches.open(name).then((cache) => cache.put(req, c)).catch(() => {});
  }
  return res;
};

// a cached hit is only usable if it isn't a redirect (see note above)
const usable = async (req) => {
  const hit = await caches.match(req).catch(() => undefined);
  return hit && !hit.redirected ? hit : undefined;
};

const OFFLINE_PAGE = () => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NexaVision Admin</title>
<body style="margin:0;background:#050B18;color:#dfe7f3;font:16px system-ui;display:grid;place-items:center;min-height:100vh;text-align:center">
<div><p style="font-size:34px;margin:0 0 8px">📡</p><p style="margin:0 0 6px;font-weight:700">You're offline</p>
<p style="margin:0 0 18px;color:#8896A6;font-size:14px">This page hasn't been saved on this phone yet.</p>
<button onclick="location.reload()" style="background:#00E5CC;color:#050B18;border:0;border-radius:999px;padding:12px 22px;font-weight:700">Try again</button></div>`,
  { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
);

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
    e.respondWith((async () => {
      const hit = await usable(req);
      const fresh = fetch(req).then((res) => putIn(CACHE_NAME, req, res)).catch(() => null);
      if (hit) { e.waitUntil(fresh); return hit; }
      const res = await fresh;
      return res || OFFLINE_PAGE();
    })());
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
