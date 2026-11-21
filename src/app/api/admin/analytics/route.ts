import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Visit = { site: string; path: string; referrer: string | null; device: string | null; session_id: string; created_at: string };

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function sameSiteReferrer(ref: string, site: string) {
  const host = site === "nexaphone" ? "nexaphone.com" : "nexavisiongroup.com";
  return ref.includes(host);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const site = searchParams.get("site") === "nexaphone" ? "nexaphone" : "nexavisiongroup";
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 90);

  const db = createAdminClient();
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const { data: rows, error } = await db
    .from("site_visits")
    .select("site,path,referrer,device,session_id,created_at")
    .eq("site", site)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const visits = (rows || []) as Visit[];
  const now = Date.now();
  const last7 = visits.filter((v) => now - new Date(v.created_at).getTime() <= 7 * 86400_000);
  const uniq = (list: Visit[]) => new Set(list.map((v) => v.session_id)).size;

  const byDay = new Map<string, number>();
  for (const v of visits) byDay.set(dayKey(v.created_at), (byDay.get(dayKey(v.created_at)) || 0) + 1);
  const daily = [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));

  const topPages = new Map<string, number>();
  for (const v of visits) topPages.set(v.path, (topPages.get(v.path) || 0) + 1);
  const pages = [...topPages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }));

  const topRefs = new Map<string, number>();
  for (const v of visits) {
    if (!v.referrer) continue;
    if (sameSiteReferrer(v.referrer, site)) continue;
    let host = v.referrer;
    try { host = new URL(v.referrer).hostname; } catch { /* keep raw */ }
    topRefs.set(host, (topRefs.get(host) || 0) + 1);
  }
  const referrers = [...topRefs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([referrer, count]) => ({ referrer, count }));

  const deviceCounts = new Map<string, number>();
  for (const v of visits) deviceCounts.set(v.device || "unknown", (deviceCounts.get(v.device || "unknown") || 0) + 1);
  const devices = [...deviceCounts.entries()].map(([device, count]) => ({ device, count, pct: visits.length ? Math.round((count / visits.length) * 100) : 0 }));

  let funnel: { visits: number; leads: number; orders: number } | null = null;
  if (site === "nexaphone") {
    const [leads, orders] = await Promise.all([
      db.from("nexaphone_leads").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("nexaphone_orders").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    funnel = { visits: visits.length, leads: leads.count || 0, orders: orders.count || 0 };
  }

  return NextResponse.json({
    site,
    days,
    totals: { visits: visits.length, uniqueSessions: uniq(visits), visits7d: last7.length, uniqueSessions7d: uniq(last7) },
    daily,
    pages,
    referrers,
    devices,
    funnel,
  });
}
