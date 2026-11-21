"use client";

import { useState } from "react";
import AppShell from "@/components/admin/AppShell";
import { BarChart3, Loader2, RefreshCw, Globe, Smartphone, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadSaved, fetchJson } from "@/lib/admin/cache";
import { useEffect, useCallback } from "react";

type Resp = {
  site: string;
  days: number;
  totals: { visits: number; uniqueSessions: number; visits7d: number; uniqueSessions7d: number };
  daily: { date: string; count: number }[];
  pages: { path: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  devices: { device: string; count: number; pct: number }[];
  funnel: { visits: number; leads: number; orders: number } | null;
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4", className)}>{children}</div>
);

export default function AnalyticsPage() {
  const [site, setSite] = useState<"nexavisiongroup" | "nexaphone">("nexavisiongroup");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const key = `analytics:${site}`;
    const r = await loadSaved<Resp>(key, () => fetchJson<Resp>(`/api/admin/analytics?site=${site}&days=30`, { cache: "no-store" }),
      (j) => { setData(j); setLoading(false); });
    if (!r.ok) setErr(r.hadCache ? `Could not refresh (${r.error}) — showing the saved copy.` : r.error || "Failed to load");
    setLoading(false);
  }, [site]);

  useEffect(() => {
    load();
  }, [load]);

  const maxDaily = data?.daily.length ? Math.max(...data.daily.map((d) => d.count), 1) : 1;

  return (
    <AppShell title="Analytics">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-display font-semibold text-nv-text-primary">Analytics</h1>
            <p className="text-sm text-nv-text-muted">Traffic for nexavisiongroup.com and nexaphone.com — last 30 days</p>
          </div>
          <button onClick={load} className="p-2 rounded-nv-md border border-white/10 text-nv-text-muted hover:text-nv-teal" aria-label="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {([
            { key: "nexavisiongroup" as const, label: "nexavisiongroup.com", icon: Globe },
            { key: "nexaphone" as const, label: "nexaphone.com", icon: ShoppingBag },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setSite(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm border",
                site === t.key ? "bg-nv-teal/15 border-nv-teal/40 text-nv-teal" : "border-white/10 text-nv-text-muted"
              )}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {err && <p className="text-sm text-nv-error mb-3">{err}</p>}

        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-nv-teal" />
          </div>
        ) : !data || data.totals.visits === 0 ? (
          <Card>
            <div className="flex flex-col items-center text-center py-10">
              <BarChart3 size={28} className="text-nv-info mb-3" />
              <p className="text-nv-text-primary font-medium">No visits recorded yet</p>
              <p className="text-nv-text-muted text-sm mt-1 max-w-md">
                The tracking beacon is live on every page — data appears here as soon as someone visits {site === "nexaphone" ? "nexaphone.com" : "nexavisiongroup.com"}.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <p className="text-xs text-nv-text-muted">Visits (30d)</p>
                <p className="text-2xl font-display font-semibold text-nv-teal">{data.totals.visits}</p>
              </Card>
              <Card>
                <p className="text-xs text-nv-text-muted">Unique sessions (30d)</p>
                <p className="text-2xl font-display font-semibold text-nv-text-primary">{data.totals.uniqueSessions}</p>
              </Card>
              <Card>
                <p className="text-xs text-nv-text-muted">Visits (7d)</p>
                <p className="text-2xl font-display font-semibold text-nv-text-primary">{data.totals.visits7d}</p>
              </Card>
              <Card>
                <p className="text-xs text-nv-text-muted">Unique sessions (7d)</p>
                <p className="text-2xl font-display font-semibold text-nv-text-primary">{data.totals.uniqueSessions7d}</p>
              </Card>
            </div>

            {site === "nexaphone" && data.funnel && (
              <Card>
                <p className="text-xs text-nv-text-muted mb-3">Funnel (30d)</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 text-center">
                    <p className="text-xl font-display font-semibold text-nv-text-primary">{data.funnel.visits}</p>
                    <p className="text-nv-text-muted text-xs">Visits</p>
                  </div>
                  <span className="text-nv-text-muted">→</span>
                  <div className="flex-1 text-center">
                    <p className="text-xl font-display font-semibold text-nv-text-primary">{data.funnel.leads}</p>
                    <p className="text-nv-text-muted text-xs">Leads</p>
                  </div>
                  <span className="text-nv-text-muted">→</span>
                  <div className="flex-1 text-center">
                    <p className="text-xl font-display font-semibold text-nv-teal">{data.funnel.orders}</p>
                    <p className="text-nv-text-muted text-xs">Orders</p>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <p className="text-xs text-nv-text-muted mb-3">Daily visits</p>
              <div className="flex items-end gap-1 h-28">
                {data.daily.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                      className="w-full bg-nv-teal/60 rounded-t-sm hover:bg-nv-teal"
                      style={{ height: `${Math.max((d.count / maxDaily) * 100, 3)}%` }}
                      title={`${d.date}: ${d.count}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-nv-text-muted mt-1">
                <span>{data.daily[0]?.date}</span>
                <span>{data.daily[data.daily.length - 1]?.date}</span>
              </div>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <p className="text-xs text-nv-text-muted mb-3">Top pages</p>
                <div className="space-y-1.5">
                  {data.pages.map((p) => (
                    <div key={p.path} className="flex justify-between text-sm gap-2">
                      <span className="text-nv-text-secondary truncate">{p.path}</span>
                      <span className="text-nv-text-primary font-mono text-xs">{p.count}</span>
                    </div>
                  ))}
                  {data.pages.length === 0 && <p className="text-xs text-nv-text-muted">No data</p>}
                </div>
              </Card>
              <Card>
                <p className="text-xs text-nv-text-muted mb-3">Top referrers</p>
                <div className="space-y-1.5">
                  {data.referrers.map((r) => (
                    <div key={r.referrer} className="flex justify-between text-sm gap-2">
                      <span className="text-nv-text-secondary truncate">{r.referrer}</span>
                      <span className="text-nv-text-primary font-mono text-xs">{r.count}</span>
                    </div>
                  ))}
                  {data.referrers.length === 0 && <p className="text-xs text-nv-text-muted">Direct / no external referrers yet</p>}
                </div>
              </Card>
            </div>

            <Card>
              <p className="text-xs text-nv-text-muted mb-3 flex items-center gap-1.5">
                <Smartphone size={13} /> Device breakdown
              </p>
              <div className="flex gap-4">
                {data.devices.map((d) => (
                  <div key={d.device} className="text-center">
                    <p className="text-lg font-display font-semibold text-nv-text-primary">{d.pct}%</p>
                    <p className="text-xs text-nv-text-muted capitalize">{d.device}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
