"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Check, ChevronRight, Clock, Copy, Eye, EyeOff, Loader2, LogOut,
  MessageSquare, Pencil, Power, RefreshCw, RotateCcw, Router, Signal, Wifi, WifiOff, Zap,
} from "lucide-react";
import { CLOUD_INPUT, CLOUD_LABEL } from "./CloudShell";
import MessagesPanel from "./MessagesPanel";

// The door for an appliance account: a phone with a dead screen that now only serves a hotspot.
// Everything its owner would otherwise need a working display for -- what it is advertising, how
// much battery is left, who is connected -- is here, plus the things they can change.
//
// It is laid out as a control deck under the same aurora as the lock screen, so unlocking feels
// like walking from the phone's lock screen onto its bridge. One hero: the core, a ring that is
// the battery gauge with the hotspot's state inside it. Everything else sits quietly beneath it.

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
  rsrp?: string; nr_ready?: boolean; hidden?: boolean;
  internet?: number; uptime_s?: number;
  applied?: boolean; pending?: boolean; wallpaper?: boolean; error?: string;
};

type PowerAction = "restart_hotspot" | "restart" | "poweroff";

const REFRESH_MS = 15_000;
const APPLY_MS = 5_000;        // poll faster while a change is landing
// Measured: a hide/show flip usually lands in ~90s, but when the settings screen misses and the
// keepalive loop is the one that brings the AP back it can take ~3 minutes. Wait longer than that
// before telling someone it has not worked.
const APPLY_GIVE_UP_MS = 300_000;
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

/** Four bars, filled to `n`; each bar grows in on its own beat when the reading changes. */
function Bars({ n, tone }: { n: number; tone: string }) {
  return (
    <span className="hd-bars" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < n ? "is-on " + tone : ""} style={{ height: 6 + i * 4, transitionDelay: `${i * 70}ms` }} />
      ))}
    </span>
  );
}

