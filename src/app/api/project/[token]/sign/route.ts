import { NextResponse } from "next/server";
import { clientIp, contentVersion, db, emailSignedCopy, fingerprint, linkState, logEvent } from "@/lib/proposals/server";
import { renderProposalPdf } from "@/lib/proposals/pdf";
import { notifyAdmin } from "@/lib/notify";
import { defaultPackage, dueAtSigning, money, normalizeContent } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Agree and sign. One signature, then the signed version is locked for good. */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 120);
  const title = String(body.title || "").trim().slice(0, 120);
  const sig = String(body.signature_data || "");
  if (name.length < 2) return NextResponse.json({ error: "Type your full name." }, { status: 400 });
  if (body.agreed !== true) return NextResponse.json({ error: "Check the box to agree to the terms." }, { status: 400 });
  if (!sig.startsWith("data:image/png;base64,") || sig.length < 500) return NextResponse.json({ error: "Draw your signature in the box." }, { status: 400 });
  if (sig.length > 400_000) return NextResponse.json({ error: "That signature is too large. Clear it and sign again." }, { status: 400 });

  const supabase = db();
  const { data: p } = await supabase.from("proposals").select("*").eq("token", params.token).maybeSingle();
  const state = linkState(p);
  if (state === "missing") return NextResponse.json({ error: "This proposal could not be found." }, { status: 404 });
  if (state === "paused") return NextResponse.json({ error: "This proposal is paused. Please contact us." }, { status: 423 });
  if (state === "expired") return NextResponse.json({ error: "This proposal has expired. Please contact us for a new one." }, { status: 410 });
  if (p.signed_at) return NextResponse.json({ error: "This proposal has already been signed." }, { status: 409 });
  if (p.status === "declined") return NextResponse.json({ error: "This proposal is closed. Please contact us." }, { status: 409 });
  // They must sign the version they actually read.
  if (body.version !== p.updated_at && body.version !== contentVersion(p.content)) return NextResponse.json({ error: "We updated this proposal after you opened it. Reload the page to see the latest version.", reload: true }, { status: 409 });

  const content = normalizeContent(p.content);
  const pkg = content.packages.length ? content.packages.find((x) => x.id === body.package_id) || null : null;
  if (content.packages.length && !pkg) return NextResponse.json({ error: "Choose a package first." }, { status: 400 });
  const due = dueAtSigning(content, pkg || defaultPackage(content));
  // Automatic monthly billing is a choice only when the proposal offers it, and then it must be made.
  const offerAutopay = !!content.payment.autopay?.offer;
  if (offerAutopay && typeof body.autopay !== "boolean") return NextResponse.json({ error: "Choose how you'd like to pay your monthly invoices." }, { status: 400 });
  const autopay_opt_in: boolean | null = offerAutopay ? body.autopay === true : null;

  const signed_at = new Date().toISOString();
  const snapshot = {
    number: p.number, title: p.title,
    client: { name: p.client_name, company: p.client_company, email: p.client_email, phone: p.client_phone },
    content, selected_package_id: pkg?.id || null, due_amount: due, autopay_opt_in,
  };
  const { data: updated, error } = await supabase
    .from("proposals")
    .update({
      status: "signed", signed_at, signed_name: name, signed_title: title || null, signature_data: sig,
      signer_ip: clientIp(req), signer_user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
      signed_snapshot: snapshot, signed_hash: fingerprint(snapshot),
      selected_package_id: pkg?.id || null, due_amount: due, expires_at: null, updated_at: signed_at,
    })
    .eq("id", p.id)
    .is("signed_at", null)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "We could not save your signature. Please try again." }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "This proposal has already been signed." }, { status: 409 });

  await logEvent(p.id, "signed", req, { name, package: pkg?.name, due, hash: updated.signed_hash, autopay: autopay_opt_in });
  if (p.customer_id) await supabase.from("customers").update({ customer_type: "active" }).eq("id", p.customer_id);
  const autopayNote = autopay_opt_in === null ? "" : autopay_opt_in ? " Chose automatic monthly billing: set up their card on file." : " Declined automatic billing: invoice monthly.";
  await notifyAdmin({
    type: "proposal",
    title: `🎉 Signed: ${p.client_company || p.client_name || p.title}`,
    message: `${name} signed ${p.number}${pkg ? ` (${pkg.name})` : ""}${due > 0 ? `. ${money(due)} due now.` : "."}${autopayNote}`,
    url: `/admin/proposals/${p.id}`, entityType: "proposal", entityId: p.id,
  });

  // The signature is already saved, so an email or PDF problem must not undo it.
  try {
    const pdf = await renderProposalPdf(updated).catch((e) => { console.error("[proposal pdf]", e); return null; });
    await emailSignedCopy(updated, pdf);
    await logEvent(p.id, "signed_copy_emailed", undefined, { pdf: !!pdf });
  } catch (e) {
    console.error("[proposal signed email]", e);
    await logEvent(p.id, "signed_copy_failed", undefined, { error: e instanceof Error ? e.message : "unknown" });
  }

  return NextResponse.json({ signed: true, due });
}
