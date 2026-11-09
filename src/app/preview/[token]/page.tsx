import type { Metadata } from "next";
import { db, previewKeyOk, toPublic } from "@/lib/proposals/server";
import { ProposalShell, LinkNotice } from "@/components/proposal/ProposalShell";
import { ProposalView } from "@/components/proposal/ProposalView";
import { RichProposal } from "@/components/proposal/RichProposal";
import { BUSINESS_NAME, isRich } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

type Props = { params: { token: string }; searchParams: { k?: string } };

const load = async (token: string) => (await db().from("proposals").select("*").eq("token", token).maybeSingle()).data;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const robots = { index: false, follow: false, nocache: true };
  if (!previewKeyOk(params.token, searchParams.k)) return { title: { absolute: BUSINESS_NAME }, robots };
  const p = await load(params.token);
  if (!p) return { title: { absolute: BUSINESS_NAME }, robots };
  const title = `${p.title} (preview) | ${BUSINESS_NAME}`;
  const description = `A preview of the proposal from ${BUSINESS_NAME}.`;
  const image = p.content?.hero?.image ? [{ url: p.content.hero.image }] : undefined;
  return { title: { absolute: title }, description, robots, openGraph: { title, description, images: image } };
}

/** Shareable, read-only preview behind a signed key. Works for drafts; never counts a view; signing is off. */
export default async function SharedPreview({ params, searchParams }: Props) {
  const row = previewKeyOk(params.token, searchParams.k) ? await load(params.token) : null;
  if (!row) return <ProposalShell><LinkNotice state="missing" /></ProposalShell>;
  const p = toPublic(row);
  const rich = isRich(p.content);
  const View = rich ? RichProposal : ProposalView;
  return <ProposalShell rich={rich}><View proposal={p} token={row.token} preview share {...(rich ? { pdfHref: `/api/project/${row.token}/pdf?view=1&k=${searchParams.k}` } : {})} /></ProposalShell>;
}
