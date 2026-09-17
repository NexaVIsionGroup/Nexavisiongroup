import { NextResponse } from "next/server";

// Session probe for the `nexa-gate` Cloudflare Worker that fronts
// term.nexavisiongroup.com (rack ttyd root shell) and phone.nexavisiongroup.com
// (OP3 live view). The Worker forwards the visitor's cookies here; the admin
// middleware answers 401 when there is no valid Supabase admin session, so a
// 200 from this route is the ONLY thing that lets a request through to those
// hosts. Deliberately does nothing else — it must stay under /api/admin/ (and
// NOT under /api/admin/auth/, which the middleware exempts).
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
