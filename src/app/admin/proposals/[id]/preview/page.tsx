import { notFound } from "next/navigation";
import { db, toPublic } from "@/lib/proposals/server";
import { ProposalShell } from "@/components/proposal/ProposalShell";
import { ProposalView } from "@/components/proposal/ProposalView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposal preview", robots: { index: false, follow: false } };

/** Behind the admin login. Works for drafts and never counts as the customer's view. */
export default async function ProposalPreview({ params }: { params: { id: string } }) {
  const { data: p } = await db().from("proposals").select("*").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  return <ProposalShell><ProposalView proposal={toPublic(p)} token={p.token} preview /></ProposalShell>;
}
