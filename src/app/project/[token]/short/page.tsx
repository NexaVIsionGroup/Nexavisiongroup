import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, linkState, previewKeyOk, toPublic } from "@/lib/proposals/server";
import { ProposalShell, LinkNotice } from "@/components/proposal/ProposalShell";
import { ShortSummary } from "@/components/proposal/ShortSummary";
import { BUSINESS_NAME } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

type Props = { params: { token: string }; searchParams: { k?: string } };

const load = async (token: string) => (await db().from("proposals").select("*").eq("token", token).maybeSingle()).data;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const p = await load(params.token);
  const robots = { index: false, follow: false, nocache: true };
  const ok = previewKeyOk(params.token, searchParams.k) ? !!p : linkState(p) === "ok";
  if (!ok || !p.content?.summary) return { title: { absolute: BUSINESS_NAME }, robots };
  const title = `The short version | ${BUSINESS_NAME}`;
  const description = p.content.summary.headline;
  const image = p.content?.hero?.image ? [{ url: p.content.hero.image }] : undefined;
  return { title: { absolute: title }, description, robots, openGraph: { title, description, images: image } };
}

/** One-screen summary. With a valid preview key (?k=) it works for drafts and never counts a view. */
export default async function ShortPage({ params, searchParams }: Props) {
  const row = await load(params.token);
  const preview = previewKeyOk(params.token, searchParams.k);
  if (!preview) {
    const state = linkState(row);
    if (state !== "ok") return <ProposalShell><LinkNotice state={state} /></ProposalShell>;
  }
  if (!row) return <ProposalShell><LinkNotice state="missing" /></ProposalShell>;
  const p = toPublic(row);
  if (!p.content.summary) notFound();
  return (
    <ProposalShell rich>
      <ShortSummary proposal={p} token={params.token} previewKey={preview ? searchParams.k : undefined} />
    </ProposalShell>
  );
}
