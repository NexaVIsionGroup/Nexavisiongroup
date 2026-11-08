import { NextResponse } from "next/server";
import { db, ensureInvoice, linkState, logEvent, projectUrl, syncPaid } from "@/lib/proposals/server";

export const dynamic = "force-dynamic";

/** The customer's Pay button: creates the invoice the first time, then sends them to pay it. */
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const { data: row } = await db().from("proposals").select("*").eq("token", params.token).maybeSingle();
  if (linkState(row) !== "ok" || !row.signed_at || !(Number(row.due_amount) > 0)) {
    return NextResponse.redirect(projectUrl(params.token), 303);
  }
  const p = await syncPaid(row);
  if (p.paid_at) return NextResponse.redirect(projectUrl(params.token), 303);
  try {
    const url = await ensureInvoice(p);
    await logEvent(p.id, "pay_clicked", req);
    return NextResponse.redirect(url, 303);
  } catch (e) {
    console.error("[proposal pay]", e);
    await logEvent(p.id, "pay_failed", req, { error: e instanceof Error ? e.message : "unknown" });
    return NextResponse.redirect(`${projectUrl(params.token)}?pay_error=1`, 303);
  }
}
