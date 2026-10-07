"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/admin/AppShell";
import { RackTerminal } from "@/components/admin/RackTerminal";
import {
  Smartphone, Loader2, RefreshCw, Battery, Thermometer, Signal, ShieldCheck,
  Wifi, Server, MonitorSmartphone, Radio, Cpu, Clock, Power, Lock, Eye,
  Zap, Terminal, ChevronRight, AlertTriangle, CircleCheck, CircleX, Camera, KeyRound,
  Maximize, ExternalLink, Users, ChevronUp, ChevronDown,
  Satellite, MapPin, Navigation, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import VmUsersPanel from "./VmUsersPanel";

type Device = {
  id: string; name: string; model: string;
  tap?: string;          // tap-server base url (TAILNET only — reachable from a tailnet browser)
  rustdesk_id?: string;  // registry-held: RustDesk stores its ID encrypted, so it can't be read live
  rustdesk_pw?: string;
  control_url?: string;  // ScrcpyOverWebRTC live control — PUBLIC url, WebRTC media is peer-to-peer
  terminal_url?: string; // rack only: browser PTY (ttyd) with cyden/listc preloaded
  local?: boolean;       // runs ON the rack — no SSH hop, no tailnet
  commands?: Catalog;    // per-device catalogue; phone commands must not appear on the rack
  beacon?: boolean;      // has a transit beacon (self-boot → check-in → power off) in the rack mailbox
};
type BeaconReport = {
  _rx?: string; ts?: string; batt?: number; plug?: string;
  lat?: string; lon?: string; acc?: string;
  ci?: string; tac?: string; earfcn?: string; pci?: string; rsrp?: string;
  op?: string; roam?: number; boot?: string; next?: number;
};
type BeaconData = {
  ok?: number; supported?: boolean; err?: string; dev?: string;
  latest?: BeaconReport; pending_command?: string; next_boot?: number;
  count?: number; last_rx?: string;
  history?: BeaconReport[];
  battery_series?: [string, number][];
  location_series?: { ts: string; lat: string; lon: string; acc: string }[];
};
type CatalogCmd = { id: string; label: string; arg: boolean; argHint: string };
type Catalog = Record<string, CatalogCmd[]>;
type Stats = Record<string, string | number | boolean>;
type Area = "devices" | "cloud";
type WorkTab = "control" | "actions" | "beacon" | "status" | "shell";

const api = (path: string) => `/api/admin/devices?path=${encodeURIComponent(path)}`;

// commands that get a confirm prompt before firing
const DANGER = new Set(["reboot", "lockdown_on", "screen_off"]);
// Android keycodes. Must stay within the backend's allow-list (it refuses anything else).
const NAV_KEYS = [
  { code: 4, label: "Back" },
  { code: 3, label: "Home" },
  { code: 187, label: "Recents" },
  { code: 82, label: "Menu" },
  { code: 224, label: "Wake" },
  { code: 26, label: "Power" },
];
// one-click diagnostics — the checks that actually get run on this fleet
const SNIPPETS: { label: string; cmd: string }[] = [
  { label: "Charge health", cmd: "printf 'now='; cat /sys/class/power_supply/battery/current_now; printf 'cap='; cat /sys/class/power_supply/battery/capacity; printf 'usbmax='; cat /sys/class/power_supply/usb/current_max; printf 'type='; cat /sys/class/power_supply/usb/type" },
  { label: "Top CPU", cmd: "top -b -n 1 -m 10 -s 1 -o %CPU,RES,NAME | head -16" },
  { label: "RustDesk armed?", cmd: "printf 'capture='; dumpsys media_projection | grep -c carriez; dumpsys accessibility | grep -A3 'Bound services'" },
  { label: "rd-arm log", cmd: "tail -20 /data/local/tmp/rd-arm.log" },
  { label: "Watchdog log", cmd: "tail -20 /data/local/tmp/op3-watchdog.log" },
  { label: "Tailscale/tun0", cmd: "ip -4 addr show tun0; netstat -tln | grep -E ':8022|:8089'" },
  { label: "Integrity print", cmd: "grep -aE 'Estimated Expiry|FINGERPRINT' /data/adb/modules/playintegrityfix/custom.pif.prop" },
  { label: "Disk", cmd: "df -h /data" },
  { label: "Uptime/load", cmd: "uptime; cat /proc/loadavg" },
];
const CAT_META: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  screen: { label: "Screen", icon: MonitorSmartphone, tone: "text-nv-teal" },
  power: { label: "Power", icon: Power, tone: "text-nv-error" },
  access: { label: "Remote Access", icon: Wifi, tone: "text-nv-violet" },
  integrity: { label: "Integrity", icon: ShieldCheck, tone: "text-nv-success" },
  beacon: { label: "Beacon", icon: Radio, tone: "text-nv-ember" },
  info: { label: "Info", icon: Terminal, tone: "text-nv-info" },
  services: { label: "Services", icon: Server, tone: "text-nv-violet" },
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
  const [control, setControl] = useState(false);
  const [tapping, setTapping] = useState(false);
  const [shellCmd, setShellCmd] = useState("");
  const [shellOut, setShellOut] = useState("");
  const [shellBusy, setShellBusy] = useState(false);
  const [shellHist, setShellHist] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);   // -1 = editing a fresh line
  const [liveOpen, setLiveOpen] = useState(false);
  const [area, setAreaState] = useState<Area>("devices");
  const [tab, setTabState] = useState<WorkTab>("control");
  const [logOpen, setLogOpen] = useState(false);
  const [beacon, setBeacon] = useState<BeaconData | null>(null);
  const [beaconLoading, setBeaconLoading] = useState(false);
  const [beaconHours, setBeaconHours] = useState("12");
  const [beaconBusy, setBeaconBusy] = useState("");
  // The activity bar is position:fixed (sticky does not survive the app shell), so it tracks the
  // content column's box: correct whether the sidebar is open, collapsed, or gone on a phone.
  // callback ref: the column mounts late (after the auth guard), so an effect keyed on a plain ref would miss it
  const [colEl, setColEl] = useState<HTMLDivElement | null>(null);
  const [dock, setDock] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  useEffect(() => {
    const el = colEl; if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); setDock({ left: r.left, width: r.width }); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el); ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [colEl]);
  // remember where you were (per browser); a command failure pops the activity log open
  useEffect(() => {
    try {
      const a = localStorage.getItem("pcc.area"); if (a === "devices" || a === "cloud") setAreaState(a);
      const t = localStorage.getItem("pcc.tab"); if (t === "control" || t === "actions" || t === "beacon" || t === "status" || t === "shell") setTabState(t);
    } catch {}
  }, []);
  const setArea = (a: Area) => { setAreaState(a); try { localStorage.setItem("pcc.area", a); } catch {} };
  const setTab = (t: WorkTab) => { setTabState(t); try { localStorage.setItem("pcc.tab", t); } catch {} };
  const logRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

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
    setLiveOpen(false);   // never carry a live session across a device switch
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

  // Interactive control. Taps/keys are proxied through the backend to the device tap-server,
  // so this works from any browser — the tap-server itself is tailnet-only and unreachable direct.
  const sendInput = useCallback(async (kind: "tap" | "key", payload: Record<string, number>, label: string) => {
    if (!sel) return;
    setTapping(true);
    try {
      const r = await fetch(api(`/${sel}/${kind}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!j.ok) pushLog(`✗ ${label}: ${j.error || j.out || "failed"}`, false);
      // re-grab the screen so you see the result of what you just pressed
      setTimeout(grabShot, 600);
    } catch (e) {
      pushLog(`✗ ${label}: ${e}`, false);
    } finally {
      setTapping(false);
    }
  }, [sel, grabShot]);

  // shell history is per-device and survives reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`pcc.shellhist.${sel}`);
      setShellHist(raw ? JSON.parse(raw) : []);
    } catch { setShellHist([]); }
    setShellOut(""); setHistIdx(-1);
  }, [sel]);

  const runShell = useCallback(async (raw?: string, confirmed = false) => {
    const cmd = (raw ?? shellCmd).trim();
    if (!cmd || !sel) return;
    setShellBusy(true);
    try {
      const r = await fetch(api(`/${sel}/shell`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd, confirm: confirmed }),
      });
      const j = await r.json();

      // The backend refuses unrecoverable commands outright and asks twice for the ones that
      // could sever remote access. Surface that here rather than silently swallowing it.
      if (j.needsConfirm && !confirmed) {
        setShellBusy(false);
        if (confirm(`This ${j.reason}.\n\n  ${cmd}\n\nRun it anyway?`)) return runShell(cmd, true);
        setShellOut((p) => `${p}$ ${cmd}\ncancelled\n\n`);
        return;
      }
      setShellOut((p) => `${p}$ ${cmd}\n${j.out || j.error || "(no output)"}\n\n`);
      if (!j.blocked) {
        setShellHist((h) => {
          const next = [cmd, ...h.filter((x) => x !== cmd)].slice(0, 40);
          try { localStorage.setItem(`pcc.shellhist.${sel}`, JSON.stringify(next)); } catch {}
          return next;
        });
      }
      setShellCmd(""); setHistIdx(-1);
    } catch (e) {
      setShellOut((p) => `${p}$ ${cmd}\nerror: ${e}\n\n`);
    } finally {
      setShellBusy(false);
    }
  }, [sel, shellCmd]);

  const onShellKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); runShell(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = Math.min(histIdx + 1, shellHist.length - 1);
      if (i >= 0) { setHistIdx(i); setShellCmd(shellHist[i]); }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = histIdx - 1;
      setHistIdx(i);
      setShellCmd(i >= 0 ? shellHist[i] : "");
    }
  };

  // Opening live control wakes + unlocks the device first. The agent captures via
  // MediaProjection, so a device with the screen off streams pure black — which looks like a
  // broken player rather than a sleeping phone. These are unattended phones that sleep on a
  // timer, so this would otherwise happen most times you connect.
  const openLive = useCallback(async () => {
    setLiveOpen(true);
    if (!sel) return;
    try {
      await fetch(api(`/${sel}/cmd`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: "unlock" }),
      });
    } catch { /* non-fatal: the stream may still be fine if it was already awake */ }
  }, [sel]);

  // Translate a click on the scaled-down screenshot back into real device pixels.
  const onScreenClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!control) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    if (!img.naturalWidth || !rect.width) return;
    const x = Math.round((e.clientX - rect.left) * (img.naturalWidth / rect.width));
    const y = Math.round((e.clientY - rect.top) * (img.naturalHeight / rect.height));
    sendInput("tap", { x, y }, `tap ${x},${y}`);
  };

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

  const pushLog = (m: string, ok: boolean) => {
    setLog((l) => [...l.slice(-80), { t: new Date().toLocaleTimeString(), m, ok }]);
    if (!ok) setLogOpen(true);
  };

  const online = !!stats?.online;
  const selDev = devices.find((d) => d.id === sel);
  const pifDays = daysUntil(stats?.pif_expiry);
  // The rack is a machine, not a phone: no battery, cellular, RustDesk or screen capture.
  const isRack = !!selDev?.local;
  // Per-device catalogue, falling back to the legacy top-level one during a rollout.
  const activeCatalog: Catalog = selDev?.commands ?? catalog;

  // ---- layout state: what is on screen. Persisted so the page reopens where you left it. ----
  // The page used to be one long column of permanently expanded panels. Now: two areas (the device
  // fleet / Nexa Cloud users), always-visible vitals, and ONE workspace at a time per device.
  const tabs: { id: WorkTab; label: string; icon: React.ElementType }[] = [
    { id: "control", label: isRack ? "Terminal" : "Control", icon: isRack ? Terminal : MonitorSmartphone },
    { id: "actions", label: "Actions", icon: Zap },
    ...(selDev?.beacon ? [{ id: "beacon" as WorkTab, label: "Beacon", icon: Satellite }] : []),
    { id: "status", label: "Status", icon: Server },
    { id: "shell", label: "Shell", icon: Terminal },
  ];
  const lastLog = log[log.length - 1];

  const loadBeacon = useCallback(async () => {
    if (!sel) return;
    setBeaconLoading(true);
    try {
      const r = await fetch(api(`/${sel}/beacon`), { cache: "no-store" });
      setBeacon(await r.json());
    } catch (e) {
      setBeacon({ ok: 0, err: String(e) });
    } finally {
      setBeaconLoading(false);
    }
  }, [sel]);

  // load beacon data when the tab is opened or the device changes
  useEffect(() => {
    if (area === "devices" && tab === "beacon" && sel) loadBeacon();
  }, [tab, sel, area, loadBeacon]);

  const beaconAction = async (action: string, extra: Record<string, unknown>, label: string, danger = false) => {
    if (danger && !confirm(`${label.toUpperCase()} on ${sel.toUpperCase()}?`)) return;
    setBeaconBusy(action + String(extra.command || ""));
    pushLog(`▶ beacon: ${label}…`, true);
    try {
      const r = await fetch(api(`/${sel}/beacon`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const j = await r.json();
      pushLog(`${j.ok ? "✓" : "✗"} beacon ${label}${j.out ? ": " + j.out : j.err ? ": " + j.err : ""}`, !!j.ok);
      setTimeout(loadBeacon, 900);
    } catch (e) {
      pushLog(`✗ beacon ${label}: ${e}`, false);
    } finally {
      setBeaconBusy("");
    }
  };

  return (
    <AppShell title="Phone Command Center">
      <div ref={setColEl} className="max-w-7xl mx-auto space-y-4 pb-16">
        {/* area switch: the fleet, or the people who use the cloud phones */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-nv-lg nv-glass border border-nv-teal/10">
            {([["devices", "Devices", Smartphone], ["cloud", "Nexa Cloud", Users]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setArea(id)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-nv-md text-[13.5px] font-medium transition-all",
                  area === id ? "bg-nv-teal/15 text-nv-text-primary shadow-nv-glow-sm" : "text-nv-text-muted hover:text-nv-text-primary")}>
                <Icon size={16} className={area === id ? "text-nv-teal" : ""} /> {label}
              </button>
            ))}
          </div>
          {area === "devices" && (
            <div className="ml-auto flex items-center gap-2">
              <StatusDot online={online} err={statsErr} />
              <button onClick={() => loadStats()} title="Refresh"
                className="flex items-center gap-1.5 rounded-nv-md px-3 py-2 nv-glass border border-nv-teal/15 text-[12.5px] text-nv-text-secondary hover:border-nv-teal/40 transition-all">
                <RefreshCw size={14} className={cn("text-nv-teal", refreshing && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          )}
        </div>

        {area === "cloud" && <VmUsersPanel />}

        {area === "devices" && (
          <>
            {/* device switcher: one scrolling row, never wraps into a wall of buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {loading ? (
                <div className="flex items-center gap-2 text-nv-text-muted text-sm py-2">
                  <Loader2 size={16} className="animate-spin text-nv-teal" /> Loading devices…
                </div>
              ) : devices.length === 0 ? (
                <div className="text-nv-error text-sm flex items-center gap-2 py-2">
                  <AlertTriangle size={16} /> No devices registered.
                </div>
              ) : (
                devices.map((d) => (
                  <button key={d.id} onClick={() => setSel(d.id)}
                    className={cn("shrink-0 flex items-center gap-2.5 rounded-nv-lg px-3.5 py-2 border transition-all",
                      sel === d.id
                        ? "nv-glass-elevated border-nv-teal/50 text-nv-text-primary shadow-nv-glow-sm"
                        : "nv-glass border-nv-teal/10 text-nv-text-secondary hover:border-nv-teal/30")}>
                    {d.local ? <Server size={16} className={sel === d.id ? "text-nv-teal" : "text-nv-text-muted"} />
                      : <Smartphone size={16} className={sel === d.id ? "text-nv-teal" : "text-nv-text-muted"} />}
                    <div className="text-left leading-tight">
                      <div className="text-[13px] font-semibold whitespace-nowrap">{d.name}</div>
                      <div className="text-[10.5px] text-nv-text-muted whitespace-nowrap">{d.model}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {sel && (
              <>
                {/* vitals: always visible, whatever workspace is open */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {isRack ? (
                    <>
                      <Tile icon={Cpu} label="Load (1m)" value={String(stats?.load1 ?? "—")}
                        tone={Number(stats?.load1) > Number(stats?.cpus || 99) ? "text-nv-error" : "text-nv-text-primary"} />
                      <Tile icon={Server} label="Memory"
                        value={stats?.mem_pct != null ? `${stats.mem_pct}%` : "—"}
                        tone={Number(stats?.mem_pct) > 90 ? "text-nv-error" : Number(stats?.mem_pct) > 75 ? "text-nv-warning" : "text-nv-text-primary"} />
                      <Tile icon={Server} label="Disk C:"
                        value={stats?.disk_c_pct != null ? `${stats.disk_c_pct}%` : "—"}
                        tone={Number(stats?.disk_c_pct) > 90 ? "text-nv-error" : Number(stats?.disk_c_pct) > 80 ? "text-nv-warning" : "text-nv-text-primary"} />
                      <Tile icon={Server} label="Free C:"
                        value={stats?.disk_c_free_gb != null ? `${stats.disk_c_free_gb} GB` : "—"} tone="text-nv-text-primary" />
                      <Tile icon={Clock} label="Uptime" value={fmtUptime(stats?.uptime)} tone="text-nv-text-primary" />
                    </>
                  ) : (
                    <>
                      <BatteryTile stats={stats} />
                      <CpuTile stats={stats} />
                      <Tile icon={Thermometer} label="Temp" value={stats?.temp != null ? `${stats.temp}°C` : "—"}
                        tone={Number(stats?.temp) > 42 ? "text-nv-error" : "text-nv-text-primary"} />
                      <Tile icon={ShieldCheck} label="Integrity"
                        value={verdictShort(stats?.integrity)} tone={verdictTone(stats?.integrity)} />
                      <Tile icon={Clock} label="Uptime" value={fmtUptime(stats?.uptime)} tone="text-nv-text-primary" />
                    </>
                  )}
                </div>

                {/* "plugged in" != "actually charging": an underpowered port drains while it reads Charging */}
                {stats?.chg_state === "draining" && (
                  <div className="flex items-start gap-2.5 rounded-nv-md px-3.5 py-2.5 bg-nv-error/10 border border-nv-error/25">
                    <AlertTriangle size={15} className="text-nv-error mt-0.5 shrink-0" />
                    <div className="text-[12.5px] leading-snug">
                      <span className="text-nv-error font-medium">Plugged in but draining.</span>{" "}
                      <span className="text-nv-text-secondary">
                        Input capped at {fmtWatts(stats?.in_mw)} ({String(stats?.usb_type || "USB")}) — less than the
                        device is using{stats?.chg_now != null ? ` (${stats.chg_now} µA)` : ""}. Move to a higher-wattage charger.
                      </span>
                    </div>
                  </div>
                )}

                {/* workspace tabs */}
                <div className="flex gap-1 overflow-x-auto border-b border-nv-teal/10">
                  {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={cn("shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 text-[13px] sm:text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
                        tab === t.id ? "border-nv-teal text-nv-text-primary" : "border-transparent text-nv-text-muted hover:text-nv-text-primary")}>
                      <t.icon size={15} className={tab === t.id ? "text-nv-teal" : ""} /> {t.label}
                    </button>
                  ))}
                </div>

                {/* ============ CONTROL ============ */}
                {tab === "control" && (
                  <div className="space-y-4">
                    {/* Rack: a real PTY (ttyd) with cyden/cyden2/listc preloaded. Lazy like Live Control. */}
                    {selDev?.terminal_url && (
                      <Panel title="Terminal" icon={Terminal}
                        right={
                          <div className="flex items-center gap-3 text-[12px]">
                            <a href={selDev.terminal_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-nv-text-muted hover:text-nv-teal">
                              New tab <ExternalLink size={12} />
                            </a>
                            {liveOpen && (
                              <button onClick={() => setLiveOpen(false)} className="text-nv-text-muted hover:text-nv-error">Close</button>
                            )}
                          </div>
                        }>
                        {liveOpen ? (
                          <RackTerminal url={selDev.terminal_url} onClose={() => setLiveOpen(false)} />
                        ) : (
                          <button onClick={() => setLiveOpen(true)} disabled={!online}
                            className="w-full flex flex-col items-center gap-2 py-10 rounded-nv-md nv-glass border border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 hover:text-nv-text-primary transition-all disabled:opacity-40">
                            <Terminal size={24} className="text-nv-teal" />
                            <span className="text-[13px] font-medium">Open terminal</span>
                            <span className="text-[11px] text-nv-text-muted">
                              Root shell on the rack — <code>cyden</code>, <code>cyden2</code> and <code>listc</code> are ready
                            </span>
                          </button>
                        )}
                      </Panel>
                    )}

                    <div className={cn("grid gap-4", selDev?.control_url && !isRack ? "lg:grid-cols-5" : "")}>
                      {/* Live control (WebRTC, peer-to-peer). Lazy: the session and the phone's encoder only
                          start when you open it, so an idle dashboard costs the device nothing. */}
                      {selDev?.control_url && (
                        <div className="lg:col-span-3">
                          <Panel title="Live Control" icon={MonitorSmartphone}
                            right={
                              <div className="flex items-center gap-3 text-[12px]">
                                {liveOpen && (
                                  <button onClick={() => liveRef.current?.requestFullscreen?.()}
                                    className="flex items-center gap-1 text-nv-teal hover:opacity-80">
                                    <Maximize size={13} /> Fullscreen
                                  </button>
                                )}
                                <a href={selDev.control_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-nv-text-muted hover:text-nv-teal">
                                  New tab <ExternalLink size={12} />
                                </a>
                                {liveOpen && (
                                  <button onClick={() => setLiveOpen(false)} className="text-nv-text-muted hover:text-nv-error">Disconnect</button>
                                )}
                              </div>
                            }>
                            {liveOpen ? (
                              <div ref={liveRef} className="rounded-nv-md overflow-hidden bg-black border border-nv-teal/20">
                                <iframe src={selDev.control_url} title="Live control"
                                  allow="fullscreen; clipboard-read; clipboard-write; autoplay" allowFullScreen
                                  className="w-full h-[72vh] border-0 bg-black" />
                              </div>
                            ) : (
                              <button onClick={openLive} disabled={!online}
                                className="w-full flex flex-col items-center gap-2 py-12 rounded-nv-md nv-glass border border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 hover:text-nv-text-primary transition-all disabled:opacity-40">
                                <MonitorSmartphone size={26} className="text-nv-teal" />
                                <span className="text-[14px] font-medium">Open live control</span>
                                <span className="text-[11.5px] text-nv-text-muted">
                                  Direct peer-to-peer stream — wakes the device and starts the session on open
                                </span>
                              </button>
                            )}
                          </Panel>
                        </div>
                      )}

                      {/* Screenshot + hardware keys: the low-bandwidth way to look and poke. Phones only. */}
                      {!isRack && (
                        <div className={selDev?.control_url ? "lg:col-span-2" : ""}>
                          <Panel title="Screen" icon={Camera}
                            right={
                              <div className="flex items-center gap-2.5">
                                <label className="flex items-center gap-1.5 text-[11.5px] text-nv-text-muted cursor-pointer">
                                  <input type="checkbox" checked={autoShot} onChange={(e) => setAutoShot(e.target.checked)} className="accent-nv-teal" /> Auto
                                </label>
                                {/* off by default so a stray click on the screenshot can't poke the phone */}
                                <label className={cn("flex items-center gap-1.5 text-[11.5px] cursor-pointer", control ? "text-nv-teal" : "text-nv-text-muted")}>
                                  <input type="checkbox" checked={control} onChange={(e) => setControl(e.target.checked)} className="accent-nv-teal" /> Tap
                                </label>
                                <button onClick={grabShot} disabled={shotLoading} className="flex items-center gap-1 text-[12px] text-nv-teal hover:opacity-80">
                                  <Camera size={13} className={shotLoading ? "animate-pulse" : ""} /> Capture
                                </button>
                              </div>
                            }>
                            <div className={cn("rounded-nv-md overflow-hidden bg-nv-void/60 border flex items-center justify-center min-h-[220px]",
                              control ? "border-nv-teal/50" : "border-nv-teal/10")}>
                              {shot ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={shot} alt="device screen" onClick={onScreenClick}
                                  className={cn("max-h-[52vh] w-auto object-contain", control && "cursor-crosshair")} />
                              ) : (
                                <button onClick={grabShot} className="flex flex-col items-center gap-2 text-nv-text-muted py-10 hover:text-nv-teal transition-colors">
                                  {shotLoading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
                                  <span className="text-[12px]">Capture the screen</span>
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1.5 mt-3">
                              {NAV_KEYS.map((k) => (
                                <button key={k.code} onClick={() => sendInput("key", { code: k.code }, k.label)} disabled={!online || tapping}
                                  className="rounded-nv-sm px-2 py-2 text-[12px] nv-glass border border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 hover:text-nv-text-primary transition-all disabled:opacity-40">
                                  {k.label}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 text-[11px] text-nv-text-muted leading-snug">
                              {control ? "Tap is ON — clicking the image taps that exact spot on the phone." : "Turn on Tap to press the screen by clicking the image."}
                            </div>
                          </Panel>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============ ACTIONS ============ */}
                {tab === "actions" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                    {Object.entries(activeCatalog).map(([cat, cmds], idx) => {
                      const meta = CAT_META[cat] || { label: cat, icon: Zap, tone: "text-nv-teal" };
                      return (
                        <Fold key={cat} id={`cat-${cat}`} title={meta.label} icon={meta.icon} iconTone={meta.tone}
                          count={cmds.length} defaultOpen={idx < 3}>
                          <div className="space-y-2">
                            {cmds.map((c) => (
                              <div key={c.id} className="flex items-center gap-2">
                                {c.arg && (
                                  <input value={argVals[c.id] || ""} placeholder={c.argHint || "arg"}
                                    onChange={(e) => setArgVals((v) => ({ ...v, [c.id]: e.target.value }))}
                                    className="w-20 shrink-0 rounded-nv-sm bg-nv-void/60 border border-nv-teal/15 px-2 py-2 text-[12px] text-nv-text-primary placeholder:text-nv-text-muted focus:border-nv-teal/50 outline-none" />
                                )}
                                <button onClick={() => runCmd(c)} disabled={busy === c.id || !online}
                                  className={cn("flex-1 flex items-center justify-between gap-2 rounded-nv-md px-3 py-2.5 text-[13px] border transition-all disabled:opacity-40",
                                    DANGER.has(c.id)
                                      ? "nv-glass border-nv-error/20 text-nv-text-secondary hover:border-nv-error/50 hover:text-nv-error"
                                      : "nv-glass border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 hover:text-nv-text-primary")}>
                                  <span>{c.label.replace(" {arg}", "")}</span>
                                  {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={14} className="opacity-50" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </Fold>
                      );
                    })}
                  </div>
                )}

                {/* ============ STATUS ============ */}
                {tab === "status" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                    {isRack ? (
                      <Fold id="st-rack" title="Rack services" icon={Server} defaultOpen>
                        <div className="grid grid-cols-2 gap-2.5">
                          <Health label="NEXA AI :8787" ok={Number(stats?.nexa_up) > 0} detail={Number(stats?.nexa_up) > 0 ? "answering" : "down"} icon={Server} />
                          <Health label="Cloudflare tunnel" ok={Number(stats?.cloudflared) > 0} detail={Number(stats?.cloudflared) > 0 ? "running" : "down"} icon={Wifi} />
                          <Health label="phonectl :8790" ok={Number(stats?.phonectl_up) > 0} detail={Number(stats?.phonectl_up) > 0 ? "answering" : "down"} icon={Server} />
                          <Health label="Cloud Phone :8443" ok={Number(stats?.cloudphone_up) > 0} detail={Number(stats?.cloudphone_up) > 0 ? "answering" : "down"} icon={MonitorSmartphone} />
                          <Health label="Signalling" ok={Number(stats?.signaling) > 0} detail={Number(stats?.signaling) > 0 ? "running" : "down"} icon={Radio} />
                          <Health label="Windows interop" ok={Number(stats?.win_interop) > 0} detail={Number(stats?.win_interop) > 0 ? "ok" : "unavailable"} icon={Cpu} />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-nv-teal/10 text-[11.5px] text-nv-text-muted">
                          <Chip>tmux server: {Number(stats?.tmux_server) ? "up" : "down"}</Chip>
                          <Chip>tunnel: {Number(stats?.tmux_tunnel) ? "up" : "down"}</Chip>
                          <Chip>phonectl: {Number(stats?.tmux_phonectl) ? "up" : "down"}</Chip>
                          <Chip>cloudphone: {Number(stats?.tmux_cloudphone) ? "up" : "down"}</Chip>
                          <Chip>CPUs: {String(stats?.cpus ?? "—")}</Chip>
                          <Chip>RAM: {stats?.mem_used_mb}/{stats?.mem_total_mb} MB</Chip>
                        </div>
                      </Fold>
                    ) : (
                      <>
                        <Fold id="st-svc" title="Services & remote access" icon={Server} defaultOpen>
                          <div className="grid grid-cols-2 gap-2.5">
                            <Health label="Tailscale" ok={!!stats?.tun0} detail={String(stats?.tun0 || "down")} icon={Wifi} />
                            <Health label="SSH :8022" ok={Number(stats?.sshd) > 0} detail={Number(stats?.sshd) > 0 ? "listening" : "down"} icon={Server} />
                            {/* Status only — deliberately NOT a link: the tap-server is tailnet-only. */}
                            <Health label="Tap-server" ok={Number(stats?.tap) > 0} detail={Number(stats?.tap) > 0 ? "up (internal)" : "down"} icon={MonitorSmartphone} />
                            <Health label="RustDesk" ok={Number(stats?.rustdesk) > 0} detail={Number(stats?.rustdesk) > 0 ? "capturing" : "idle"} icon={Camera} />
                            <Health label="Watchdog" ok={Number(stats?.watchdog) > 0} detail={Number(stats?.watchdog) > 0 ? "running" : "down"} icon={Eye} />
                            <Health label="Root" ok={Number(stats?.root_uid) === 0} detail={Number(stats?.root_uid) === 0 ? `Magisk · ${stats?.modules}mods` : "no root"} icon={Cpu} />
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-nv-teal/10 text-[11.5px] text-nv-text-muted">
                            <Chip>Screen: {String(stats?.screen || "—")}</Chip>
                            <Chip>Beacon: {String(stats?.beacon || "—")}</Chip>
                            <Chip>Lockdown: {Number(stats?.lockdown) ? "ON" : "off"}</Chip>
                            <Chip>Power-alarm: {Number(stats?.poweralarm) ? "armed" : "none"}</Chip>
                            {stats?.pif_expiry && (
                              <Chip tone={pifDays == null ? undefined : pifDays <= 0 ? "error" : pifDays <= 7 ? "warning" : undefined}>
                                Integrity print: {String(stats.pif_expiry)}
                                {pifDays != null && (pifDays <= 0 ? " · EXPIRED — re-run action.sh" : ` · ${pifDays}d left`)}
                              </Chip>
                            )}
                          </div>
                        </Fold>
                        <Fold id="st-cell" title="Cellular" icon={Signal} defaultOpen>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3">
                            <KV label="Operator" value={String(stats?.op || (stats?.sim === "ABSENT" ? "No SIM" : "—"))} />
                            <KV label="Network" value={String(stats?.rat || "—")} />
                            <KV label="Band" value={stats?.band ? `B${stats.band}` : "—"} />
                            <KV label="Signal" value={stats?.rsrp ? `${stats.rsrp} dBm` : "—"} sig={Number(stats?.rsrp)} />
                            <KV label="EARFCN" value={String(stats?.earfcn || "—")} />
                            <KV label="PCI" value={String(stats?.pci || "—")} />
                            <KV label="SIM" value={String(stats?.sim || "—")} />
                            <KV label="ADB-TCP" value={stats?.adbtcp ? `:${stats.adbtcp}` : "off"} />
                          </div>
                        </Fold>
                        <Fold id="st-ids" title="IDs & remote access" icon={KeyRound}>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3">
                            <KV label="RustDesk ID" value={selDev?.rustdesk_id || "—"} />
                            <KV label="RustDesk pw" value={selDev?.rustdesk_pw || "—"} />
                            <KV label="TeamViewer ID" value={fmtTvId(stats?.tv_id)} />
                            <KV label="TV assigned" value={Number(stats?.tv_assigned) ? "yes" : "no"} />
                            <KV label="Tailnet IP" value={String(stats?.tun0 || "—")} />
                            <KV label="Load (1m)" value={String(stats?.load1 || "—")} />
                            <KV label="Charge in" value={fmtWatts(stats?.in_mw)} />
                            <KV label="Charge state" value={String(stats?.chg_state || "—")} />
                          </div>
                          <div className="mt-3 pt-3 border-t border-nv-teal/10 text-[11px] text-nv-text-muted leading-snug">
                            RustDesk&apos;s ID is stored encrypted on the device, so it is held in the backend registry —
                            update it there if RustDesk is ever reinstalled (a reinstall mints a new ID).
                            TeamViewer&apos;s is read live from the device.
                          </div>
                        </Fold>
                      </>
                    )}
                  </div>
                )}

                {/* ============ SHELL ============ */}
                {tab === "shell" && (
                  <Panel title="Shell" icon={Terminal}
                    right={shellOut ? (
                      <button onClick={() => setShellOut("")} className="text-[11.5px] text-nv-text-muted hover:text-nv-teal">clear</button>
                    ) : undefined}>
                    <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-1">
                      {SNIPPETS.map((s) => (
                        <button key={s.label} onClick={() => runShell(s.cmd)} disabled={!online || shellBusy}
                          className="shrink-0 rounded-nv-sm px-2.5 py-1.5 text-[11.5px] nv-glass border border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 hover:text-nv-text-primary transition-all disabled:opacity-40">
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <pre className="h-[30vh] sm:h-[46vh] overflow-auto rounded-nv-sm bg-nv-void/70 border border-nv-teal/10 p-2.5 font-mono text-[11.5px] text-nv-text-secondary whitespace-pre-wrap break-all mb-2.5">
                      {shellOut || "Output appears here. Pick a check above or type a command."}
                    </pre>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] text-nv-teal select-none">#</span>
                      <input value={shellCmd} onChange={(e) => setShellCmd(e.target.value)} onKeyDown={onShellKey}
                        disabled={!online || shellBusy} spellCheck={false} autoCapitalize="none" autoCorrect="off"
                        placeholder="run as root on the device — ↑/↓ for history"
                        className="flex-1 min-w-0 rounded-nv-sm bg-nv-void/60 border border-nv-teal/15 px-2.5 py-2.5 font-mono text-[12.5px] text-nv-text-primary placeholder:text-nv-text-muted focus:border-nv-teal/50 outline-none disabled:opacity-40" />
                      <button onClick={() => runShell()} disabled={!online || shellBusy || !shellCmd.trim()}
                        className="rounded-nv-md px-4 py-2.5 text-[12.5px] nv-glass border border-nv-teal/20 text-nv-text-secondary hover:border-nv-teal/50 hover:text-nv-text-primary transition-all disabled:opacity-40">
                        {shellBusy ? <Loader2 size={13} className="animate-spin" /> : "Run"}
                      </button>
                    </div>
                    <div className="mt-2 text-[11px] text-nv-text-muted leading-snug">
                      Runs as root. Commands that can&apos;t be undone remotely (factory reset, bootloader
                      lock, raw partition writes) are refused; ones that could cut remote access ask first.
                    </div>
                  </Panel>
                )}

                {/* ============ BEACON ============ */}
                {tab === "beacon" && (
                  <div className="space-y-3">
                    {beacon?.supported === false ? (
                      <Panel title="Beacon" icon={Satellite}>
                        <div className="text-[13px] text-nv-text-muted">No transit beacon is configured for this device.</div>
                      </Panel>
                    ) : (
                      <>
                        {/* summary vitals */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <Tile icon={Clock} label="Last check-in" value={fmtAgo(beacon?.last_rx || beacon?.latest?._rx)} tone="text-nv-text-primary" />
                          <Tile icon={Battery} label="Battery" value={beacon?.latest?.batt != null ? `${beacon.latest.batt}%` : "—"}
                            tone={Number(beacon?.latest?.batt) <= 20 ? "text-nv-error" : "text-nv-text-primary"} />
                          <Tile icon={Power} label="Next boot" value={fmtEta(beacon?.next_boot)} tone="text-nv-text-primary" />
                          <Tile icon={Radio} label="Check-ins" value={String(beacon?.count ?? 0)} tone="text-nv-text-primary" />
                        </div>

                        {/* controls */}
                        <Panel title="Beacon controls" icon={Satellite}
                          right={
                            <button onClick={loadBeacon} className="flex items-center gap-1 text-[11.5px] text-nv-text-muted hover:text-nv-teal">
                              <RefreshCw size={12} className={cn("text-nv-teal", beaconLoading && "animate-spin")} /> refresh
                            </button>
                          }>
                          <div className="flex items-center gap-2 mb-3 text-[12.5px]">
                            <span className="text-nv-text-muted">Queued for next check-in:</span>
                            <Chip tone={beacon?.pending_command ? "warning" : undefined}>{beacon?.pending_command || "none"}</Chip>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => beaconAction("command", { command: "STAY_ON" }, "queue STAY_ON")} disabled={!!beaconBusy}
                              className="rounded-nv-md px-3 py-2 text-[12.5px] nv-glass border border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 hover:text-nv-text-primary transition-all disabled:opacity-40">Queue STAY_ON</button>
                            <button onClick={() => beaconAction("command", { command: "LOCKDOWN" }, "queue LOCKDOWN", true)} disabled={!!beaconBusy}
                              className="rounded-nv-md px-3 py-2 text-[12.5px] nv-glass border border-nv-error/20 text-nv-text-secondary hover:border-nv-error/50 hover:text-nv-error transition-all disabled:opacity-40">Queue LOCKDOWN</button>
                            <button onClick={() => beaconAction("clear_command", {}, "clear queued command")} disabled={!!beaconBusy || !beacon?.pending_command}
                              className="rounded-nv-md px-3 py-2 text-[12.5px] nv-glass border border-nv-teal/15 text-nv-text-secondary hover:border-nv-teal/45 transition-all disabled:opacity-40">Clear</button>
                          </div>
                          <div className="mt-3 pt-3 border-t border-nv-teal/10 flex items-center gap-2 flex-wrap">
                            <span className="text-[12.5px] text-nv-text-muted">Start transit cycle — self-boot in</span>
                            <input value={beaconHours} onChange={(e) => setBeaconHours(e.target.value)} inputMode="decimal"
                              className="w-14 rounded-nv-sm bg-nv-void/60 border border-nv-teal/15 px-2 py-1.5 text-[12px] text-nv-text-primary outline-none focus:border-nv-teal/50" />
                            <span className="text-[12.5px] text-nv-text-muted">h, then power off now</span>
                            <button onClick={() => beaconAction("cycle", { hours: Number(beaconHours) || 12 }, `arm ${beaconHours}h + power off`, true)}
                              disabled={!!beaconBusy || !online}
                              className="flex items-center gap-1.5 rounded-nv-md px-3 py-2 text-[12.5px] nv-glass border border-nv-error/20 text-nv-text-secondary hover:border-nv-error/50 hover:text-nv-error transition-all disabled:opacity-40">
                              {beaconBusy.startsWith("cycle") ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />} Arm &amp; power off
                            </button>
                          </div>
                          <div className="mt-2 text-[11px] text-nv-text-muted leading-snug">
                            Arming sets a guarded RTC self-boot, then powers the phone off. It can&apos;t strand the device —
                            it only powers off if the alarm actually armed. The phone wakes at the scheduled time over cellular,
                            checks in here, applies any queued command, then re-arms and powers off again.
                          </div>
                        </Panel>

                        {/* location + battery history */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                          <Fold id="bk-loc" title="Location" icon={MapPin} defaultOpen>
                            {beacon?.latest?.lat && beacon?.latest?.lon ? (
                              <a href={`https://maps.google.com/?q=${beacon.latest.lat},${beacon.latest.lon}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[13px] text-nv-teal hover:underline mb-2">
                                <Navigation size={14} /> {beacon.latest.lat}, {beacon.latest.lon}
                                {beacon.latest.acc && <span className="text-nv-text-muted text-[11px]">±{Math.round(Number(beacon.latest.acc))}m</span>}
                              </a>
                            ) : (
                              <div className="text-[12.5px] text-nv-text-muted mb-2">No GPS fix in the latest report — coordinates fill in once the phone gets a fix (needs sky view).</div>
                            )}
                            <div className="space-y-0.5 max-h-48 overflow-auto">
                              {(beacon?.location_series || []).slice().reverse().slice(0, 25).map((l, i) => (
                                <a key={i} href={`https://maps.google.com/?q=${l.lat},${l.lon}`} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-2 text-[11.5px] text-nv-text-secondary hover:text-nv-teal py-0.5">
                                  <span className="font-mono">{l.lat}, {l.lon}</span>
                                  <span className="text-nv-text-muted shrink-0">{fmtAgo(l.ts)}</span>
                                </a>
                              ))}
                              {(!beacon?.location_series || beacon.location_series.length === 0) && (
                                <div className="text-[11.5px] text-nv-text-muted">No location fixes recorded yet.</div>
                              )}
                            </div>
                          </Fold>
                          <Fold id="bk-batt" title="Battery history" icon={Battery} defaultOpen>
                            <Spark pts={(beacon?.battery_series || []).map((b) => b[1])} />
                            <div className="flex justify-between text-[11px] text-nv-text-muted mt-1">
                              <span>oldest {beacon?.battery_series?.[0]?.[1] ?? "—"}%</span>
                              <span>now {beacon?.latest?.batt ?? "—"}%</span>
                            </div>
                          </Fold>
                        </div>

                        {/* check-in history */}
                        <Fold id="bk-hist" title={`Check-in history (${beacon?.count ?? 0})`} icon={History} defaultOpen>
                          <div className="space-y-0.5 max-h-[42vh] overflow-auto font-mono text-[11.5px]">
                            {(beacon?.history || []).map((h, i) => (
                              <div key={i} className="flex items-center gap-2 py-1 border-b border-nv-teal/5">
                                <span className="text-nv-text-muted shrink-0 w-24">{(h._rx || h.ts || "").replace("T", " ").slice(5, 16)}</span>
                                <span className="shrink-0"><Chip>{h.boot || "?"}</Chip></span>
                                <span className="text-nv-text-secondary w-10 shrink-0">{h.batt != null ? `${h.batt}%` : "—"}</span>
                                {h.lat && h.lon ? <MapPin size={12} className="text-nv-teal shrink-0" /> : null}
                                {h.rsrp ? <span className="text-nv-text-muted">{h.rsrp}dBm</span> : null}
                                {h.ci ? <span className="text-nv-text-muted truncate">ci{h.ci}</span> : null}
                              </div>
                            ))}
                            {(!beacon?.history || beacon.history.length === 0) && <div className="text-nv-text-muted">No check-ins recorded yet.</div>}
                          </div>
                        </Fold>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Activity: docked, so a command's result is visible from any workspace. Tap to expand. */}
      {area === "devices" && dock.width > 0 && (
        <div className="fixed bottom-14 lg:bottom-0 z-30" style={{ left: dock.left, width: dock.width }}>
          <div>
            <div className="rounded-t-nv-lg border border-b-0 border-nv-teal/20 bg-nv-deep/95 backdrop-blur shadow-[0_-8px_30px_-12px_rgba(0,0,0,.7)]">
              <button onClick={() => setLogOpen((o) => !o)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left">
                <Terminal size={14} className="text-nv-teal shrink-0" />
                <span className="text-[12px] font-medium text-nv-text-secondary shrink-0">Activity</span>
                <span className={cn("flex-1 min-w-0 truncate font-mono text-[11.5px]", lastLog ? (lastLog.ok ? "text-nv-text-muted" : "text-nv-error") : "text-nv-text-muted")}>
                  {lastLog ? `${lastLog.t}  ${lastLog.m}` : "No commands run yet"}
                </span>
                {log.length > 0 && <span className="text-[11px] text-nv-text-muted shrink-0">{log.length}</span>}
                <ChevronUp size={15} className={cn("text-nv-text-muted shrink-0 transition-transform", logOpen && "rotate-180")} />
              </button>
              {logOpen && (
                <div ref={logRef} className="h-52 overflow-y-auto font-mono text-[12px] space-y-1 px-3.5 pb-3 border-t border-nv-teal/10 pt-2">
                  {log.length === 0 ? (
                    <div className="text-nv-text-muted">Run something from Actions and the result lands here.</div>
                  ) : (
                    log.map((e, i) => (
                      <div key={i} className={cn("flex gap-2", e.ok ? "text-nv-text-secondary" : "text-nv-error")}>
                        <span className="text-nv-text-muted shrink-0">{e.t}</span>
                        <span className="break-all whitespace-pre-wrap">{e.m}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ---------- small presentational components ---------- */

// "2026-10-07 08:28:25" or ISO -> "3m ago"
function fmtAgo(s?: string): string {
  if (!s) return "—";
  const t = Date.parse(s.includes("T") ? s : s.replace(" ", "T"));
  if (isNaN(t)) return s;
  const d = Math.max(0, Date.now() - t) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
// future epoch (seconds) -> "in 11h 59m"
function fmtEta(epoch?: number): string {
  if (!epoch) return "—";
  const d = epoch * 1000 - Date.now();
  if (d <= 0) return "overdue";
  const h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000);
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}
// battery sparkline (0-100)
function Spark({ pts }: { pts: number[] }) {
  if (pts.length < 2) return <div className="text-[11px] text-nv-text-muted py-3">Not enough check-ins yet for a trend.</div>;
  const w = 240, h = 40, step = w / (pts.length - 1);
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - Math.max(0, Math.min(100, v)) / 100 * h).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 text-nv-teal" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// A panel that folds. Open/closed is remembered per section, so the page keeps the shape you gave it.
function Fold({ id, title, icon: Icon, iconTone, count, defaultOpen = false, children }: {
  id: string; title: string; icon: React.ElementType; iconTone?: string; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { try { const v = localStorage.getItem(`pcc.fold.${id}`); if (v) setOpen(v === "1"); } catch {} }, [id]);
  const toggle = () => setOpen((o) => { try { localStorage.setItem(`pcc.fold.${id}`, o ? "0" : "1"); } catch {} return !o; });
  return (
    <div className="nv-glass rounded-nv-lg border border-nv-teal/10 overflow-hidden">
      <button onClick={toggle} aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
        <Icon size={16} className={iconTone || "text-nv-teal"} />
        <span className="text-[13.5px] font-semibold text-nv-text-primary">{title}</span>
        {count != null && <span className="text-[11px] text-nv-text-muted">{count}</span>}
        <ChevronDown size={16} className={cn("ml-auto text-nv-text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

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

// Hottest process on the device. This exists because a runaway `busybox httpd` once span at
// ~96% for days -- it cooked the SoC, tripped thermal throttling and out-drew the charger,
// and nothing on this dashboard would have shown it.
function CpuTile({ stats }: { stats: Stats | null }) {
  const pct = Number(stats?.top_pct ?? 0);
  const name = String(stats?.top_name || "—");
  const tone = pct >= 80 ? "text-nv-error" : pct >= 50 ? "text-nv-warning" : "text-nv-text-primary";
  return (
    <div className="nv-glass rounded-nv-lg p-3.5 border border-nv-teal/10">
      <div className="flex items-center gap-1.5 text-[11px] text-nv-text-muted mb-1.5">
        <Cpu size={13} className="text-nv-text-muted" /> Top CPU
        {pct >= 80 && <AlertTriangle size={11} className="text-nv-error" />}
      </div>
      <div className={cn("text-[19px] font-semibold leading-none", tone)}>
        {stats?.top_pct != null ? `${pct}%` : "—"}
      </div>
      <div className="text-[10.5px] text-nv-text-muted truncate mt-1" title={name}>{name}</div>
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

function Health({ label, ok, detail, icon: Icon, href }: {
  label: string; ok: boolean; detail: string; icon: React.ElementType; href?: string;
}) {
  const body = (
    <>
      <Icon size={15} className={ok ? "text-nv-success" : "text-nv-error"} />
      <div className="min-w-0">
        <div className="text-[12.5px] text-nv-text-primary font-medium leading-tight">{label}</div>
        <div className="text-[11px] text-nv-text-muted truncate">{detail}</div>
      </div>
      {ok ? <CircleCheck size={14} className="text-nv-success ml-auto shrink-0" />
          : <CircleX size={14} className="text-nv-error ml-auto shrink-0" />}
    </>
  );
  const base = cn("rounded-nv-md px-3 py-2.5 border flex items-center gap-2.5",
    ok ? "bg-nv-success/5 border-nv-success/20" : "bg-nv-error/10 border-nv-error/25");
  // href turns the tile into a launcher (tap-server). The tap-server lives on the TAILNET,
  // so the link only resolves from a browser that is itself on the tailnet.
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        title={`Open ${label} — ${href} (tailnet only)`}
        className={cn(base, "hover:border-nv-teal/50 hover:bg-nv-teal/5 transition-colors cursor-pointer")}>
        {body}
      </a>
    );
  }
  return <div className={base}>{body}</div>;
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "warning" | "error" }) {
  return (
    <span className={cn(
      "rounded-nv-sm px-2 py-0.5 border",
      tone === "error" ? "bg-nv-error/10 border-nv-error/30 text-nv-error"
        : tone === "warning" ? "bg-nv-warning/10 border-nv-warning/30 text-nv-warning"
        : "bg-nv-void/60 border-nv-teal/10"
    )}>{children}</span>
  );
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
// TeamViewer shows IDs space-grouped in 3s (841006807 -> 841 006 807)
function fmtTvId(v?: string | number | boolean) {
  const s = String(v || "").replace(/\D/g, "");
  if (!s) return "—";
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function fmtWatts(mw?: string | number | boolean) {
  const n = Number(mw || 0);
  if (!n) return "—";
  return `${(n / 1000).toFixed(1)}W`;
}
// Play Integrity canary fingerprints expire; once lapsed, banking apps start failing again.
// Returns whole days remaining (negative = already expired).
function daysUntil(d?: string | number | boolean) {
  const s = String(d || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const ms = new Date(s + "T00:00:00").getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
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
