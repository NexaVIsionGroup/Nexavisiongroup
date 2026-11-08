import { NextResponse } from "next/server";
import { db, ensureInvoice, ensureSubscription, linkState, logEvent, projectUrl, syncPaid } from "@/lib/proposals/server";

export const dynamic = "force-dynamic";

/** After signing: one card form that pays what's due and saves the card for monthly billing. */
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const { data: row } = await db().from("proposals").select("*").eq("token", params.token).maybeSingle();
  const p = row?.signed_at ? await syncPaid(row) : row;
  if (linkState(p) !== "ok" || !p.signed_at || p.signed_snapshot?.autopay_opt_in !== true) {
    return NextResponse.redirect(projectUrl(params.token), 303);
  }
  try {
    let dueInvoice: string | null = p.invoice_number || null;
    if (Number(p.due_amount) > 0 && !p.paid_at && !dueInvoice) {
      await ensureInvoice(p);
      const { data: fresh } = await db().from("proposals").select("invoice_number").eq("id", p.id).single();
      dueInvoice = fresh?.invoice_number || null;
    }
    const sub = await ensureSubscription(p, dueInvoice);
    await logEvent(p.id, "card_link_opened", req);
    return NextResponse.redirect(sub.card_url, 303);
  } catch (e) {
    console.error("[proposal card]", e);
    await logEvent(p.id, "card_link_failed", req, { error: e instanceof Error ? e.message : "unknown" });
    return NextResponse.redirect(`${projectUrl(params.token)}?pay_error=1`, 303);
  }
}
