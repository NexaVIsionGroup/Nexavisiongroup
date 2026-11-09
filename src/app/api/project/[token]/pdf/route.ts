import { NextResponse } from "next/server";
import { db, linkState, previewKeyOk, shortUrl } from "@/lib/proposals/server";
import { renderAgreementPdf, renderProposalPdf } from "@/lib/proposals/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * The service agreement as a PDF (default), or the whole proposal with ?doc=full.
 * ?view=1 opens it in the browser instead of downloading. ?k=<preview key> works for drafts and paused links.
 */
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const q = new URL(req.url).searchParams;
  const { data: p } = await db().from("proposals").select("*").eq("token", params.token).maybeSingle();
  if (!p || (!previewKeyOk(params.token, q.get("k")) && linkState(p) !== "ok")) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const full = q.get("doc") === "full";
  let pdf: Buffer;
  try {
    pdf = full ? await renderProposalPdf(p) : await renderAgreementPdf(p, { link: shortUrl(p.token).replace(/^https?:\/\//, "") });
  } catch (e) {
    console.error("[proposal pdf]", e);
    return NextResponse.json({ error: "We could not make the PDF. Try again in a minute.", detail: e instanceof Error ? e.message.slice(0, 300) : "" }, { status: 500 });
  }
  const name = `${full ? "Proposal" : "Service-Agreement"}-${p.number}${p.signed_at ? "-signed" : ""}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${q.get("view") ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
