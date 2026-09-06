import { NextRequest, NextResponse } from "next/server";

// Phone Command Center proxy. Forwards to the rack phonectl backend (behind the nexa
// Cloudflare tunnel) with the server-only bearer token, so the token never reaches the browser.
// Auth to reach THIS route is already enforced by middleware for /api/admin/*.
export const dynamic = "force-dynamic";

const BASE = process.env.PHONE_API_URL || "https://ai.nexavisiongroup.com/pcc";
const TOKEN = process.env.PHONE_API_TOKEN || "";

function backendHeaders(extra?: Record<string, string>) {
  return { Authorization: `Bearer ${TOKEN}`, ...(extra || {}) };
}

// GET /api/admin/devices?path=/devices  (or /op3/stats, /op3/screenshot)
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "/devices";
  if (!/^\/[A-Za-z0-9/_-]*$/.test(path)) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: backendHeaders(),
      cache: "no-store",
    });
    // screenshots come back as PNG — stream them through untouched
    const ctype = r.headers.get("content-type") || "";
    if (ctype.startsWith("image/")) {
      const buf = await r.arrayBuffer();
      return new NextResponse(buf, {
        status: r.status,
        headers: { "Content-Type": ctype, "Cache-Control": "no-store" },
      });
    }
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: `backend unreachable: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
}

// POST /api/admin/devices?path=/op3/cmd   body: { cmd, arg }
export async function POST(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "";
  if (!/^\/[A-Za-z0-9/_-]+$/.test(path)) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: backendHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: `backend unreachable: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
}
