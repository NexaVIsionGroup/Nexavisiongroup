import { NextResponse } from "next/server";
import { db, ensureSubscription, linkState, logEvent, projectUrl } from "@/lib/proposals/server";

export const dynamic = "force-dynamic";

/** The customer's "save your card" button: sets up automatic billing the first time, then opens the secure card page. */
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const { data: p } = await db().from("proposals").select("*").eq("token", params.token).maybeSingle();
  if (linkState(p) !== "ok" || !p.signed_at || p.signed_snapshot?.autopay_opt_in !== true) {
    return NextResponse.redirect(projectUrl(params.token), 303);
  }
  try {
    const sub = await ensureSubscription(p);
    await logEvent(p.id, "card_link_opened", req);
    return NextResponse.redirect(sub.card_url, 303);
  } catch (e) {
    console.error("[proposal card]", e);
    await logEvent(p.id, "card_link_failed", req, { error: e instanceof Error ? e.message : "unknown" });
    return NextResponse.redirect(`${projectUrl(params.token)}?pay_error=1`, 303);
  }
}
