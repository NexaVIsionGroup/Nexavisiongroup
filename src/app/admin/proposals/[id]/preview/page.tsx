import { notFound } from "next/navigation";
import { db, toPublic } from "@/lib/proposals/server";
import { ProposalShell } from "@/components/proposal/ProposalShell";
import { ProposalView } from "@/components/proposal/ProposalView";
import { RichProposal } from "@/components/proposal/RichProposal";
import { isRich } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposal preview", robots: { index: false, follow: false } };

/** Behind the admin login. Works for drafts and never counts as the customer's view. */
export default async function ProposalPreview({ params }: { params: { id: string } }) {
  const { data: row } = await db().from("proposals").select("*").eq("id", params.id).maybeSingle();
  if (!row) notFound();
  const p = toPublic(row);
  const rich = isRich(p.content);
  const View = rich ? RichProposal : ProposalView;
  return <ProposalShell rich={rich}><View proposal={p} token={row.token} preview /></ProposalShell>;
}
