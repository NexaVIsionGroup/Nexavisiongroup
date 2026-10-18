"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, BatteryCharging, Check, Clock, Copy, Eye, EyeOff, Loader2, LogOut,
  Pencil, Power, RefreshCw, RotateCcw, Router, Signal, Users, Wifi, WifiOff,
} from "lucide-react";
import { CLOUD_INPUT, CLOUD_LABEL } from "./CloudShell";

// The door for an appliance account: a phone with a dead screen that now only serves a hotspot.
// Everything its owner would otherwise need a working display for -- what it is advertising, how
// much battery is left, who is connected -- is here, plus the things they can change.

// TEMPORARY. The 5G plan upgrade has not landed yet, so the radio still reports LTE; this renders
// the connection tile the way it will look on Ultra Wideband. It is labelled as a preview rather
// than shown as fact, and it CLEARS ITSELF the moment the phone really reports 5G -- so when the
// plan changes, the tile starts telling the truth with no code change.
const PREVIEW_5G_UW = true;

type Status = {
  ok?: number | boolean; online?: boolean; err?: string;
  ssid?: string; password?: string; up?: boolean;
  clients?: number; client_ips?: string[];
  battery?: number; charging?: string;
  operator?: string; net_type?: string; net_tier?: string; bars?: number;
  rsrp?: string; nr_ready?: boolean;
  internet?: number; uptime_s?: number;
  applied?: boolean; wallpaper?: boolean; error?: string;
};

const REFRESH_MS = 15_000;
const RESTART_MS = 100_000;

const TIER_WORD: Record<string, string> = {
  veryfast: "Very fast", fast: "Fast", ok: "Good", weak: "Weak signal", unknown: "",
};

function uptimeLabel(s?: number) {
  if (!s || s < 0) return "--";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Four bars, filled to `n`. Reads at a glance where a dBm number would not. */
function Bars({ n, tone }: { n: number; tone: string }) {
  return (
    <span className="inline-flex shrink-0 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={"w-[3px] rounded-sm " + (i < n ? tone : "bg-white/20")}
          style={{ height: 5 + i * 3 }} />
      ))}
    </span>
  );
}

function Tile({ icon, label, value, sub, tone = "text-white", trailing }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; tone?: string; trailing?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[12px] text-white/50">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className={"min-w-0 truncate text-[18px] font-semibold leading-tight " + tone}>{value}</span>
        {trailing}
      </div>
      {sub && <div className="truncate text-[12px] leading-tight text-white/45">{sub}</div>}
    </div>
  );
}

function CopyRow({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(!secret);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked: the value is on screen anyway */ }
  };
  return (
    <div className="flex items-center gap-1.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] tracking-wide text-white/45">{label}</div>
        <div className="truncate text-[21px] font-semibold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
          {show ? value || "--" : "•".repeat(Math.max(value.length, 6))}
        </div>
      </div>
      {secret && (
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
          className="shrink-0 rounded-xl p-2 text-white/55 hover:bg-white/5 hover:text-white">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      <button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}
        className="shrink-0 rounded-xl p-2 text-white/55 hover:bg-white/5 hover:text-white">
        {copied ? <Check size={18} className="text-nv-teal" /> : <Copy size={18} />}
      </button>
    </div>
  );
}

