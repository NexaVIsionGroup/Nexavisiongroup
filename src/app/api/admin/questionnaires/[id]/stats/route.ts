import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/questionnaires";

// Admin (middleware-protected): everything a client did on their link, from
// questionnaire_events, rolled up per visit and as a funnel.

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

interface Ev { visit: string; device: string | null; event: string; section: string | null; meta: any; ua: string | null; referrer: string | null; screen: string | null; tz: string | null; created_at: string }

function deviceLabel(ua: string | null, screen: string | null): string {
  const u = ua || "";
  const os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac OS/.test(u) ? "Mac" : /CrOS/.test(u) ? "Chromebook" : "Unknown";
  const br = /SamsungBrowser/.test(u) ? "Samsung" : /EdgA?\//.test(u) ? "Edge" : /CriOS|Chrome\//.test(u) ? "Chrome" : /FxiOS|Firefox/.test(u) ? "Firefox" : /Safari/.test(u) ? "Safari" : "";
  const w = Number((screen || "").split("x")[0]);
  const size = w ? (w < 700 ? "phone" : w < 1100 ? "tablet" : "desktop") : "";
  return [os, br, size && `(${size})`].filter(Boolean).join(" ");
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createAdminClient();
  const { data: q } = await supabase.from("client_questionnaires").select("id, template, title, client_name, status, open_count, created_at, submitted_at, answers").eq("id", params.id).maybeSingle();
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data } = await supabase.from("questionnaire_events").select("visit, device, event, section, meta, ua, referrer, screen, tz, created_at").eq("questionnaire_id", params.id).order("created_at", { ascending: true }).limit(8000);
  const events = (data || []) as Ev[];
  const t = getTemplate(q.template);

  // ── milestones in page order ──
  const briefing = [
    ["hero", "Opened the page"], ["facts", "Saw the quick facts"], ["found", "Reached “What we found”"],
    ...t.brief ? t.brief.findings.map((f) => [`finding:${f.id}`, f.title] as [string, string]) : [],
    ["money", "Savings calculator"], ["build", "What we'd build"], ["promise", "Our promise"], ["final", "Bottom of the page"],
  ] as [string, string][];
  const steps = [...t.sections.map((s) => [s.id, s.short] as [string, string]), ["review", "Review & send"]];
  const order: { key: string; label: string; group: "briefing" | "setup" | "sent" }[] = [
    ...briefing.map(([key, label]) => ({ key: `view:${key}`, label, group: "briefing" as const })),
    { key: "start", label: "Started setup", group: "setup" },
    ...steps.map(([key, label]) => ({ key: `step:${key}`, label, group: "setup" as const })),
    { key: "send", label: "Sent it in", group: "sent" },
  ];
  const rank = new Map(order.map((o, i) => [o.key, i]));
  const keyOf = (e: Ev) => (e.event === "view" || e.event === "step" ? `${e.event}:${e.section}` : e.event);

  // ── per visit ──
  const byVisit = new Map<string, Ev[]>();
  for (const e of events) { if (!byVisit.has(e.visit)) byVisit.set(e.visit, []); byVisit.get(e.visit)!.push(e); }
  const visits = Array.from(byVisit.entries()).map(([id, evs]) => {
    const first = evs[0], last = evs[evs.length - 1];
    const ends = evs.filter((e) => e.event === "end");
    const seconds = ends.length ? ends.reduce((a, e) => a + Number(e.meta?.seconds || 0), 0) : Math.round((new Date(last.created_at).getTime() - new Date(first.created_at).getTime()) / 1000);
    const maxScroll = Math.max(0, ...ends.map((e) => Number(e.meta?.maxScroll || 0)));
    let far = -1;
    for (const e of evs) { const r = rank.get(keyOf(e)); if (r != null && r > far) far = r; }
    const reached = new Set(evs.map(keyOf));
    return {
      id, start: first.created_at, end: last.created_at, seconds, maxScroll,
      device: first.device, deviceLabel: deviceLabel(first.ua, first.screen), screen: first.screen, referrer: first.referrer, tz: first.tz,
      returning: !!first.meta?.returning, events: evs.length,
      furthest: far >= 0 ? order[far].label : "Opened", furthestGroup: far >= 0 ? order[far].group : "briefing",
      calcPlays: evs.filter((e) => e.event === "calc").length,
      accessChoices: evs.filter((e) => e.event === "access").length,
      reached: Array.from(reached),
    };
  }).sort((a, b) => b.start.localeCompare(a.start));

  // ── funnel: how many visits reached each milestone ──
  const funnel = order.map((o) => ({ ...o, visits: visits.filter((v) => v.reached.includes(o.key)).length }));

  // ── calculator, zone, access ──
  const calc = events.filter((e) => e.event === "calc").map((e) => ({ t: e.created_at, ...e.meta }));
  const zone: Record<string, number> = {};
  for (const e of events) if (e.event === "zone" && e.meta?.radius != null) zone[String(e.meta.radius)] = (zone[String(e.meta.radius)] || 0) + 1;
  const access = events.filter((e) => e.event === "access").map((e) => ({ t: e.created_at, platform: e.section, ...e.meta }));

  const devices = new Set(visits.map((v) => v.device || v.id));
  const totalSeconds = visits.reduce((a, v) => a + v.seconds, 0);
  return NextResponse.json({
    questionnaire: { id: q.id, title: q.title, client_name: q.client_name, status: q.status, open_count: q.open_count, created_at: q.created_at, submitted_at: q.submitted_at },
    totals: {
      visits: visits.length, devices: devices.size, totalSeconds, avgSeconds: visits.length ? Math.round(totalSeconds / visits.length) : 0,
      firstSeen: visits.length ? visits[visits.length - 1].start : null, lastSeen: visits.length ? visits[0].end : null,
      furthest: funnel.filter((f) => f.visits > 0).slice(-1)[0]?.label || null,
    },
    funnel, visits, calc, zone, access,
    stream: events.slice(-120).reverse().map((e) => ({ t: e.created_at, visit: e.visit, event: e.event, section: e.section, meta: e.meta })),
  });
}