function Tile({ icon, label, value, sub, tone = "", trailing, i }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; tone?: string; trailing?: React.ReactNode; i: number;
}) {
  return (
    <div className="hd-tile hd-rise" style={{ "--i": i } as React.CSSProperties}>
      <div className="hd-tile-label"><span className="shrink-0">{icon}</span><span className="truncate">{label}</span></div>
      <div className="hd-tile-value">
        <span className={"min-w-0 truncate " + tone}>{value}</span>
        {trailing}
      </div>
      {sub && <div className="hd-tile-sub">{sub}</div>}
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
    <div className="hd-cred">
      <div className="min-w-0 flex-1">
        <div className="hd-cred-label">{label}</div>
        <div className="hd-cred-value" style={{ fontVariantNumeric: "tabular-nums" }}>
          {show ? value || "--" : "•".repeat(Math.max(value.length, 6))}
        </div>
      </div>
      {secret && (
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show} className="hd-icon-btn">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      <button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`} className={"hd-icon-btn" + (copied ? " is-done" : "")}>
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </div>
  );
}

/** The hero: battery as a ring, the hotspot's state inside it. */
function Core({ st, online, applying, poweredOff, restarting }: {
  st: Status | null; online: boolean; applying: string; poweredOff: boolean; restarting: boolean;
}) {
  const R = 86, C = 2 * Math.PI * R;
  const pct = online && st?.battery != null ? Math.max(0, Math.min(100, st.battery)) : 0;
  const charging = (st?.charging || "").toLowerCase();
  const onCharge = charging === "charging" || charging === "full";

  let mode: "air" | "hidden" | "off" | "down" | "busy" = "down";
  let word = "Offline";
  if (applying) { mode = "busy"; word = "Working"; }
  else if (poweredOff) { word = "Powered off"; }
  else if (restarting) { mode = "busy"; word = "Restarting"; }
  else if (online && st?.up && st.hidden) { mode = "hidden"; word = "Hidden"; }
  else if (online && st?.up) { mode = "air"; word = "On air"; }
  else if (online) { mode = "off"; word = "Off"; }

  const clients = online && st?.clients != null ? st.clients : null;
  return (
    <div className={"hd-core hd-rise is-" + mode} style={{ "--i": 0 } as React.CSSProperties} role="status" aria-live="polite">
      <div className="hd-core-ring">
        <svg viewBox="0 0 220 220" aria-hidden>
          <defs>
            <linearGradient id="hdg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7CFFEA" /><stop offset="55%" stopColor="#00E5CC" /><stop offset="100%" stopColor="#19B8FF" />
            </linearGradient>
            <linearGradient id="hdv" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D2B8FF" /><stop offset="60%" stopColor="#B388FF" /><stop offset="100%" stopColor="#7C5EA7" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r={R} className="hd-ring-track" />
          <circle cx="110" cy="110" r={R} className="hd-ring-fill"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          <circle cx="110" cy="110" r={R} className="hd-ring-sweep" strokeDasharray={`${C * 0.18} ${C}`} />
          <circle cx="110" cy="110" r="70" className="hd-ring-inner" />
        </svg>
        <div className="hd-orbit" aria-hidden><i /></div>
        <div className="hd-core-center">
          <span className="hd-core-icon">
            {mode === "busy" ? <Loader2 size={22} className="animate-spin" />
              : mode === "hidden" ? <EyeOff size={22} />
              : mode === "air" ? <Router size={22} />
              : <WifiOff size={22} />}
          </span>
          <span className="hd-core-word">{word}</span>
          <span className="hd-core-sub">
            {clients == null ? " " : clients === 1 ? "1 device" : `${clients} devices`}
          </span>
        </div>
      </div>
      <div className="hd-core-batt">
        {online && st?.battery != null ? (
          <>
            {onCharge && <Zap size={13} className="hd-bolt" />}
            <span className="hd-core-pct">{st.battery}%</span>
            <span className="hd-core-chg">{onCharge ? "charging" : "on battery"}</span>
          </>
        ) : <span className="hd-core-chg">&nbsp;</span>}
      </div>
    </div>
  );
}

export default function HotspotClient({ user, device }: {
  user: { username: string };
  device: { label: string; model: string };
}) {
  const [st, setSt] = useState<Status | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [busy, setBusy] = useState<"" | "save" | "hidden" | PowerAction>("");
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [ssid, setSsid] = useState("");
  const [pw, setPw] = useState("");
  const [confirming, setConfirming] = useState<"" | PowerAction>("");
  const [restartingUntil, setRestartingUntil] = useState(0);
  const [poweredOff, setPoweredOff] = useState(false);
  // A change that drives the phone's settings screen takes about a minute; while it runs the
  // AP goes down and comes back, so the panel polls faster and says what is happening.
  const [applying, setApplying] = useState("");
  const [applyUntil, setApplyUntil] = useState(0);
  const [msgOpen, setMsgOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  // Unread badge on the closed deck. Each check runs termux-sms-list on the phone, so it is
  // deliberately slow-paced; the Messages panel polls properly while it is open.
  useEffect(() => {
    if (msgOpen) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/vm/sms", { cache: "no-store" });
        const d = await r.json();
        if (!stop && d.ok !== false) {
          setUnread(((d.threads || []) as { unread?: number }[]).reduce((n, t) => n + (t.unread || 0), 0));
        }
      } catch { /* the deck's own status banner already covers an unreachable phone */ }
    };
    tick();
    const id = setInterval(tick, 120_000);
    return () => { stop = true; clearInterval(id); };
  }, [msgOpen]);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/vm/hotspot", { cache: "no-store" });
      if (r.status === 401) { window.location.reload(); return; }
      setSt((await r.json()) as Status);
    } catch { /* keep the last good reading on screen */ }
    setFirstLoad(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!busyRef.current) load(); }, applying ? APPLY_MS : REFRESH_MS);
    return () => clearInterval(id);
  }, [load, applying]);

  // Stop saying "applying" once the network is actually back, rather than after a fixed wait.
  useEffect(() => {
    if (!applying) return;
    if (st?.online && st.up) { setApplying(""); return; }
    if (Date.now() > applyUntil) {
      setApplying("");
      setNote({ kind: "err", text: "The hotspot has not come back yet. It keeps retrying by itself — give it another minute." });
    }
  }, [applying, applyUntil, st]);

  const online = st?.online === true;
  const restarting = Date.now() < restartingUntil;

  const beginApplying = (text: string) => {
    setApplying(text);
    setApplyUntil(Date.now() + APPLY_GIVE_UP_MS);
  };

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/vm/hotspot", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = (await r.json().catch(() => ({}))) as Status;
    return { ok: r.ok && d.ok !== false && d.applied !== false, d };
  }

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setNote(null);
    try {
      const { ok, d } = await post({ action: "credentials", ssid: ssid.trim(), password: pw });
      if (!ok) {
        setNote({ kind: "err", text: d.error || "The hotspot did not accept that. Nothing was changed." });
      } else {
        setSt(d);
        setEditing(false);
        beginApplying("Applying the new details. The hotspot restarts — about a minute.");
        setNote({
          kind: "ok",
          text: d.wallpaper === false
            ? "Saved. The label on the phone's screen could not be redrawn."
            : "Saved. Reconnect your devices with the new details once it is back.",
        });
      }
    } catch {
      setNote({ kind: "err", text: "Could not reach the hotspot. Nothing was changed." });
    }
    setBusy("");
    load();
  }

  async function toggleHidden() {
    const want = !st?.hidden;
    setBusy("hidden");
    setNote(null);
    try {
      const { ok, d } = await post({ action: "hidden", hidden: want });
      if (!ok) setNote({ kind: "err", text: d.error || "Could not change that. Nothing happened." });
      else beginApplying(want
        ? "Hiding the network. The hotspot restarts — about a minute."
        : "Making the network visible again. The hotspot restarts — about a minute.");
    } catch {
      setNote({ kind: "err", text: "Could not reach the hotspot. Nothing happened." });
    }
    setBusy("");
  }

  async function power(action: PowerAction) {
    setBusy(action);
    setNote(null);
    setConfirming("");
    try {
      const { ok, d } = await post({ action });
      if (!ok) {
        setNote({ kind: "err", text: d.error || "Could not send that. Nothing happened." });
      } else if (action === "restart_hotspot") {
        beginApplying("Restarting the hotspot. Devices rejoin by themselves — about a minute.");
      } else if (action === "restart") {
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
  const fastish = tier === "veryfast" || tier === "fast";
  const netTone = fastish ? "text-nv-teal" : tier === "weak" ? "text-nv-warning" : "text-white";
  const barTone = fastish ? "teal" : tier === "weak" ? "amber" : "white";
  const netSub = !online ? undefined
    : previewing ? `Preview · now on ${realNet || "LTE"}`
    : [st?.operator, TIER_WORD[tier]].filter(Boolean).join(" · ");

  const battery = st?.battery;
  const charging = (st?.charging || "").toLowerCase();
  const onCharge = charging === "charging" || charging === "full";
  const batteryTone = battery == null ? "text-white"
    : battery <= 15 ? "text-nv-error" : battery <= 40 ? "text-nv-warning" : "text-white";

  const locked = !online || busy !== "" || !!applying;

  const CONFIRM: Record<PowerAction, { text: string; label: string; tone: string }> = {
    restart_hotspot: {
      text: "Restart the hotspot? Anything connected drops for about a minute while it comes back. The phone itself stays on.",
      label: "Restart hotspot", tone: "teal",
    },
    restart: {
      text: "Restart the phone? The hotspot goes down for about a minute, then comes back on its own with the same name and password.",
      label: "Restart", tone: "amber",
    },
    poweroff: {
      text: "Power the phone off? It will not come back on by itself — someone has to be there to press the power button.",
      label: "Power off", tone: "red",
    },
  };

  if (msgOpen) {
    return <MessagesPanel onClose={() => setMsgOpen(false)} onUnread={setUnread} />;
  }

  return (
    <div className="hd-stage">
      {/* raw HTML on purpose: as a text child React escapes the quotes in the CSS on the server but not on
          the client, which is a hydration mismatch */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hd-aurora" aria-hidden />
      <div className="hd-grid" aria-hidden />

      <div className="hd-deck">
        {/* who and what */}
        <header className="hd-head hd-rise" style={{ "--i": 0 } as React.CSSProperties}>
          <span className="hd-head-dot" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="hd-title">{device.label}</div>
            <div className="hd-subtitle">{device.model} &middot; {user.username}</div>
          </div>
          <button onClick={() => load()} aria-label="Refresh" className="hd-icon-btn">
            <RefreshCw size={17} className={firstLoad ? "animate-spin" : ""} />
          </button>
          <button aria-label="Sign out" className="hd-icon-btn is-danger"
            onClick={async () => { await fetch("/api/vm/logout", { method: "POST" }); window.location.reload(); }}>
            <LogOut size={17} />
          </button>
        </header>

        {/* a change is landing: the AP drops and comes back, so say so instead of "offline" */}
        {applying && (
          <div role="status" className="hd-banner is-busy">
            <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin" />
            <span className="min-w-0">{applying}</span>
          </div>
        )}
        {!firstLoad && !online && !applying && (
          <div className="hd-banner is-warn">
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
          <div role="status" className={"hd-banner " + (note.kind === "ok" ? "is-ok" : "is-err")}>{note.text}</div>
        )}

        {/* the hero */}
        <Core st={st} online={online} applying={applying} poweredOff={poweredOff} restarting={restarting} />

        {/* what to connect to */}
        <section className="hd-glass hd-rise" style={{ "--i": 1 } as React.CSSProperties}>
          <CopyRow label="Network" value={st?.ssid || ""} />
          <div className="hd-sep" />
          <CopyRow label="Password" value={st?.password || ""} secret />
        </section>

        {/* vitals */}
        <section className="hd-tiles">
          <Tile i={2} icon={<Signal size={13} />} label="Connection" tone={netTone}
            value={online ? netValue : "--"} sub={netSub}
            trailing={online && bars > 0 ? <Bars n={bars} tone={barTone} /> : undefined} />
          <Tile i={3} icon={<Zap size={13} />} label="Battery" tone={batteryTone}
            value={battery == null ? "--" : `${battery}%`}
            sub={battery == null ? undefined : onCharge ? "Charging" : "On battery"} />
          <Tile i={4} icon={st?.internet ? <Wifi size={13} /> : <WifiOff size={13} />} label="Internet"
            tone={st?.internet ? "text-nv-teal" : "text-nv-error"}
            value={!online ? "--" : st?.internet ? "Working" : "None"} />
          <Tile i={5} icon={<Clock size={13} />} label="Powered on" value={online ? uptimeLabel(st?.uptime_s) : "--"} />
        </section>

        {/* messages */}
        <section className="hd-glass hd-rise" style={{ "--i": 6 } as React.CSSProperties}>
          <button onClick={() => setMsgOpen(true)} className="hd-row hd-row-btn">
            <span className={"hd-row-icon" + (unread ? " is-alert" : "")}><MessageSquare size={17} /></span>
            <span className="min-w-0 flex-1">
              <span className="hd-row-title block">Messages</span>
              <span className="hd-row-sub block">
                {unread ? `${unread} unread · read and reply from here` : "Read and reply on the phone’s number"}
              </span>
            </span>
            {unread > 0 && <span className="hd-badge">{unread}</span>}
            <ChevronRight size={18} className="shrink-0 text-white/35" />
          </button>
        </section>

        {/* visibility */}
        <section className="hd-glass hd-rise hd-row" style={{ "--i": 7 } as React.CSSProperties}>
          <span className={"hd-row-icon " + (st?.hidden ? "is-violet" : "")}>
            {st?.hidden ? <EyeOff size={17} /> : <Eye size={17} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="hd-row-title">Hide network</div>
            <div className="hd-row-sub">
              {st?.hidden
                ? "Hidden. Devices that already know it still connect; new ones must add it by name."
                : "Visible to anyone nearby looking for Wi-Fi."}
            </div>
          </div>
          <button role="switch" aria-checked={!!st?.hidden} aria-label="Hide network"
            onClick={toggleHidden} disabled={locked}
            className={"hd-switch" + (st?.hidden ? " is-on" : "")}>
            <span />
          </button>
        </section>

        {/* change the credentials */}
        <section className="hd-glass hd-rise" style={{ "--i": 8 } as React.CSSProperties}>
          {!editing ? (
            <button onClick={openEditor} disabled={locked} className="hd-row hd-row-btn">
              <span className="hd-row-icon"><Pencil size={17} /></span>
              <span className="hd-row-title min-w-0">Change name or password</span>
            </button>
          ) : (
            <form onSubmit={saveCredentials} className="hd-form">
              <div>
                <label className={CLOUD_LABEL} htmlFor="hs-ssid">Network name</label>
                <input id="hs-ssid" className={CLOUD_INPUT} value={ssid} onChange={(e) => setSsid(e.target.value)}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={31} required />
              </div>
              <div>
                <label className={CLOUD_LABEL} htmlFor="hs-pw">Password</label>
                <input id="hs-pw" className={CLOUD_INPUT} value={pw} onChange={(e) => setPw(e.target.value)}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={8} maxLength={63} required />
                <p className="hd-hint">At least 8 characters. Letters, numbers and . _ @ # % + -</p>
              </div>
              <p className="hd-note">
                Saving takes about a minute. The hotspot restarts, so anything connected drops and has to
                be reconnected with the new details. The label on the phone&apos;s own screen is updated to match.
              </p>
              <div className="hd-actions">
                <button type="submit" disabled={busy === "save"} className="hd-btn is-teal">
                  {busy === "save" ? <><Loader2 size={17} className="shrink-0 animate-spin" /> Saving</> : "Save"}
                </button>
                <button type="button" onClick={() => { setEditing(false); setNote(null); }} disabled={busy === "save"} className="hd-btn is-ghost">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* power deck */}
        <section className="hd-rise" style={{ "--i": 9 } as React.CSSProperties}>
          <div className="hd-power">
            <button onClick={() => setConfirming("restart_hotspot")} disabled={locked}
              className={"hd-key is-teal" + (confirming === "restart_hotspot" ? " is-armed" : "")}>
              <span className="hd-key-icon"><RotateCcw size={20} /></span>
              <span className="hd-key-label">Restart<br />hotspot</span>
            </button>
            <button onClick={() => setConfirming("restart")} disabled={busy !== "" || restarting || !!applying}
              className={"hd-key is-amber" + (confirming === "restart" ? " is-armed" : "")}>
              <span className="hd-key-icon"><RefreshCw size={20} /></span>
              <span className="hd-key-label">Restart<br />phone</span>
            </button>
            <button onClick={() => setConfirming("poweroff")} disabled={busy !== "" || !!applying}
              className={"hd-key is-red" + (confirming === "poweroff" ? " is-armed" : "")}>
              <span className="hd-key-icon"><Power size={20} /></span>
              <span className="hd-key-label">Power<br />off</span>
            </button>
          </div>
          <div className={"hd-confirm" + (confirming ? " is-open" : "")} aria-hidden={!confirming}>
            {confirming && (
              <div className="hd-glass">
                <p className="hd-confirm-text">{CONFIRM[confirming].text}</p>
                <div className="hd-actions">
                  <button onClick={() => power(confirming)} disabled={busy !== ""} className={"hd-btn is-" + CONFIRM[confirming].tone}>
                    {busy !== "" ? <Loader2 size={17} className="shrink-0 animate-spin" /> : CONFIRM[confirming].label}
                  </button>
                  <button onClick={() => setConfirming("")} className="hd-btn is-ghost">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const CSS = `
.hd-stage{position:fixed;inset:0;z-index:50;overflow-y:auto;overflow-x:hidden;background:#03070F;
  font-family:var(--font-body),system-ui,sans-serif;-webkit-font-smoothing:antialiased}
/* the same aurora as the lock screen: unlocking walks you from the phone's lock screen onto its bridge */
.hd-aurora{position:fixed;inset:-30%;pointer-events:none;
  background:
    radial-gradient(38% 34% at 24% 22%,rgba(0,229,204,.30),transparent 70%),
    radial-gradient(34% 40% at 78% 58%,rgba(123,94,167,.40),transparent 72%),
    radial-gradient(30% 30% at 58% 14%,rgba(56,132,255,.24),transparent 70%);
  filter:blur(64px);animation:hd-drift 28s ease-in-out infinite alternate}
@keyframes hd-drift{from{transform:translate3d(-3%,-2%,0) rotate(0deg) scale(1)}to{transform:translate3d(4%,3%,0) rotate(12deg) scale(1.1)}}
/* a faint dot grid that fades off toward the edges: a surface for the controls to sit on, not decoration */
.hd-grid{position:fixed;inset:0;pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,.11) 1px,transparent 1.2px);background-size:26px 26px;
  -webkit-mask-image:radial-gradient(60% 55% at 50% 38%,#000 20%,transparent 100%);
  mask-image:radial-gradient(60% 55% at 50% 38%,#000 20%,transparent 100%)}
.hd-deck{position:relative;max-width:30rem;margin:0 auto;padding:max(14px,env(safe-area-inset-top)) 16px max(48px,env(safe-area-inset-bottom))}

/* one orchestrated entrance: each block rises in on its own beat, then nothing moves unless the device does */
.hd-rise{animation:hd-rise .7s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(.08s + var(--i,0)*.06s)}
@keyframes hd-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

.hd-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.hd-head-dot{width:9px;height:9px;border-radius:50%;background:#00E5CC;box-shadow:0 0 12px 3px rgba(0,229,204,.65);
  animation:hd-pulse 2.6s ease-in-out infinite}
@keyframes hd-pulse{50%{opacity:.4;box-shadow:0 0 4px 0 rgba(0,229,204,.35)}}
.hd-title{font-family:var(--font-display),system-ui,sans-serif;font-weight:700;font-size:18px;letter-spacing:-.02em;color:#fff;line-height:1.1;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-subtitle{font-size:12.5px;color:rgba(255,255,255,.48);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.hd-icon-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:0;border-radius:12px;
  background:rgba(255,255,255,.04);color:rgba(255,255,255,.6);cursor:pointer;transition:background .15s,color .15s,transform .15s,box-shadow .15s}
.hd-icon-btn:hover{background:rgba(255,255,255,.09);color:#fff}
.hd-icon-btn:active{transform:scale(.94)}
.hd-icon-btn.is-danger:hover{color:#FF7B7B;background:rgba(239,68,68,.12)}
.hd-icon-btn.is-done{color:#00E5CC;box-shadow:0 0 0 1px rgba(0,229,204,.5) inset,0 0 16px rgba(0,229,204,.35)}
.hd-icon-btn:focus-visible,.hd-switch:focus-visible,.hd-key:focus-visible,.hd-btn:focus-visible,.hd-row-btn:focus-visible{outline:2px solid #7CFFEA;outline-offset:2px}

.hd-banner{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;padding:12px 15px;border-radius:16px;font-size:14.5px;line-height:1.5;
  border:1px solid;backdrop-filter:blur(10px);animation:hd-rise .35s cubic-bezier(.2,.7,.2,1) both}
.hd-banner.is-busy{color:#7CFFEA;border-color:rgba(0,229,204,.35);background:rgba(0,229,204,.08)}
.hd-banner.is-warn{color:#F3C44F;border-color:rgba(234,179,8,.35);background:rgba(234,179,8,.09)}
.hd-banner.is-ok{color:#7CFFEA;border-color:rgba(0,229,204,.3);background:rgba(0,229,204,.07)}
.hd-banner.is-err{color:#FFB4B4;border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.09)}

/* ---- the core ---- */
.hd-core{display:flex;flex-direction:column;align-items:center;padding:6px 0 18px;--glow:0,229,204}
.hd-core.is-hidden{--glow:179,136,255}
.hd-core.is-off,.hd-core.is-down{--glow:255,255,255}
.hd-core.is-busy{--glow:0,229,204}
.hd-core-ring{position:relative;width:min(58vw,224px);aspect-ratio:1}
.hd-core-ring::before{content:"";position:absolute;inset:-16%;border-radius:50%;
  background:radial-gradient(circle,rgba(var(--glow),.30) 0%,rgba(var(--glow),.10) 40%,transparent 66%);
  filter:blur(14px);transition:background .6s;animation:hd-breathe 3.2s ease-in-out infinite}
.hd-core.is-off .hd-core-ring::before,.hd-core.is-down .hd-core-ring::before{animation:none;opacity:.35}
@keyframes hd-breathe{50%{transform:scale(1.08);opacity:.75}}
.hd-core-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.hd-ring-track{fill:none;stroke:rgba(255,255,255,.08);stroke-width:7}
.hd-ring-fill{fill:none;stroke:url(#hdg);stroke-width:7;stroke-linecap:round;
  transition:stroke-dashoffset 1.1s cubic-bezier(.3,.7,.2,1);filter:drop-shadow(0 0 8px rgba(var(--glow),.8))}
.hd-core.is-hidden .hd-ring-fill{stroke:url(#hdv)}
.hd-core.is-off .hd-ring-fill,.hd-core.is-down .hd-ring-fill{stroke:rgba(255,255,255,.35);filter:none}
.hd-ring-sweep{fill:none;stroke:rgba(var(--glow),.9);stroke-width:7;stroke-linecap:round;opacity:0;transform-origin:center}
.hd-core.is-busy .hd-ring-fill{opacity:.25}
.hd-core.is-busy .hd-ring-sweep{opacity:1;animation:hd-spin 1.4s linear infinite}
.hd-ring-inner{fill:rgba(3,10,22,.62);stroke:rgba(var(--glow),.18);stroke-width:1;transition:stroke .6s}
.hd-orbit{position:absolute;inset:-4%;animation:hd-spin 6s linear infinite;opacity:0;transition:opacity .5s}
.hd-core.is-air .hd-orbit,.hd-core.is-hidden .hd-orbit{opacity:1}
.hd-orbit i{position:absolute;top:0;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#fff;
  box-shadow:0 0 12px 4px rgba(var(--glow),.95),0 0 30px 9px rgba(var(--glow),.4)}
@keyframes hd-spin{to{transform:rotate(360deg)}}
.hd-core-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#fff;text-align:center}
.hd-core-icon{display:inline-flex;color:rgba(var(--glow),1);margin-bottom:4px;transition:color .6s}
.hd-core.is-off .hd-core-icon,.hd-core.is-down .hd-core-icon{color:rgba(255,255,255,.5)}
.hd-core-word{font-family:var(--font-display),system-ui,sans-serif;font-weight:700;font-size:clamp(20px,5.6vw,24px);letter-spacing:-.02em;line-height:1;
  text-shadow:0 0 22px rgba(var(--glow),.45)}
.hd-core-sub{font-size:13px;color:rgba(255,255,255,.55);font-variant-numeric:tabular-nums}
.hd-core-batt{display:flex;align-items:baseline;gap:7px;margin-top:12px;font-variant-numeric:tabular-nums}
.hd-bolt{color:#F3C44F;align-self:center;filter:drop-shadow(0 0 6px rgba(243,196,79,.8))}
.hd-core-pct{font-family:var(--font-display),system-ui,sans-serif;font-weight:600;font-size:20px;color:#fff;letter-spacing:-.02em}
.hd-core-chg{font-size:13px;color:rgba(255,255,255,.5)}

/* ---- glass panels ---- */
.hd-glass{position:relative;border-radius:22px;padding:4px 16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 20px 50px -30px rgba(0,0,0,.9)}
.hd-glass + .hd-glass,.hd-tiles + .hd-glass,.hd-glass + .hd-tiles,.hd-glass + section,.hd-tiles + section{margin-top:12px}
.hd-sep{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)}
.hd-cred{display:flex;align-items:center;gap:6px;padding:11px 0}
.hd-cred-label{font-size:12px;color:rgba(255,255,255,.48)}
.hd-cred-value{font-family:var(--font-display),system-ui,sans-serif;font-weight:600;font-size:21px;color:#fff;letter-spacing:-.01em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.hd-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.hd-tile{min-width:0;border-radius:18px;padding:12px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:border-color .2s,background .2s}
.hd-tile:hover{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.06)}
.hd-tile-label{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.5)}
.hd-tile-value{display:flex;align-items:center;gap:6px;margin-top:5px;font-family:var(--font-display),system-ui,sans-serif;font-weight:600;font-size:18px;line-height:1.15;color:#fff;letter-spacing:-.01em}
.hd-tile-sub{margin-top:2px;font-size:12px;color:rgba(255,255,255,.45);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-bars{display:inline-flex;align-items:flex-end;gap:2px;flex:none}
.hd-bars i{display:block;width:3px;border-radius:2px;background:rgba(255,255,255,.2);transform-origin:bottom;transform:scaleY(.4);opacity:.6;
  transition:transform .4s cubic-bezier(.3,.7,.2,1),opacity .4s,background .4s}
.hd-bars i.is-on{transform:none;opacity:1}
.hd-bars i.is-on.teal{background:#00E5CC;box-shadow:0 0 6px rgba(0,229,204,.7)}
.hd-bars i.is-on.amber{background:#EAB308;box-shadow:0 0 6px rgba(234,179,8,.6)}
.hd-bars i.is-on.white{background:rgba(255,255,255,.85)}

.hd-row{display:flex;align-items:center;gap:12px;padding:12px 0}
.hd-row-btn{width:100%;border:0;background:none;text-align:left;cursor:pointer;color:inherit;font:inherit}
.hd-row-btn:disabled{opacity:.4;cursor:not-allowed}
.hd-row-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;
  color:#00E5CC;background:rgba(0,229,204,.10);box-shadow:0 0 0 1px rgba(0,229,204,.25) inset;transition:all .3s}
.hd-row-icon.is-alert{color:#03121A;background:linear-gradient(135deg,#7CFFEA,#00E5CC);
  box-shadow:0 0 0 1px rgba(0,229,204,.5) inset,0 0 22px rgba(0,229,204,.5)}
.hd-badge{flex:none;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--font-display),system-ui,sans-serif;font-weight:700;font-size:12.5px;color:#03121A;
  background:linear-gradient(135deg,#7CFFEA,#00E5CC);box-shadow:0 0 16px rgba(0,229,204,.6)}
.hd-row-icon.is-violet{color:#D2B8FF;background:rgba(179,136,255,.12);box-shadow:0 0 0 1px rgba(179,136,255,.35) inset,0 0 18px rgba(179,136,255,.25)}
.hd-row-title{font-size:15.5px;font-weight:500;color:#fff}
.hd-row-sub{font-size:13px;color:rgba(255,255,255,.48);line-height:1.35}
.hd-switch{position:relative;flex:none;width:54px;height:31px;border:0;border-radius:999px;cursor:pointer;padding:0;
  background:rgba(255,255,255,.16);transition:background .3s,box-shadow .3s}
.hd-switch span{position:absolute;top:3px;left:3px;width:25px;height:25px;border-radius:50%;background:#fff;
  transition:transform .3s cubic-bezier(.3,.7,.2,1),box-shadow .3s}
.hd-switch.is-on{background:linear-gradient(135deg,#D2B8FF,#B388FF 60%,#7C5EA7);box-shadow:0 0 18px rgba(179,136,255,.55)}
.hd-switch.is-on span{transform:translateX(23px);box-shadow:0 0 10px rgba(255,255,255,.7)}
.hd-switch:disabled{opacity:.4;cursor:not-allowed}

.hd-form{display:flex;flex-direction:column;gap:14px;padding:12px 0}
.hd-hint{margin:6px 0 0 4px;font-size:13px;line-height:1.35;color:rgba(255,255,255,.45)}
.hd-note{font-size:14px;line-height:1.5;color:rgba(255,255,255,.72);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:11px 14px}
.hd-actions{display:flex;gap:10px}
.hd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:0;flex:1;border:0;border-radius:999px;padding:14px 18px;
  font-family:var(--font-display),system-ui,sans-serif;font-weight:700;font-size:15.5px;cursor:pointer;color:#03121A;
  transition:transform .15s,box-shadow .15s,opacity .15s}
.hd-btn:active{transform:scale(.98)}
.hd-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
.hd-btn.is-teal{background:linear-gradient(135deg,#7CFFEA 0%,#00E5CC 45%,#19B8FF 100%);box-shadow:0 10px 30px -10px rgba(0,229,204,.8)}
.hd-btn.is-teal:hover{transform:translateY(-1px);box-shadow:0 14px 36px -10px rgba(0,229,204,.95)}
.hd-btn.is-amber{background:linear-gradient(135deg,#FFE08A,#EAB308 60%,#D08A00);box-shadow:0 10px 30px -10px rgba(234,179,8,.8)}
.hd-btn.is-red{background:linear-gradient(135deg,#FF9A9A,#EF4444 60%,#B91C1C);color:#fff;box-shadow:0 10px 30px -10px rgba(239,68,68,.8)}
.hd-btn.is-ghost{flex:none;background:rgba(255,255,255,.04);color:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.16)}
.hd-btn.is-ghost:hover{background:rgba(255,255,255,.08);color:#fff}

/* ---- power deck: three keys, one row ---- */
.hd-power{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.hd-key{--k:0,229,204;position:relative;display:flex;flex-direction:column;align-items:center;gap:9px;padding:16px 8px 13px;border-radius:20px;cursor:pointer;
  color:#fff;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);overflow:hidden;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  transition:transform .18s,border-color .25s,box-shadow .25s,background .25s}
.hd-key.is-amber{--k:234,179,8}
.hd-key.is-red{--k:239,68,68}
.hd-key::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.08) 50%,transparent 70%);
  transform:translateX(-120%);transition:transform .6s}
.hd-key:hover{transform:translateY(-2px);border-color:rgba(var(--k),.5);box-shadow:0 14px 34px -16px rgba(var(--k),.7)}
.hd-key:hover::after{transform:translateX(120%)}
.hd-key:active{transform:translateY(0) scale(.98)}
.hd-key.is-armed{border-color:rgba(var(--k),.75);background:rgba(var(--k),.10);box-shadow:0 0 0 1px rgba(var(--k),.4) inset,0 0 26px rgba(var(--k),.35)}
.hd-key:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.hd-key-icon{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;color:rgba(var(--k),1);
  background:rgba(var(--k),.10);box-shadow:0 0 0 1px rgba(var(--k),.35) inset,0 0 18px rgba(var(--k),.25);transition:box-shadow .25s,transform .25s}
.hd-key:hover .hd-key-icon{box-shadow:0 0 0 1px rgba(var(--k),.6) inset,0 0 26px rgba(var(--k),.5);transform:scale(1.05)}
.hd-key-label{font-size:12.5px;line-height:1.2;text-align:center;color:rgba(255,255,255,.82)}
.hd-confirm{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s cubic-bezier(.2,.7,.2,1)}
.hd-confirm.is-open{grid-template-rows:1fr;margin-top:12px}
.hd-confirm>*{overflow:hidden;min-height:0}
.hd-confirm .hd-glass{padding:16px}
.hd-confirm-text{font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.78);margin:0 0 14px}

@media (min-width:640px){.hd-deck{padding-top:28px}.hd-core-ring{width:232px}}
@media (prefers-reduced-motion:reduce){
  .hd-aurora,.hd-head-dot,.hd-core-ring::before,.hd-orbit,.hd-ring-sweep{animation:none}
  .hd-orbit{display:none}
  .hd-rise,.hd-banner{animation-duration:.01s;animation-delay:0s}
  .hd-ring-fill,.hd-bars i,.hd-key,.hd-switch span,.hd-confirm{transition:none}
}
`;
