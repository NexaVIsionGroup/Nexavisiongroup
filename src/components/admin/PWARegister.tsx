"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Scope /admin/ = the installed app's scope (manifest "scope": "/admin"), so Android credits push notifications
    // to the NexaVision Admin app (icon dot) instead of to Chrome. The old site-wide registration is removed.
    (async () => {
      try {
        for (const r of await navigator.serviceWorker.getRegistrations()) {
          if (new URL(r.scope).pathname === "/") await r.unregister();
        }
        await navigator.serviceWorker.register("/sw.js", { scope: "/admin/" });
      } catch { /* silent */ }
    })();
  }, []);

  return null;
}
