import { NextResponse } from "next/server";
import { db, emailProposal, logEvent, shortUrl } from "@/lib/proposals/server";

export const dynamic = "force-dynamic";

/** Publishes the link. With { email: true } it also emails the customer. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => ({}));
  const supabase = db();
  const { data: p } = await supabase.from("proposals").select("*").eq("id", params.id).maybeSingle();
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (b.email) {
    try {
      await emailProposal(p);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "The email could not be sent." }, { status: 400 });
    }
  }
  // updated_at stays put: publishing must not invalidate a page the customer already has open.
  const patch: Record<string, unknown> = {};
  if (!p.sent_at) patch.sent_at = new Date().toISOString();
  if (p.status === "draft") patch.status = "sent";
  if (Object.keys(patch).length) await supabase.from("proposals").update(patch).eq("id", p.id);
  await logEvent(p.id, b.email ? "emailed" : "link_published", undefined, b.email ? { to: p.client_email } : {});
  return NextResponse.json({ ok: true, url: shortUrl(p.token), status: (patch.status as string) || p.status });
}
