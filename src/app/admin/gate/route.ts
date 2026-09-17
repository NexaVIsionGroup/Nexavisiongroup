import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Login-gated token minter for the `nexa-gate` Cloudflare Worker that fronts
// term.nexavisiongroup.com (rack ttyd root shell) and phone.nexavisiongroup.com
// (OP3 live view). Lives under /admin/* so the Supabase middleware BOUNCES
// logged-out users to /admin/login (rendered in the iframe) and only lets a
// logged-in admin reach this handler. It mints a short-lived HMAC token and
// redirects back to the subdomain; the Worker verifies it (shared GATE_SECRET)
// and drops a first-party gate cookie there. No cross-subdomain cookie needed.
export const dynamic = "force-dynamic";

const ALLOWED = /^https:\/\/(term|phone)\.nexavisiongroup\.com(?:[/?]|$)/;

export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") || "";
  if (!ALLOWED.test(next)) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  const secret = process.env.GATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "gate not configured" }, { status: 500 });
  }

  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 120 }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

  const dest = new URL(next);
  dest.searchParams.set("nexatoken", `${payload}.${sig}`);
  return NextResponse.redirect(dest.toString());
}
