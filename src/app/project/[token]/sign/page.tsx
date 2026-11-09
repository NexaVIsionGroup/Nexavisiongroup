import type { Metadata } from "next";
import { db, linkState, previewKeyOk, syncPaid, toPublic } from "@/lib/proposals/server";
import { ProposalShell, LinkNotice } from "@/components/proposal/ProposalShell";
import { RichProposal } from "@/components/proposal/RichProposal";
import { BUSINESS_NAME } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

type Props = { params: { token: string }; searchParams: { k?: string; pay_error?: string } };

const load = async (token: string) => (await db().from("proposals").select("*").eq("token", token).maybeSingle()).data;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const p = await load(params.token);
  const robots = { index: false, follow: false, nocache: true };
  const ok = previewKeyOk(params.token, searchParams.k) ? !!p : linkState(p) === "ok";
  if (!ok) return { title: { absolute: BUSINESS_NAME }, robots };
  const title = `Service agreement | ${BUSINESS_NAME}`;
  const description = `Your ${p.signed_at ? "signed agreement" : "agreement to review and sign"} with ${BUSINESS_NAME}.`;
  return { title: { absolute: title }, description, robots, openGraph: { title, description } };
}

/** Agreement-only page: plan, price, billing, terms and signature. Same signing and payment flow as the full proposal. */
export default async function SignPage({ params, searchParams }: Props) {
  const row = await load(params.token);
  const preview = previewKeyOk(params.token, searchParams.k);
  if (!preview) {
    const state = linkState(row);
    if (state !== "ok") return <ProposalShell><LinkNotice state={state} /></ProposalShell>;
  }
  if (!row) return <ProposalShell><LinkNotice state="missing" /></ProposalShell>;
  const p = toPublic(preview ? row : await syncPaid(row));
  const fullHref = preview ? `/preview/${params.token}?k=${searchParams.k}` : `/project/${params.token}`;
  return (
    <ProposalShell rich>
      <RichProposal proposal={p} token={params.token} preview={preview} share={preview} contract fullHref={fullHref} pdfHref={`/api/project/${params.token}/pdf?view=1${preview ? `&k=${searchParams.k}` : ""}`} from="sign" payError={searchParams.pay_error === "1"} />
    </ProposalShell>
  );
}
