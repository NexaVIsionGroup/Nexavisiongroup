"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/admin/AppShell";
import {
  Smartphone, Loader2, RefreshCw, Battery, Thermometer, Signal, ShieldCheck,
  Wifi, Server, MonitorSmartphone, Radio, Cpu, Clock, Power, Lock, Eye,
  Zap, Terminal, ChevronRight, AlertTriangle, CircleCheck, CircleX, Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Device = { id: string; name: string; model: string };
type CatalogCmd = { id: string; label: string; arg: boolean; argHint: string };
type Catalog = Record<string, CatalogCmd[]>;
type Stats = Record<string, string | number | boolean>;

const api = (path: string) => `/api/admin/devices?path=${encodeURIComponent(path)}`;

// commands that get a confirm prompt before firing
const DANGER = new Set(["reboot", "lockdown_on", "screen_off"]);
const CAT_META: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  screen: { label: "Screen", icon: MonitorSmartphone, tone: "text-nv-teal" },
  power: { label: "Power", icon: Power, tone: "text-nv-error" },
  access: { label: "Remote Access", icon: Wifi, tone: "text-nv-violet" },
  integrity: { label: "Integrity", icon: ShieldCheck, tone: "text-nv-success" },
  beacon: { label: "Beacon", icon: Radio, tone: "text-nv-ember" },
  info: { label: "Info", icon: Terminal, tone: "text-nv-info" },
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({});
  const [sel, setSel] = useState<string>("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsErr, setStatsErr] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string>("");
  const [log, setLog] = useState<{ t: string; m: string; ok: boolean }[]>([]);
  const [argVals, setArgVals] = useState<Record<string, string>>({});
  const [shot, setShot] = useState<string>("");
  const [shotLoading, setShotLoading] = useState(false);
  const [autoShot, setAutoShot] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // initial: load device registry + command catalog
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(api("/devices"), { cache: "no-store" });
        const j = await r.json();
        setDevices(j.devices || []);
        setCatalog(j.commands || {});
        if (j.devices?.length) setSel(j.devices[0].id);
      } catch {
        setStatsErr("Cannot reach the device backend.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadStats = useCallback(async (silent = false) => {
    if (!sel) return;
    if (!silent) setRefreshing(true);
    try {
      const r = await fetch(api(`/${sel}/stats`), { cache: "no-store" });
      const j = await r.json();
      if (j.online) { setStats(j); setStatsErr(""); }
      else { setStats(j); setStatsErr(j.err || "offline"); }
    } catch {
      setStatsErr("backend unreachable");
    } finally {
      setRefreshing(false);
    }
  }, [sel]);

  // poll stats every 5s for the selected device
  useEffect(() => {
    if (!sel) return;
    setStats(null); setStatsErr(""); setShot("");
    loadStats();
    const id = setInterval(() => loadStats(true), 5000);
    return () => clearInterval(id);
  }, [sel, loadStats]);

  const grabShot = useCallback(async () => {
    if (!sel) return;
    setShotLoading(true);
    try {
      const r = await fetch(api(`/${sel}/screenshot`), { cache: "no-store" });
      if (r.ok) {
        const blob = await r.blob();
        setShot((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
      }
    } finally {
      setShotLoading(false);
    }
  }, [sel]);

  useEffect(() => {
    if (!autoShot) return;
    grabShot();
    const id = setInterval(grabShot, 8000);
    return () => clearInterval(id);
  }, [autoShot, grabShot]);

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [log]);

  const runCmd = async (c: CatalogCmd) => {
    if (DANGER.has(c.id) && !confirm(`Run "${c.label}" on ${sel.toUpperCase()}?`)) return;
    const arg = argVals[c.id] || "";
    if (c.arg && !arg) { pushLog(`${c.label}: needs a value`, false); return; }
    setBusy(c.id);
    pushLog(`▶ ${c.label}${arg ? ` (${arg})` : ""}…`, true);
    try {
      const r = await fetch(api(`/${sel}/cmd`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: c.id, arg }),
      });
      const j = await r.json();
      pushLog(`${j.ok ? "✓" : "✗"} ${c.label}${j.out ? ": " + j.out : j.error ? ": " + j.error : ""}`, !!j.ok);
      setTimeout(() => loadStats(true), 1200);
    } catch (e) {
      pushLog(`✗ ${c.label}: ${e}`, false);
    } finally {
      setBusy("");
    }
  };

  const pushLog = (m: string, ok: boolean) =>
    setLog((l) => [...l.slice(-80), { t: new Date().toLocaleTimeString(), m, ok }]);

  const online = !!stats?.online;

  return (
    <AppShell title="Phone Command Center">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* device selector row */}
        <div className="flex flex-wrap items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-nv-text-muted text-sm">
              <Loader2 size={16} className="animate-spin text-nv-teal" /> Loading devices…
            </div>
          ) : devices.length === 0 ? (
            <div className="text-nv-error text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> No devices registered.
            </div>
          ) : (
            devices.map((d) => (
              <button
                key={d.id}
                onClick={() => setSel(d.id)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-nv-lg px-4 py-2.5 border transition-all",
                  sel === d.id
                    ? "nv-glass-elevated border-nv-teal/50 text-nv-text-primary shadow-nv-glow-sm"
                    : "nv-glass border-nv-teal/10 text-nv-text-secondary hover:border-nv-teal/30"
                )}
              >
                <Smartphone size={17} className={sel === d.id ? "text-nv-teal" : "text-nv-text-muted"} />
                <div className="text-left leading-tight">
                  <div className="text-[13.5px] font-semibold">{d.name}</div>
                  <div className="text-[11px] text-nv-text-muted">{d.model}</div>
                </div>
              </button>
            ))
          )}
          <div className="ml-auto flex items-center gap-2">
            <StatusDot online={online} err={statsErr} />
            <button
              onClick={() => loadStats()}
              className="flex items-center gap-1.5 rounded-nv-md px-3 py-2 nv-glass border border-nv-teal/15 text-[12.5px] text-nv-text-secondary hover:border-nv-teal/40 transition-all"
            >
              <RefreshCw size={13} className={cn("text-nv-teal", refreshing && "animate-spin")} /> Refresh
            </button>
          </div>
        </div>

        {sel && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* LEFT: stats (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {/* hero stat tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <BatteryTile stats={stats} />
                <Tile icon={Thermometer} label="Temp" value={stats?.temp != null ? `${stats.temp}°C` : "—"}
                  tone={Number(stats?.temp) > 42 ? "text-nv-error" : "text-nv-text-primary"} />
                <Tile icon={ShieldCheck} label="Integrity"
                  value={verdictShort(stats?.integrity)} tone={verdictTone(stats?.integrity)} />
                <Tile icon={Clock} label="Uptime" value={fmtUptime(stats?.uptime)} tone="text-nv-text-primary" />
              </div>

              {/* signal panel */}
              <Panel title="Cellular" icon={Signal}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                  <KV label="Operator" value={String(stats?.op || (stats?.sim === "ABSENT" ? "No SIM" : "—"))} />
                  <KV label="Network" value={String(stats?.rat || "—")} />
                  <KV label="Band" value={stats?.band ? `B${stats.band}` : "—"} />
                  <KV label="Signal" value={stats?.rsrp ? `${stats.rsrp} dBm` : "—"} sig={Number(stats?.rsrp)} />
                  <KV label="EARFCN" value={String(stats?.earfcn || "—")} />
                  <KV label="PCI" value={String(stats?.pci || "—")} />
                  <KV label="SIM" value={String(stats?.sim || "—")} />
                  <KV label="ADB-TCP" value={stats?.adbtcp ? `:${stats.adbtcp}` : "off"} />
                </div>
              </Panel>

              {/* services health */}
              <Panel title="Services & Remote Access" icon={Server}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  <Health label="Tailscale" ok={!!stats?.tun0} detail={String(stats?.tun0 || "down")} icon={Wifi} />
                  <Health label="SSH :8022" ok={Number(stats?.sshd) > 0} detail={Number(stats?.sshd) > 0 ? "listening" : "down"} icon={Server} />
                  <Health label="Tap-server" ok={Number(stats?.tap) > 0} detail={Number(stats?.tap) > 0 ? "up" : "down"} icon={MonitorSmartphone} />
                  <Health label="RustDesk" ok={Number(stats?.rustdesk) > 0} detail={Number(stats?.rustdesk) > 0 ? "capturing" : "idle"} icon={Camera} />
                  <Health label="Watchdog" ok={Number(stats?.watchdog) > 0} detail={Number(stats?.watchdog) > 0 ? "running" : "down"} icon={Eye} />
                  <Health label="Root" ok={Number(stats?.root_uid) === 0} detail={Number(stats?.root_uid) === 0 ? `Magisk · ${stats?.modules}mods` : "no root"} icon={Cpu} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-nv-teal/10 text-[11.5px] text-nv-text-muted">
                  <Chip>Screen: {String(stats?.screen || "—")}</Chip>
                  <Chip>Beacon: {String(stats?.beacon || "—")}</Chip>
                  <Chip>Lockdown: {Number(stats?.lockdown) ? "ON" : "off"}</Chip>
                  <Chip>Power-alarm: {Number(stats?.poweralarm) ? "armed" : "none"}</Chip>
                </div>
              </Panel>

              {/* command console */}
              <Panel title="Command Log" icon={Terminal}>
                <div ref={logRef} className="h-40 overflow-y-auto font-mono text-[12px] space-y-1 pr-1">
                  {log.length === 0 ? (
                    <div className="text-nv-text-muted">No commands run yet. Fire one from the right →</div>
                  ) : (
                    log.map((e, i) => (
                      <div key={i} className={cn("flex gap-2", e.ok ? "text-nv-text-secondary" : "text-nv-error")}>
                        <span className="text-nv-text-muted shrink-0">{e.t}</span>
                        <span className="break-all whitespace-pre-wrap">{e.m}</span>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>

            {/* RIGHT: screenshot + commands */}
            <div className="space-y-4">
              {/* live screen */}
              <Panel title="Live Screen" icon={Camera}
                right={
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11.5px] text-nv-text-muted cursor-pointer">
                      <input type="checkbox" checked={autoShot} onChange={(e) => setAutoShot(e.target.checked)}
                        className="accent-nv-teal" /> Auto
                    </label>
                    <button onClick={grabShot} disabled={shotLoading}
                      className="flex items-center gap-1 text-[12px] text-nv-teal hover:opacity-80">
                      <Camera size={13} className={shotLoading ? "animate-pulse" : ""} /> Capture
                    </button>
                  </div>
                }>
                <div className="rounded-nv-md overflow-hidden bg-nv-void/60 border border-nv-teal/10 flex items-center justify-center min-h-[280px]">
                  {shot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shot} alt="device screen" className="max-h-[420px] w-auto object-contain" />
                  ) : (
                    <button onClick={grabShot} className="flex flex-col items-center gap-2 text-nv-text-muted py-10 hover:text-nv-teal transition-colors">
                      {shotLoading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
                      <span className="text-[12px]">Tap to capture screen</span>
                    </button>
                  )}
                </div>
              </Panel>

              {/* commands */}
              {Object.entries(catalog).map(([cat, cmds]) => {
                const meta = CAT_META[cat] || { label: cat, icon: Zap, tone: "text-nv-teal" };
                return (
                  <Panel key={cat} title={meta.label} icon={meta.icon} iconTone={meta.tone}>
                    <div className="space-y-2">
                      {cmds.map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                          {c.arg && (
                            <input
                              value={argVals[c.id] || ""}
                              onChange={(e) => setArgVals((v) => ({ ...v, [c.id]: e.target.value }))}
                              placeholder={c.argHint || "arg"}
                              className="w-20 shrink-0 rounded-nv-sm bg-nv-void/60 border border-nv-teal/15 px-2 py-1.5 text-[12px] text-nv-text-primary placeholder:text-nv-text-muted focus:border-nv-teal/50 outline-none"
                            />
                          )}
                          <button
                            onClick={() => runCmd(c)}
                            disabled={busy === c.id || !online}
                            className={cn(
                              "flex-1 flex items-center justify-between gap-2 rounded-nv-md px-3 py-2 text-[12.5px] border transition-all disabled:opacity-40",
                              DANGER.has(c.id)
                                ? "nv-glass border-nv-error/20 text-nv-text-secondary hover:border-nv-error/50 hover:text-nv-error"
                                : "nv-glass border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 hover:text-nv-text-primary"
                            )}
                          >
                            <span>{c.label.replace(" {arg}", "")}</span>
                            {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={14} className="opacity-50" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ---------- small presentational components ---------- */

function Panel({ title, icon: Icon, iconTone, right, children }: {
  title: string; icon: React.ElementType; iconTone?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="nv-glass rounded-nv-lg p-4 border border-nv-teal/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-nv-text-primary text-[13.5px] font-semibold">
          <Icon size={15} className={iconTone || "text-nv-teal"} /> {title}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <div className="nv-glass rounded-nv-lg p-3.5 border border-nv-teal/10">
      <div className="flex items-center gap-1.5 text-[11px] text-nv-text-muted mb-1.5">
        <Icon size={13} className="text-nv-text-muted" /> {label}
      </div>
      <div className={cn("text-[19px] font-semibold leading-none", tone)}>{value}</div>
    </div>
  );
}

function BatteryTile({ stats }: { stats: Stats | null }) {
  const lvl = Number(stats?.batt ?? 0);
  const plugged = String(stats?.plug) === "true";
  const tone = lvl <= 15 ? "text-nv-error" : lvl <= 35 ? "text-nv-warning" : "text-nv-success";
  const bar = lvl <= 15 ? "bg-nv-error" : lvl <= 35 ? "bg-nv-warning" : "bg-nv-success";
  return (
    <div className="nv-glass rounded-nv-lg p-3.5 border border-nv-teal/10">
      <div className="flex items-center gap-1.5 text-[11px] text-nv-text-muted mb-1.5">
        <Battery size={13} className="text-nv-text-muted" /> Battery {plugged && <Zap size={11} className="text-nv-teal" />}
      </div>
      <div className={cn("text-[19px] font-semibold leading-none mb-2", tone)}>{stats?.batt != null ? `${lvl}%` : "—"}</div>
      <div className="h-1.5 rounded-full bg-nv-void/60 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${lvl}%` }} />
      </div>
    </div>
  );
}

function KV({ label, value, sig }: { label: string; value: string; sig?: number }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide text-nv-text-muted mb-0.5">{label}</div>
      <div className="text-[13px] text-nv-text-primary font-medium flex items-center gap-1.5">
        {value}
        {sig !== undefined && !Number.isNaN(sig) && sig !== 0 && <SignalBars rsrp={sig} />}
      </div>
    </div>
  );
}

function SignalBars({ rsrp }: { rsrp: number }) {
  // rsrp: -80 great … -120 poor
  const level = rsrp >= -85 ? 4 : rsrp >= -95 ? 3 : rsrp >= -105 ? 2 : rsrp >= -115 ? 1 : 0;
  return (
    <span className="inline-flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map((b) => (
        <span key={b} className={cn("w-0.5 rounded-sm", b <= level ? "bg-nv-teal" : "bg-nv-text-muted/30")}
          style={{ height: `${b * 25}%` }} />
      ))}
    </span>
  );
}

function Health({ label, ok, detail, icon: Icon }: { label: string; ok: boolean; detail: string; icon: React.ElementType }) {
  return (
    <div className={cn("rounded-nv-md px-3 py-2.5 border flex items-center gap-2.5",
      ok ? "bg-nv-success/5 border-nv-success/20" : "bg-nv-error/10 border-nv-error/25")}>
      <Icon size={15} className={ok ? "text-nv-success" : "text-nv-error"} />
      <div className="min-w-0">
        <div className="text-[12.5px] text-nv-text-primary font-medium leading-tight">{label}</div>
        <div className="text-[11px] text-nv-text-muted truncate">{detail}</div>
      </div>
      {ok ? <CircleCheck size={14} className="text-nv-success ml-auto shrink-0" />
          : <CircleX size={14} className="text-nv-error ml-auto shrink-0" />}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-nv-sm bg-nv-void/60 border border-nv-teal/10 px-2 py-0.5">{children}</span>;
}

function StatusDot({ online, err }: { online: boolean; err: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <span className={cn("w-2 h-2 rounded-full", online ? "bg-nv-success animate-pulse" : "bg-nv-error")} />
      <span className={online ? "text-nv-success" : "text-nv-error"}>
        {online ? "Online" : err ? `Offline · ${err}` : "Offline"}
      </span>
    </div>
  );
}

/* ---------- helpers ---------- */
function fmtUptime(s?: string | number | boolean) {
  const n = Number(s || 0);
  if (!n) return "—";
  const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function verdictShort(v?: string | number | boolean) {
  const s = String(v || "unknown");
  if (s.includes("STRONG")) return "STRONG";
  if (s.includes("DEVICE")) return "DEVICE";
  if (s.includes("BASIC")) return "BASIC";
  if (s.includes("NO_INTEGRITY")) return "FAIL";
  return "—";
}
function verdictTone(v?: string | number | boolean) {
  const s = String(v || "");
  if (s.includes("STRONG") || s.includes("DEVICE")) return "text-nv-success";
  if (s.includes("BASIC")) return "text-nv-warning";
  if (s.includes("NO_INTEGRITY")) return "text-nv-error";
  return "text-nv-text-muted";
}