export default function HotspotClient({ user, device }: {
  user: { username: string };
  device: { label: string; model: string };
}) {
  const [st, setSt] = useState<Status | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [busy, setBusy] = useState<"" | "save" | "restart" | "poweroff">("");
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [ssid, setSsid] = useState("");
  const [pw, setPw] = useState("");
  const [confirming, setConfirming] = useState<"" | "restart" | "poweroff">("");
  const [restartingUntil, setRestartingUntil] = useState(0);
  const [poweredOff, setPoweredOff] = useState(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/vm/hotspot", { cache: "no-store" });
      if (r.status === 401) { window.location.reload(); return; }
      setSt((await r.json()) as Status);
    } catch { /* keep the last good reading on screen */ }
    setFirstLoad(false);
  }, []);

  // Poll, but never while a change is in flight: those calls take ~25 s and the answer they
  // return is itself a fresh status, so an overlapping poll would only fight with it.
  useEffect(() => {
    load();
    const id = setInterval(() => { if (!busyRef.current) load(); }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const online = st?.online === true;
  const restarting = Date.now() < restartingUntil;

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setNote(null);
    try {
      const r = await fetch("/api/vm/hotspot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "credentials", ssid: ssid.trim(), password: pw }),
      });
      const d = (await r.json()) as Status;
      if (!r.ok || d.ok === false || d.applied === false) {
        setNote({ kind: "err", text: d.error || "The hotspot did not accept that. Nothing was changed." });
      } else {
        setSt(d);
        setEditing(false);
        setNote({
          kind: "ok",
          text: d.wallpaper === false
            ? "Hotspot updated. The label on the phone's screen could not be redrawn."
            : "Hotspot updated. Reconnect your devices with the new details.",
        });
      }
    } catch {
      setNote({ kind: "err", text: "Could not reach the hotspot. Nothing was changed." });
    }
    setBusy("");
    load();
  }

  async function power(action: "restart" | "poweroff") {
    setBusy(action);
    setNote(null);
    setConfirming("");
    try {
      await fetch("/api/vm/hotspot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (action === "restart") {
        setRestartingUntil(Date.now() + RESTART_MS);
        setNote({ kind: "ok", text: "Restarting. The hotspot comes back on its own in about a minute." });
      } else {
        setPoweredOff(true);
        setNote({ kind: "ok", text: "Powering off. Someone has to press the power button to bring it back." });
      }
    } catch {
      setNote({ kind: "err", text: "Could not send that. Nothing happened." });
    }
    setBusy("");
  }

  const openEditor = () => {
    setSsid(st?.ssid || "");
    setPw(st?.password || "");
    setNote(null);
    setEditing(true);
  };

  // ---- connection tile ----
  const realNet = st?.net_type || "";
  const reallyOn5G = realNet.startsWith("5G");
  const previewing = PREVIEW_5G_UW && online && !reallyOn5G;
  const netValue = previewing ? "5G UW" : realNet || "--";
  const tier = previewing ? "veryfast" : st?.net_tier || "unknown";
  const bars = previewing ? 4 : st?.bars ?? 0;
  const netTone = tier === "veryfast" || tier === "fast" ? "text-nv-teal"
    : tier === "weak" ? "text-nv-warning" : "text-white";
  const barTone = tier === "veryfast" || tier === "fast" ? "bg-nv-teal"
    : tier === "weak" ? "bg-nv-warning" : "bg-white/70";
  const netSub = !online ? undefined
    : previewing ? `Preview · now on ${realNet || "LTE"}`
    : [st?.operator, TIER_WORD[tier]].filter(Boolean).join(" · ");

  const battery = st?.battery;
  const charging = (st?.charging || "").toLowerCase();
  const onCharge = charging === "charging" || charging === "full";
  const batteryTone = battery == null ? "text-white"
    : battery <= 15 ? "text-nv-error" : battery <= 40 ? "text-nv-warning" : "text-white";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-nv-void" style={{ minHeight: "100dvh" }}>
      <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-4">

        {/* who and what */}
        <header className="mb-5 flex items-center gap-2">
          <Router size={20} className="shrink-0 text-nv-teal" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px] font-semibold leading-tight text-white">{device.label}</div>
            <div className="truncate text-[12.5px] leading-tight text-white/45">
              {device.model} &middot; {user.username}
            </div>
          </div>
          <button onClick={() => load()} aria-label="Refresh"
            className="shrink-0 rounded-xl p-2.5 text-white/55 hover:bg-white/5 hover:text-white">
            <RefreshCw size={17} className={firstLoad ? "animate-spin" : ""} />
          </button>
          <button aria-label="Sign out"
            onClick={async () => { await fetch("/api/vm/logout", { method: "POST" }); window.location.reload(); }}
            className="shrink-0 rounded-xl p-2.5 text-white/55 hover:bg-white/5 hover:text-nv-error">
            <LogOut size={17} />
          </button>
        </header>

        {/* reachability */}
        {!firstLoad && !online && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-nv-warning/35 bg-nv-warning/10 px-4 py-3 text-[14.5px] leading-relaxed text-nv-warning">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              {poweredOff
                ? "Powered off. It stays off until someone presses the power button on the phone."
                : restarting
                  ? "Restarting. This page reconnects on its own once the hotspot is back."
                  : "Cannot reach the hotspot right now. It may be off, out of signal, or restarting. This page keeps trying."}
            </span>
          </div>
        )}

        {note && (
          <div role="status"
            className={"mb-4 rounded-2xl border px-4 py-3 text-[14.5px] leading-relaxed " + (note.kind === "ok"
              ? "border-nv-teal/35 bg-nv-teal/10 text-nv-teal"
              : "border-nv-error/35 bg-nv-error/10 text-[#FFB4B4]")}>
            {note.text}
          </div>
        )}

        {/* what to connect to */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-2">
          <CopyRow label="NETWORK" value={st?.ssid || ""} />
          <div className="h-px bg-white/10" />
          <CopyRow label="PASSWORD" value={st?.password || ""} secret />
        </section>

        {/* vitals */}
        <section className="mt-3 grid grid-cols-2 gap-3">
          <Tile icon={<Signal size={13} />} label="Connection" tone={netTone}
            value={online ? netValue : "--"} sub={netSub}
            trailing={online && bars > 0 ? <Bars n={bars} tone={barTone} /> : undefined} />
          <Tile icon={<BatteryCharging size={13} />} label="Battery" tone={batteryTone}
            value={battery == null ? "--" : `${battery}%`}
            sub={battery == null ? undefined : onCharge ? "Charging" : "On battery"} />
          <Tile icon={<Users size={13} />} label="Connected"
            value={st?.clients == null ? "--" : String(st.clients)}
            sub={st?.clients == null ? undefined : st.clients === 1 ? "device" : "devices"} />
          <Tile icon={st?.internet ? <Wifi size={13} /> : <WifiOff size={13} />} label="Internet"
            tone={st?.internet ? "text-nv-teal" : "text-nv-error"}
            value={!online ? "--" : st?.internet ? "Working" : "None"} />
          <Tile icon={<Router size={13} />} label="Hotspot" tone={st?.up ? "text-nv-teal" : "text-nv-error"}
            value={!online ? "--" : st?.up ? "On air" : "Off"}
            sub={online && st?.up ? "Broadcasting" : undefined} />
          <Tile icon={<Clock size={13} />} label="Powered on" value={online ? uptimeLabel(st?.uptime_s) : "--"} />
        </section>

        {/* change the credentials */}
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          {!editing ? (
            <button onClick={openEditor} disabled={!online}
              className="flex w-full items-center gap-2.5 text-left text-[15.5px] font-medium text-white disabled:opacity-40">
              <Pencil size={17} className="shrink-0 text-nv-teal" />
              <span className="min-w-0">Change name or password</span>
            </button>
          ) : (
            <form onSubmit={saveCredentials} className="space-y-3.5">
              <div>
                <label className={CLOUD_LABEL} htmlFor="hs-ssid">Network name</label>
                <input id="hs-ssid" className={CLOUD_INPUT} value={ssid} onChange={(e) => setSsid(e.target.value)}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={31} required />
              </div>
              <div>
                <label className={CLOUD_LABEL} htmlFor="hs-pw">Password</label>
                <input id="hs-pw" className={CLOUD_INPUT} value={pw} onChange={(e) => setPw(e.target.value)}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={8} maxLength={63} required />
                <p className="mt-1.5 pl-1 text-[13px] leading-snug text-white/45">
                  At least 8 characters. Letters, numbers and . _ @ # % + -
                </p>
              </div>
              <p className="rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[14px] leading-relaxed text-white/70">
                Saving takes about 30 seconds. The hotspot restarts, so anything connected drops and
                has to be reconnected with the new details. The label on the phone&apos;s own screen is
                updated to match.
              </p>
              <div className="flex gap-2.5">
                <button type="submit" disabled={busy === "save"}
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-nv-teal px-4 py-3.5 text-[15.5px] font-semibold text-nv-void disabled:opacity-55">
                  {busy === "save" ? <><Loader2 size={17} className="shrink-0 animate-spin" /> Saving</> : "Save"}
                </button>
                <button type="button" onClick={() => { setEditing(false); setNote(null); }} disabled={busy === "save"}
                  className="shrink-0 rounded-full border border-white/15 px-4 py-3.5 text-[15.5px] text-white/70 hover:bg-white/5 disabled:opacity-55">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* power */}
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          {confirming === "" ? (
            <div className="space-y-1">
              <button onClick={() => setConfirming("restart")} disabled={busy !== "" || restarting}
                className="flex w-full items-center gap-2.5 py-1.5 text-left text-[15.5px] font-medium text-white disabled:opacity-40">
                <RotateCcw size={17} className="shrink-0 text-nv-warning" />
                <span className="min-w-0">{restarting ? "Restarting…" : "Restart"}</span>
              </button>
              <button onClick={() => setConfirming("poweroff")} disabled={busy !== ""}
                className="flex w-full items-center gap-2.5 py-1.5 text-left text-[15.5px] font-medium text-white disabled:opacity-40">
                <Power size={17} className="shrink-0 text-nv-error" />
                <span className="min-w-0">Power off</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <p className="text-[14.5px] leading-relaxed text-white/75">
                {confirming === "restart"
                  ? "Restart the phone? The hotspot goes down for about a minute, then comes back on its own with the same name and password."
                  : "Power the phone off? It will not come back on by itself — someone has to be there to press the power button."}
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => power(confirming)} disabled={busy !== ""}
                  className={"flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[15.5px] font-semibold text-nv-void disabled:opacity-55 "
                    + (confirming === "restart" ? "bg-nv-warning" : "bg-nv-error")}>
                  {busy !== "" ? <Loader2 size={17} className="shrink-0 animate-spin" />
                    : confirming === "restart" ? "Restart" : "Power off"}
                </button>
                <button onClick={() => setConfirming("")}
                  className="shrink-0 rounded-full border border-white/15 px-4 py-3.5 text-[15.5px] text-white/70 hover:bg-white/5">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
