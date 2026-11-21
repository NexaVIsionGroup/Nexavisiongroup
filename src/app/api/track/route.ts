import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Public pageview beacon — intentionally outside /api/admin so middleware never gates it.
// Low volume, no PII: path/referrer/UTM + a per-tab session id, device class from UA, country from Vercel's geo header.
export const dynamic = "force-dynamic";

const SITES = new Set(["nexavisiongroup", "nexaphone"]);
// Our own tools, not public traffic (owner uses the admin app all day; it swamped the numbers).
const PRIVATE_PATH = /^\/(admin|vm|studio)(\/|$)/;
const trunc = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : null);

function deviceFromUA(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet(?!.*mobile)/.test(s)) return "tablet";
  if (/mobi|iphone|android/.test(s)) return "mobile";
  return "desktop";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const site = typeof body.site === "string" && SITES.has(body.site) ? body.site : null;
  const sessionId = trunc(body.session_id, 100);
  if (!site || !sessionId) return NextResponse.json({ error: "missing site/session_id" }, { status: 400 });
  const path = trunc(body.path, 500) || "/";
  if (PRIVATE_PATH.test(path)) return new NextResponse(null, { status: 204 });

  const ua = req.headers.get("user-agent") || "";
  const country = req.headers.get("x-vercel-ip-country") || null;

  const db = createAdminClient();
  const { error } = await db.from("site_visits").insert({
    site,
    path,
    referrer: trunc(body.referrer, 500),
    utm_source: trunc(body.utm_source, 200),
    utm_medium: trunc(body.utm_medium, 200),
    utm_campaign: trunc(body.utm_campaign, 200),
    session_id: sessionId,
    device: deviceFromUA(ua),
    country,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
