import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { NV_COOKIE, userFrom, trialState, TRIAL_ENDED, db } from "@/lib/nexavideo";

// Nexa Video web app (iPhone / Safari) → catalogue backend on the rack (nvweb, via the nexa tunnel at
// NVWEB_URL = https://ai.nexavisiongroup.com/pcc/nv). The rack has to do the fetching (goojara blocks datacenter
// IPs); this route only checks the account and passes the viewer's own User-Agent + Accept-Language for stream
// lookups — lulu tokens are bound to both, then the phone plays the HLS itself.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROUTES = new Set(["home", "chart", "search", "title", "season", "play", "trailer"]);
const CACHE: Record<string, string> = { home: "private, max-age=300", chart: "private, max-age=1800", search: "private, max-age=600", title: "private, max-age=600", season: "private, max-age=600" };

export async function GET(req: NextRequest, { params }: { params: { p: string[] } }) {
  const route = params.p?.[0] || "";
  if (!ROUTES.has(route)) return NextResponse.json({ error: "no route" }, { status: 404 });
  const u = await userFrom((await cookies()).get(NV_COOKIE)?.value);
  if (!u) return NextResponse.json({ error: "signed_out" }, { status: 401 });
  if (trialState(u).expired) return NextResponse.json({ error: TRIAL_ENDED, code: "trial_expired" }, { status: 401 });

  const q = new URLSearchParams(req.nextUrl.searchParams);
  if (route === "play") {
    q.set("ua", req.headers.get("user-agent") || "");
    q.set("lang", req.headers.get("accept-language") || "en-US,en;q=0.9");
    db().from("nexavideo_users").update({ last_seen_at: new Date().toISOString(), device: "web: " + (req.headers.get("user-agent") || "").slice(0, 70) }).eq("id", u.id).then(() => {}, () => {});
  }
  try {
    const r = await fetch(`${process.env.NVWEB_URL}/${route}?${q}`, {
      headers: { Authorization: `Bearer ${process.env.NVWEB_TOKEN}` }, cache: "no-store", signal: AbortSignal.timeout(55000),
    });
    const body = await r.text();
    return new NextResponse(body, {
      status: r.ok ? 200 : 502,
      headers: { "Content-Type": "application/json", "Cache-Control": r.ok && CACHE[route] ? CACHE[route] : "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Nexa is offline right now — try again in a minute." }, { status: 502 });
  }
}
