"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, BatteryCharging, Check, Clock, Copy, Eye, EyeOff, Loader2, LogOut,
  Pencil, Power, RefreshCw, Router, Signal, Users, Wifi, WifiOff,
} from "lucide-react";
import { CLOUD_INPUT, CLOUD_LABEL } from "./CloudShell";

// The door for an appliance account: a phone with a dead screen that now only serves a hotspot.
// Everything its owner would otherwise need a working display for -- what it is advertising, how
// much battery is left, who is connected -- is here, plus the two things they can change.

type Status = {
  ok?: number | boolean; online?: boolean; err?: string;
  ssid?: string; password?: string; up?: boolean;
  clients?: number; client_ips?: string[];
  battery?: number; charging?: string;
  operator?: string; net_type?: string; internet?: number; uptime_s?: number;
  applied?: boolean; wallpaper?: boolean; error?: string;
};

const REFRESH_MS = 15_000;
const RESTART_MS = 100_000;      // a reboot is out of contact for roughly this long

function uptimeLabel(s?: number) {
  if (!s || s < 0) return "--";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

function Tile({ icon, label, value, tone = "" }: {
  icon: React.ReactNode; label: string; value: string; tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[12px] text-white/50">{icon}{label}</div>
      <div className={"mt-1 text-[19px] font-semibold leading-tight " + (tone || "text-white")}>{value}</div>
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
    <div className="flex items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] tracking-wide text-white/45">{label}</div>
        <div className="truncate text-[22px] font-semibold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
          {show ? value || "--" : "•".repeat(Math.max(value.length, 6))}
        </div>
      </div>
      {secret && (
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
          className="shrink-0 rounded-xl p-2.5 text-white/55 hover:bg-white/5 hover:text-white">
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      )}
      <button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}
        className="shrink-0 rounded-xl p-2.5 text-white/55 hover:bg-white/5 hover:text-white">
        {copied ? <Check size={19} className="text-[#00E5CC]" /> : <Copy size={19} />}
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
  const [busy, setBusy] = useState<"" | "save" | "restart">("");
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [ssid, setSsid] = useState("");
  const [pw, setPw] = useState("");
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [restartingUntil, setRestartingUntil] = useState(0);
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

  async function restart() {
    setBusy("restart");
    setNote(null);
    setConfirmRestart(false);
    try {
      await fetch("/api/vm/hotspot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      setRestartingUntil(Date.now() + RESTART_MS);
      setNote({ kind: "ok", text: "Restarting. The hotspot comes back on its own in about a minute." });
    } catch {
      setNote({ kind: "err", text: "Could not send the restart." });
    }
    setBusy("");
  }

  const openEditor = () => {
    setSsid(st?.ssid || "");
    setPw(st?.password || "");
    setNote(null);
    setEditing(true);
  };

  const battery = st?.battery;
  const charging = (st?.charging || "").toLowerCase();
  const batteryTone = battery == null ? "text-white"
    : battery <= 15 ? "text-nv-error" : battery <= 40 ? "text-nv-warning" : "text-white";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-nv-void" style={{ minHeight: "100dvh" }}>
      <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-4">

        {/* who and what */}
        <header className="mb-5 flex items-center gap-2.5">
          <Router size={20} className="shrink-0 text-nv-teal" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px] font-semibold text-white">{device.label}</div>
            <div className="truncate text-[12.5px] text-white/45">{device.model} &middot; {user.username}</div>
          </div>
          <button onClick={() => load()} aria-label="Refresh"
            className="rounded-xl p-2.5 text-white/55 hover:bg-white/5 hover:text-white">
            <RefreshCw size={17} className={firstLoad ? "animate-spin" : ""} />
          </button>
          <button onClick={async () => { await fetch("/api/vm/logout", { method: "POST" }); window.location.reload(); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[14px] text-white/55 hover:bg-white/5 hover:text-nv-error">
            <LogOut size={16} /> Sign out
          </button>
        </header>

        {/* reachability */}
        {!firstLoad && !online && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-nv-warning/35 bg-nv-warning/10 px-4 py-3 text-[14.5px] text-nv-warning">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>
              {restarting
                ? "Restarting. This page reconnects on its own once the hotspot is back."
                : "Cannot reach the hotspot right now. It may be off, out of signal, or restarting. This page keeps trying."}
            </span>
          </div>
        )}

        {note && (
          <div role="status"
            className={"mb-4 rounded-2xl border px-4 py-3 text-[14.5px] " + (note.kind === "ok"
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
          <Tile icon={<BatteryCharging size={13} />} label="Battery" tone={batteryTone}
            value={battery == null ? "--" : `${battery}%${charging === "charging" || charging === "full" ? " ⚡" : ""}`} />
          <Tile icon={<Users size={13} />} label="Connected"
            value={st?.clients == null ? "--" : `${st.clients} ${st.clients === 1 ? "device" : "devices"}`} />
          <Tile icon={<Signal size={13} />} label="Mobile signal"
            value={st?.operator ? `${st.operator} ${st.net_type || ""}`.trim() : "--"} />
          <Tile icon={st?.internet ? <Wifi size={13} /> : <WifiOff size={13} />} label="Internet"
            tone={st?.internet ? "text-nv-teal" : "text-nv-error"}
            value={!online ? "--" : st?.internet ? "Working" : "No connection"} />
          <Tile icon={<Router size={13} />} label="Hotspot" tone={st?.up ? "text-nv-teal" : "text-nv-error"}
            value={!online ? "--" : st?.up ? "Broadcasting" : "Off"} />
          <Tile icon={<Clock size={13} />} label="Powered on" value={online ? uptimeLabel(st?.uptime_s) : "--"} />
        </section>

        {/* change the credentials */}
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          {!editing ? (
            <button onClick={openEditor} disabled={!online}
              className="flex w-full items-center gap-2.5 text-left text-[15.5px] font-medium text-white disabled:opacity-40">
              <Pencil size={17} className="text-nv-teal" />
              Change network name or password
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
                <p className="mt-1.5 pl-1 text-[13px] text-white/45">
                  At least 8 characters. Letters, numbers and . _ @ # % + -
                </p>
              </div>
              <p className="rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[14px] leading-relaxed text-white/70">
                Saving restarts the hotspot, so anything connected to it drops for about 15 seconds
                and has to be reconnected with the new details. The label on the phone&apos;s own
                screen is updated to match.
              </p>
              <div className="flex gap-2.5">
                <button type="submit" disabled={busy === "save"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-nv-teal px-4 py-3.5 text-[15.5px] font-semibold text-nv-void disabled:opacity-55">
                  {busy === "save" ? <><Loader2 size={17} className="animate-spin" /> Saving, about 30 seconds</> : "Save and restart"}
                </button>
                <button type="button" onClick={() => { setEditing(false); setNote(null); }} disabled={busy === "save"}
                  className="rounded-full border border-white/15 px-4 py-3.5 text-[15.5px] text-white/70 hover:bg-white/5 disabled:opacity-55">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* restart */}
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          {!confirmRestart ? (
            <button onClick={() => setConfirmRestart(true)} disabled={busy !== "" || restarting}
              className="flex w-full items-center gap-2.5 text-left text-[15.5px] font-medium text-white disabled:opacity-40">
              <Power size={17} className="text-nv-warning" />
              {restarting ? "Restarting..." : "Restart the device"}
            </button>
          ) : (
            <div className="space-y-3.5">
              <p className="text-[14.5px] leading-relaxed text-white/75">
                Restart the phone? The hotspot goes down for about a minute and comes back on its
                own with the same name and password.
              </p>
              <div className="flex gap-2.5">
                <button onClick={restart} disabled={busy === "restart"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-nv-warning px-4 py-3.5 text-[15.5px] font-semibold text-nv-void disabled:opacity-55">
                  {busy === "restart" ? <Loader2 size={17} className="animate-spin" /> : "Yes, restart"}
                </button>
                <button onClick={() => setConfirmRestart(false)}
                  className="rounded-full border border-white/15 px-4 py-3.5 text-[15.5px] text-white/70 hover:bg-white/5">
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
