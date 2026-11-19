import { NextResponse } from "next/server";
import { db, ensureInvoice, ensureSubscription, logEvent, syncPaid } from "@/lib/proposals/server";
import { defaultPackage, dueAtSigning, normalizeContent } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

/**
 * Admin only (behind /api/admin): open the card form BEFORE the customer signs.
 * It pays what's due at signing and saves the card for automatic monthly billing,
 * so the customer only has to sign afterwards. Signing then skips the payment step.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const back = (msg: string) => NextResponse.redirect(new URL(`/admin/proposals/${params.id}?card_first=${encodeURIComponent(msg)}`, req.url), 303);
  const { data: row } = await db().from("proposals").select("*").eq("id", params.id).maybeSingle();
  if (!row) return back("Proposal not found.");
  if (row.signed_at) return back("Already signed. Use the billing panel instead.");
  const content = normalizeContent(row.content);
  if (!content.payment.autopay?.offer) return back("This proposal doesn't use automatic monthly billing.");
  const pkg = content.packages.find((x) => x.id === row.selected_package_id) || defaultPackage(content);
  const due = dueAtSigning(content, pkg);
  try {
    if (row.due_amount !== due || row.selected_package_id !== (pkg?.id || null)) {
      await db().from("proposals").update({ due_amount: due, selected_package_id: pkg?.id || null }).eq("id", row.id);
    }
    let p = await syncPaid({ ...row, due_amount: due, selected_package_id: pkg?.id || null });
    let dueInvoice: string | null = p.invoice_number || null;
    if (due > 0 && !p.paid_at && !dueInvoice) {
      await ensureInvoice(p);
      const { data: fresh } = await db().from("proposals").select("invoice_number").eq("id", p.id).single();
      dueInvoice = fresh?.invoice_number || null;
    }
    const sub = await ensureSubscription(p, dueInvoice);
    await logEvent(p.id, "card_first_opened", req, { due });
    return NextResponse.redirect(sub.card_url, 303);
  } catch (e) {
    console.error("[proposal card-first]", e);
    return back(e instanceof Error ? e.message : "Could not open the card form.");
  }
}
