import { NextResponse } from "next/server";
import { db, linkState } from "@/lib/proposals/server";
import { renderProposalPdf } from "@/lib/proposals/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const { data: p } = await db().from("proposals").select("*").eq("token", params.token).maybeSingle();
  if (linkState(p) !== "ok") return NextResponse.json({ error: "Not available" }, { status: 404 });
  let pdf: Buffer;
  try {
    pdf = await renderProposalPdf(p);
  } catch (e) {
    console.error("[proposal pdf]", e);
    return NextResponse.json({ error: "We could not make the PDF. Try again in a minute.", detail: e instanceof Error ? e.message.slice(0, 300) : "" }, { status: 500 });
  }
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${p.number}${p.signed_at ? "-signed" : ""}.pdf"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
