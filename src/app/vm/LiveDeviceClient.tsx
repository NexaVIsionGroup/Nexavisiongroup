"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LogOut, Maximize, MonitorSmartphone, RefreshCw, AlertTriangle } from "lucide-react";

// The door for a live-control appliance: a real, working phone. Unlike the hotspot deck (a
// settings panel for a phone with no screen) this one just wakes the device and hands the
// viewer the same peer-to-peer WebRTC stream the admin "Live Control" panel uses — full
// screen + touch, scoped to the one device this account owns.

export default function LiveDeviceClient({ user, device }: {
  user: { username: string };
  device: { label: string; model: string };
}) {
  const [state, setState] = useState<"waking" | "ready" | "error">("waking");
  const [error, setError] = useState("");
  const [controlUrl, setControlUrl] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const wake = useCallback(async () => {
    setState("waking");
    setError("");
    try {
      const r = await fetch("/api/vm/livecontrol", { method: "POST" });
      if (r.status === 401) { window.location.reload(); return; }
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setState("error"); setError(d.error || "Could not reach the device."); return; }
      setControlUrl(d.control_url);
      setState("ready");
    } catch {
      setState("error");
      setError("Could not reach the device.");
    }
  }, []);

  useEffect(() => { wake(); }, [wake]);

  const goFullscreen = () => {
    const el = frameRef.current as (HTMLIFrameElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).catch(() => document.documentElement.requestFullscreen?.().catch(() => {}));
    else el.webkitRequestFullscreen?.();
  };
  const logout = async () => { await fetch("/api/vm/logout", { method: "POST" }); window.location.reload(); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-nv-void" style={{ height: "100dvh" }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-nv-deep/80">
        <MonitorSmartphone size={16} className="text-nv-teal shrink-0" />
        <span className="text-sm text-nv-text-secondary truncate">
          <span className="text-nv-text-primary font-semibold">{device.label}</span>{" "}
          <span className="opacity-50 mx-1">/</span>{" "}
          <span className="text-nv-text-primary font-medium">{user.username}</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          {state === "ready" && (
            <>
              <button onClick={() => { setFrameKey((k) => k + 1); wake(); }} title="Reconnect"
                className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
                <RefreshCw size={16} />
              </button>
              <button onClick={goFullscreen} title="Fullscreen"
                className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
                <Maximize size={16} />
              </button>
            </>
          )}
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-nv-md text-sm text-nv-text-muted hover:text-nv-error hover:bg-white/5">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      {state === "waking" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-nv-text-secondary">
          <Loader2 size={28} className="animate-spin text-nv-teal" />
          <span className="text-sm">Waking {device.label}…</span>
        </div>
      )}
      {state === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <AlertTriangle size={28} className="text-nv-warning" />
          <p className="text-sm text-nv-text-secondary max-w-sm">{error}</p>
          <button onClick={wake} className="nv-btn-primary px-4 py-2 text-[13px]">Try again</button>
        </div>
      )}
      {state === "ready" && controlUrl && (
        <iframe ref={frameRef} key={frameKey} src={controlUrl} title="Live control" allowFullScreen
          className="flex-1 w-full border-0 bg-black"
          allow="fullscreen; clipboard-read; clipboard-write; autoplay" />
      )}
    </div>
  );
}
