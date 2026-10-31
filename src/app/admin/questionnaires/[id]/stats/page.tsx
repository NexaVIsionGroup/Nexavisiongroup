"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/admin/AppShell";
import { ChevronLeft, Loader2, RefreshCw, Smartphone, Clock, Users, Flag, Calculator, MapPin, KeyRound, Activity } from "lucide-react";
import { STATUS, ago } from "../../shared";

// Stats for one client link: visits, time on page, how far they got, what
// they played with. Data from /api/admin/questionnaires/[id]/stats.

interface Visit {
  id: string; start: string; end: string; seconds: number; maxScroll: number; deviceLabel: string; screen: string | null;
  referrer: string | null; tz: string | null; returning: boolean; events: number; furthest: string; furthestGroup: string;
  calcPlays: number; accessChoices: number;
}
interface Stats {
  questionnaire: { id: string; title: string; client_name: string | null; status: string; open_count: number; created_at: string; submitted_at: string | null };
  totals: { visits: number; devices: number; totalSeconds: number; avgSeconds: number; firstSeen: string | null; lastSeen: string | null; furthest: string | null };
  funnel: { key: string; label: string; group: "briefing" | "setup" | "sent"; visits: number }[];
  visits: Visit[];
  calc: { t: string; site?: number; apps?: number; shift?: number; total?: number }[];
  zone: Record<string, number>;
  access: { t: string; platform: string | null; via?: string; done?: boolean }[];
  stream: { t: string; visit: string; event: string; section: string | null; meta: any }[];
}

