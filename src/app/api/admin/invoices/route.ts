import { NextResponse } from "next/server";
import { createHmac } from "crypto";

// Admin: Nexa invoices. They're created and paid on JHPS (jhpsfl.com handles Square/Stripe),
// so we read them from JHPS over the same HMAC-signed link the store checkout uses.
// Auth for this route is enforced by middleware (/api/admin/*).
export const dynamic = "force-dynamic";

export async function GET() {
  const secret = process.env.NEXA_ORDER_SECRET;
  const base = process.env.JHPS_BASE_URL;
  if (!secret || !base) return NextResponse.json({ error: "JHPS link not configured (NEXA_ORDER_SECRET / JHPS_BASE_URL)" }, { status: 500 });

  const ts = String(Math.floor(Date.now() / 1000));
  const sig = "sha256=" + createHmac("sha256", secret).update(`${ts}.nexa-invoices`).digest("hex");
  try {
    const r = await fetch(`${base}/api/external/nexa-invoices`, {
      headers: { "X-Nexa-Timestamp": ts, "X-Nexa-Signature": sig },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json();
    if (!r.ok) return NextResponse.json({ error: j.error || `JHPS ${r.status}` }, { status: 502 });
    return NextResponse.json(j);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "JHPS unreachable" }, { status: 502 });
  }
}

// Create / email / get link / delete — forwarded to JHPS, signed over the raw body.
export async function POST(req: Request) {
  const secret = process.env.NEXA_ORDER_SECRET;
  const base = process.env.JHPS_BASE_URL;
  if (!secret || !base) return NextResponse.json({ error: "JHPS link not configured (NEXA_ORDER_SECRET / JHPS_BASE_URL)" }, { status: 500 });

  let body: string;
  try {
    const parsed = await req.json();
    if (!["create", "send", "link", "delete"].includes(parsed?.action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    body = JSON.stringify(parsed);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = "sha256=" + createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  try {
    const r = await fetch(`${base}/api/external/nexa-invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Nexa-Timestamp": ts, "X-Nexa-Signature": sig },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    const j = await r.json();
    return NextResponse.json(j, { status: r.ok ? r.status : r.status === 401 ? 502 : r.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "JHPS unreachable" }, { status: 502 });
  }
}
