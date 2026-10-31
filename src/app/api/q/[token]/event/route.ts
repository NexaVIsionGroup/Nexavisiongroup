import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// PUBLIC analytics sink for /q/[token]. The browser batches what the client
// does (sections seen, calculator plays, access choices, time on page) and
// posts it here; /admin/questionnaires/[id]/stats reads it back.
// Body: { visit, device?, ua?, referrer?, screen?, tz?, events: [{ e, s?, m?, t? }] }

export const dynamic = "force-dynamic";

type Ctx = { params: { token: string } };

const EVENTS = new Set(["visit", "view", "calc", "zone", "start", "step", "access", "send", "end", "back"]);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray(body.events)) return NextResponse.json({ ok: false }, { status: 400 });
  const visit = str(body.visit, 40);
  if (!visit) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase.from("client_questionnaires").select("id, status").eq("token", params.token).maybeSingle();
  if (!row || row.status === "archived") return NextResponse.json({ ok: false }, { status: 404 });

  const rows = (body.events as any[])
    .slice(0, 60)
    .filter((ev) => ev && EVENTS.has(ev.e))
    .map((ev) => ({
      questionnaire_id: row.id,
      visit,
      device: str(body.device, 40),
      event: ev.e,
      section: str(ev.s, 80),
      meta: ev.m && typeof ev.m === "object" ? JSON.parse(JSON.stringify(ev.m).slice(0, 2000)) : {},
      ua: str(body.ua, 300),
      referrer: str(body.referrer, 300),
      screen: str(body.screen, 20),
      tz: str(body.tz, 60),
      created_at: typeof ev.t === "number" && Math.abs(Date.now() - ev.t) < 36e5 ? new Date(ev.t).toISOString() : new Date().toISOString(),
    }));
  if (!rows.length) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("questionnaire_events").insert(rows);
  if (error) console.error("questionnaire_events insert", error.message);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