const dur = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`);
const when = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const money = (n?: number) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("en-US"));
const GROUP: Record<string, string> = { briefing: "bg-nv-violet/70", setup: "bg-nv-teal/70", sent: "bg-nv-success/80" };

export default function QuestionnaireStats() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [s, setS] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setBusy(true);
    return fetch(`/api/admin/questionnaires/${id}/stats`).then((r) => r.json()).then((d) => { if (d.questionnaire) setS(d); }).finally(() => setBusy(false));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => clearInterval(t);
  }, [load]);

  if (!s) return <AppShell title="Stats"><div className="flex justify-center py-16"><Loader2 className="text-nv-teal animate-spin" /></div></AppShell>;

  const q = s.questionnaire;
  const st = STATUS[q.status] || STATUS.pending;
  const maxF = Math.max(1, ...s.funnel.map((f) => f.visits));
  const lastCalc = s.calc[s.calc.length - 1];
  const latestAccess = new Map<string, Stats["access"][number]>();
  for (const a of s.access) if (a.platform) latestAccess.set(a.platform, a);

  return (
    <AppShell title={`${q.client_name || q.title} · Stats`}>
      <div className="max-w-6xl mx-auto space-y-4 pb-16">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button onClick={() => router.push(`/admin/questionnaires/${q.id}`)} className="text-xs text-nv-text-muted hover:text-nv-teal flex items-center gap-1">
            <ChevronLeft size={14} /> Back to answers
          </button>
          <button onClick={load} className="text-xs text-nv-text-muted hover:text-nv-teal flex items-center gap-1"><RefreshCw size={13} className={busy ? "animate-spin" : ""} /> Refresh · auto every 30s</button>
        </div>

        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-lg text-nv-text-primary">{q.client_name || q.title}</h1>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-xs text-nv-text-muted mt-1">
            Link made {ago(q.created_at)} · {s.totals.firstSeen ? `first opened ${ago(s.totals.firstSeen)} · last seen ${ago(s.totals.lastSeen!)}` : "not opened yet"}
            {q.submitted_at ? ` · sent ${ago(q.submitted_at)}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile icon={Users} label="Visits" value={String(s.totals.visits)} sub={`${s.totals.devices} device${s.totals.devices === 1 ? "" : "s"}`} />
          <Tile icon={Clock} label="Time on page" value={dur(s.totals.totalSeconds)} sub={s.totals.visits ? `avg ${dur(s.totals.avgSeconds)} per visit` : "—"} />
          <Tile icon={Flag} label="Got as far as" value={s.totals.furthest || "—"} small />
          <Tile icon={Smartphone} label="Last device" value={s.visits[0]?.deviceLabel || "—"} small sub={s.visits[0]?.tz || undefined} />
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
          {/* funnel */}
          <div className="nv-glass rounded-nv-lg p-5">
            <p className="nv-section-label mb-1">How far they got</p>
            <p className="text-[11px] text-nv-text-muted mb-4">Visits that reached each part of the page. <span className="inline-block w-2 h-2 rounded-sm bg-nv-violet/70 align-middle" /> briefing · <span className="inline-block w-2 h-2 rounded-sm bg-nv-teal/70 align-middle" /> setup · <span className="inline-block w-2 h-2 rounded-sm bg-nv-success/80 align-middle" /> sent</p>
            <ul className="space-y-1.5">
              {s.funnel.map((f) => (
                <li key={f.key} className="grid grid-cols-[minmax(0,1fr)_2rem] gap-2 items-center text-xs">
                  <div>
                    <div className="flex justify-between gap-2"><span className={f.visits ? "text-nv-text-primary" : "text-nv-text-muted/60"}>{f.label}</span></div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-white/5"><div className={`h-full rounded-full ${GROUP[f.group]}`} style={{ width: `${(f.visits / maxF) * 100}%` }} /></div>
                  </div>
                  <span className={`text-right font-mono ${f.visits ? "text-nv-text-primary" : "text-nv-text-muted/50"}`}>{f.visits}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {/* calculator */}
            <div className="nv-glass rounded-nv-lg p-5">
              <p className="nv-section-label mb-2 flex items-center gap-1.5"><Calculator size={13} /> Savings calculator</p>
              {!s.calc.length ? <p className="text-sm text-nv-text-muted">Not touched yet.</p> : (
                <>
                  <p className="text-xs text-nv-text-muted">Played with {s.calc.length}× · last values:</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <K k="Own-site sales / wk" v={money(lastCalc.site)} />
                    <K k="App sales / wk" v={money(lastCalc.apps)} />
                    <K k="Would switch" v={lastCalc.shift != null ? `${lastCalc.shift}%` : "—"} />
                    <K k="Yearly savings shown" v={money(lastCalc.total)} hi />
                  </div>
                  <p className="mt-2 text-[11px] text-nv-text-muted">Their own-site figure is the best hint we have of the Fast Bite volume until they share the report.</p>
                </>
              )}
            </div>
            {/* zone */}
            <div className="nv-glass rounded-nv-lg p-5">
              <p className="nv-section-label mb-2 flex items-center gap-1.5"><MapPin size={13} /> Delivery radius they tapped</p>
              {!Object.keys(s.zone).length ? <p className="text-sm text-nv-text-muted">Not touched yet.</p> : (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(s.zone).sort((a, b) => Number(a[0]) - Number(b[0])).map(([r, n]) => (
                    <span key={r} className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-nv-text-primary">{r} mi <span className="text-nv-text-muted">×{n}</span></span>
                  ))}
                </div>
              )}
            </div>
            {/* access */}
            <div className="nv-glass rounded-nv-lg p-5">
              <p className="nv-section-label mb-2 flex items-center gap-1.5"><KeyRound size={13} /> Access choices</p>
              {!latestAccess.size ? <p className="text-sm text-nv-text-muted">None yet.</p> : (
                <ul className="space-y-1 text-xs">
                  {Array.from(latestAccess.values()).map((a) => (
                    <li key={a.platform!} className="flex justify-between gap-2"><span className="text-nv-text-primary">{a.platform}</span><span className="text-nv-text-secondary">{a.done ? "invite sent" : a.via === "cleared" ? "un-picked" : a.via}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* visits */}
        <div className="nv-glass rounded-nv-lg p-5">
          <p className="nv-section-label mb-3">Visits ({s.visits.length})</p>
          {!s.visits.length ? <p className="text-sm text-nv-text-muted">Nobody has opened the link yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-nv-text-muted border-b border-white/5">
                  <th className="py-2 pr-3 font-normal">When</th><th className="py-2 pr-3 font-normal">Device</th><th className="py-2 pr-3 font-normal">Time</th><th className="py-2 pr-3 font-normal">Scrolled</th><th className="py-2 pr-3 font-normal">Got as far as</th><th className="py-2 pr-3 font-normal">Did</th><th className="py-2 font-normal">From</th>
                </tr></thead>
                <tbody>
                  {s.visits.map((v) => (
                    <tr key={v.id} className="border-b border-white/5">
                      <td className="py-2 pr-3 text-nv-text-primary whitespace-nowrap">{when(v.start)}{v.returning && <span className="ml-1 text-[10px] text-nv-teal">return</span>}</td>
                      <td className="py-2 pr-3 text-nv-text-secondary whitespace-nowrap">{v.deviceLabel}</td>
                      <td className="py-2 pr-3 font-mono text-nv-text-primary">{dur(v.seconds)}</td>
                      <td className="py-2 pr-3 font-mono text-nv-text-secondary">{v.maxScroll}%</td>
                      <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${GROUP[v.furthestGroup]}`}>{v.furthest}</span></td>
                      <td className="py-2 pr-3 text-nv-text-secondary whitespace-nowrap">{[v.calcPlays && `calc ×${v.calcPlays}`, v.accessChoices && `access ×${v.accessChoices}`].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="py-2 text-nv-text-muted truncate max-w-[180px]">{v.referrer ? v.referrer.replace(/^https?:\/\//, "") : "direct / text"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* stream */}
        <details className="nv-glass rounded-nv-lg p-5">
          <summary className="nv-section-label cursor-pointer flex items-center gap-1.5"><Activity size={13} /> Raw event stream (last {s.stream.length})</summary>
          <ul className="mt-3 space-y-0.5 font-mono text-[11px] text-nv-text-secondary max-h-80 overflow-y-auto">
            {s.stream.map((e, i) => (
              <li key={i} className="flex gap-3"><span className="text-nv-text-muted shrink-0">{when(e.t)}</span><span className="text-nv-teal shrink-0">{e.event}</span><span className="truncate">{e.section || ""} {e.meta && Object.keys(e.meta).length ? JSON.stringify(e.meta) : ""}</span></li>
            ))}
          </ul>
        </details>
      </div>
    </AppShell>
  );
}

function Tile({ icon: Icon, label, value, sub, small }: { icon: React.ElementType; label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div className="nv-glass rounded-nv-lg p-4">
      <p className="text-[11px] uppercase tracking-wider text-nv-text-muted flex items-center gap-1.5"><Icon size={12} /> {label}</p>
      <p className={`mt-1 font-display font-bold text-nv-text-primary ${small ? "text-base leading-snug" : "text-2xl tabular-nums"}`}>{value}</p>
      {sub && <p className="text-[11px] text-nv-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function K({ k, v, hi }: { k: string; v: string; hi?: boolean }) {
  return (
    <div className="rounded-md bg-nv-deep/60 border border-white/5 px-2 py-1.5">
      <p className="text-nv-text-muted text-[10px]">{k}</p>
      <p className={`font-mono ${hi ? "text-nv-teal" : "text-nv-text-primary"}`}>{v}</p>
    </div>
  );
}
