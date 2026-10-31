"use client";

import { useEffect, useMemo, useRef } from "react";

// Lightweight analytics for a /q/<token> page: events are queued and sent in
// batches (every few seconds, and on pagehide via sendBeacon). No cookies, no
// third parties; a random per-browser id in localStorage tells repeat visits
// from the same phone apart from a forwarded link.

export type TrackFn = (e: string, s?: string, m?: Record<string, unknown>) => void;

const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function useTrack(token: string): TrackFn {
  const queue = useRef<{ e: string; s?: string; m?: Record<string, unknown>; t: number }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visit = useMemo(() => rid(), []);
  const t0 = useRef(Date.now());
  const maxScroll = useRef(0);
  const seen = useRef(new Set<string>());
  const opened = useRef(false);

  const flush = useRef((beacon = false) => {
    const events = queue.current;
    if (!events.length) return;
    queue.current = [];
    let device = lsGet("nvq:device");
    if (!device) { device = rid(); lsSet("nvq:device", device); }
    const body = JSON.stringify({
      visit, device, events,
      ua: navigator.userAgent,
      referrer: document.referrer || null,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const url = `/api/q/${token}/event`;
    if (beacon && navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    else fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  });

  const track = useRef<TrackFn>((e, s, m) => {
    // "view"/"step" fire once per visit per section
    if (e === "view" || e === "step") {
      const k = `${e}:${s}`;
      if (seen.current.has(k)) return;
      seen.current.add(k);
    }
    queue.current.push({ e, s, m, t: Date.now() });
    if (queue.current.length >= 20) flush.current();
    else if (!timer.current) timer.current = setTimeout(() => { timer.current = null; flush.current(); }, 4000);
  });

  useEffect(() => {
    if (!opened.current) track.current("visit", undefined, { returning: !!lsGet("nvq:device") });
    opened.current = true;
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0) maxScroll.current = Math.max(maxScroll.current, Math.round((window.scrollY / h) * 100));
    };
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      track.current("end", undefined, { seconds: Math.round((Date.now() - t0.current) / 1000), maxScroll: maxScroll.current });
      flush.current(true);
      // if they come back to the tab, a fresh "end" will be sent on the next hide
      t0.current = Date.now();
      seen.current.delete("end");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return track.current;
}

/** Fire `view` for each [data-track] section as it scrolls into view. */
export function useViewTracking(track: TrackFn, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const els = document.querySelectorAll<HTMLElement>("[data-track]");
    if (!els.length) return;
    // a section counts as seen at 25% visible, or at half a screen's worth
    // for sections taller than the screen (so long chapters still register)
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const need = Math.min(0.25, (window.innerHeight * 0.5) / Math.max(1, en.boundingClientRect.height));
        if (en.isIntersecting && en.intersectionRatio >= need) track("view", en.target.getAttribute("data-track") || undefined);
      }
    }, { threshold: [0.01, 0.05, 0.1, 0.15, 0.25] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [track, enabled]);
}
