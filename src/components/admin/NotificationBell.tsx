"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellRing, Check, Smartphone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 🔔 Admin notifications: unread count + latest alerts (from /api/admin/notifications), sidebar badge counts, and
// phone push on/off for this device (Web Push via the admin service worker). Polls every 45 s and on focus.

export type Alert = { id: string; type: string; title: string; message: string | null; action_url: string | null; read: boolean; created_at: string };
type State = { items: Alert[]; unread: number; badges: Record<string, number> };

let shared: State = { items: [], unread: 0, badges: {} };
const listeners = new Set<(s: State) => void>();

let inflight: Promise<void> | null = null;
let lastAt = 0;
const MIN_GAP = 5000;        // every mounted bell/badge shares one poll; back-to-back mounts don't refetch

async function refresh(force = false) {
  if (inflight) return inflight;
  if (!force && Date.now() - lastAt < MIN_GAP) return;
  inflight = (async () => {
    try {
      const r = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!r.ok) return;
      shared = await r.json();
      lastAt = Date.now();
      listeners.forEach((l) => l(shared));
      const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
      if (shared.unread > 0) nav.setAppBadge?.(shared.unread).catch(() => {}); else nav.clearAppBadge?.().catch(() => {});
    } catch { /* offline */ }
    finally { inflight = null; }
  })();
  return inflight;
}

let lastReadPath = "";

/** live alert state shared by the bell, the sidebar badges and the bottom nav */
export function useAdminAlerts() {
  const [s, setS] = useState<State>(shared);
  const pathname = usePathname();
  useEffect(() => {
    listeners.add(setS);
    refresh();
    const id = setInterval(refresh, 45000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { listeners.delete(setS); clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, []);
  // opening a page clears that page's alerts
  useEffect(() => {
    if (!pathname || pathname === "/admin") return;
    const base = "/" + pathname.split("/").slice(1, 3).join("/");
    if (base === lastReadPath) return;                      // several bells/badges on one page → one POST
    lastReadPath = base;
    fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read_path", path: base }) })
      .then(() => setTimeout(() => refresh(true), 400)).catch(() => {});
  }, [pathname]);
  return s;
}

function ago(s: string) {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

const urlB64 = (b: string) => {
  const p = "=".repeat((4 - (b.length % 4)) % 4);
  const raw = atob((b + p).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

async function post(body: object) {
  const r = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

export default function NotificationBell() {
  const { items, unread } = useAdminAlerts();
  const [open, setOpen] = useState(false);
  const [push, setPush] = useState<"unknown" | "off" | "on" | "blocked" | "unsupported">("unknown");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const checkPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setPush("unsupported"); return; }
    if (Notification.permission === "denied") { setPush("blocked"); return; }
    const reg = await navigator.serviceWorker.getRegistration("/admin/");
    const sub = await reg?.pushManager.getSubscription();
    // permission already given but no subscription on the /admin/ worker (moved from the old site-wide one, or the
    // browser dropped it) → re-subscribe silently so alerts keep coming without tapping Turn on again
    if (!sub && Notification.permission === "granted" && localStorage.getItem("nv_push_off") !== "1") { turnOn(true); return; }
    setPush(sub ? "on" : "off");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { checkPush(); }, [checkPush]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function turnOn(silent = false) {
    setBusy(true); setNote("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPush(perm === "denied" ? "blocked" : "off"); return; }
      const reg = (await navigator.serviceWorker.getRegistration("/admin/")) || (await navigator.serviceWorker.register("/sw.js", { scope: "/admin/" }));
      await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setNote("Push isn't configured on the server yet."); return; }
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(key) }));
      const device = `${navigator.userAgent.match(/\(([^)]+)\)/)?.[1] || "device"}`.slice(0, 120);
      const r = await post({ action: "subscribe", subscription: sub.toJSON(), device });
      if (r.error) { setNote(r.error); return; }
      setPush("on");
      localStorage.removeItem("nv_push_off");
      if (!silent) { await post({ action: "test" }); setNote("Sent a test notification to this device."); }
    } catch (e) { setNote(e instanceof Error ? e.message : "Could not turn on notifications."); }
    finally { setBusy(false); }
  }

  async function turnOff() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration("/admin/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await post({ action: "unsubscribe", endpoint: sub.endpoint }); await sub.unsubscribe(); }
    localStorage.setItem("nv_push_off", "1");              // don't silently re-subscribe after an explicit Turn off
    setPush("off"); setBusy(false);
  }

  async function openAlert(a: Alert) {
    setOpen(false);
    if (!a.read) await post({ action: "read", id: a.id });
    await refresh(true);
    if (a.action_url) router.push(a.action_url);
  }

  return (
    <div className="relative" ref={box}>
      <button onClick={() => { setOpen(!open); refresh(true); }} aria-label="Notifications"
        className="relative p-2 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5 transition-colors">
        {unread > 0 ? <BellRing size={21} className="text-nv-teal" /> : <Bell size={21} />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-nv-error text-white text-[10.5px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,380px)] max-h-[75vh] overflow-hidden rounded-nv-xl border border-white/10 bg-nv-abyss shadow-2xl z-50 flex flex-col">
          <div className="flex items-center px-4 py-3 border-b border-white/5">
            <div className="text-[14px] font-semibold text-nv-text-primary">Notifications</div>
            {unread > 0 && (
              <button onClick={async () => { await post({ action: "read_all" }); refresh(true); }} className="ml-auto text-[12.5px] text-nv-teal flex items-center gap-1">
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-nv-text-muted">Nothing yet — new emails, questionnaires, requests and orders show up here.</div>
            ) : items.map((a) => (
              <button key={a.id} onClick={() => openAlert(a)}
                className={cn("w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 flex gap-3", !a.read && "bg-nv-teal/5")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.read ? "bg-transparent" : "bg-nv-teal")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] text-nv-text-primary font-medium truncate">{a.title}</span>
                  {a.message && <span className="block text-[12.5px] text-nv-text-secondary line-clamp-2">{a.message}</span>}
                </span>
                <span className="text-[11px] text-nv-text-muted shrink-0">{ago(a.created_at)}</span>
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-white/5 text-[12.5px]">
            <div className="flex items-center gap-2 text-nv-text-secondary">
              <Smartphone size={14} />
              <span className="flex-1">
                Phone notifications: {push === "on" ? <b className="text-nv-teal">On for this device</b>
                  : push === "blocked" ? <b className="text-nv-error">Blocked in browser settings</b>
                  : push === "unsupported" ? "not supported in this browser"
                  : <b className="text-nv-text-primary">Off</b>}
              </span>
              {busy ? <Loader2 size={14} className="animate-spin" />
                : push === "off" ? <button onClick={() => turnOn()} className="nv-btn-primary px-3 py-1 text-[12px]">Turn on</button>
                : push === "on" ? (
                  <span className="flex gap-2">
                    <button onClick={async () => { await post({ action: "test" }); setNote("Test sent."); }} className="text-nv-teal">Send test</button>
                    <button onClick={turnOff} className="text-nv-text-muted">Turn off</button>
                  </span>
                ) : null}
            </div>
            {push === "blocked" && <div className="mt-1 text-nv-text-muted">Allow notifications for nexavisiongroup.com in the browser&apos;s site settings, then reopen this.</div>}
            {note && <div className="mt-1 text-nv-text-muted">{note}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
