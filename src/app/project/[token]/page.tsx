import type { Metadata } from "next";
import { db, linkState, syncPaid, toPublic } from "@/lib/proposals/server";
import { ProposalShell, LinkNotice } from "@/components/proposal/ProposalShell";
import { ProposalView } from "@/components/proposal/ProposalView";
import { RichProposal } from "@/components/proposal/RichProposal";
import { BUSINESS_NAME, isRich } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

type Props = { params: { token: string }; searchParams: { paid?: string; pay_error?: string; from?: string } };

const load = async (token: string) => (await db().from("proposals").select("*").eq("token", token).maybeSingle()).data;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load(params.token);
  const robots = { index: false, follow: false, nocache: true };
  if (linkState(p) !== "ok") return { title: { absolute: BUSINESS_NAME }, robots };
  const title = `${p.title} | ${BUSINESS_NAME}`;
  const description = `Your ${p.signed_at ? "agreement" : "proposal"} from ${BUSINESS_NAME}.`;
  const image = p.content?.hero?.image ? [{ url: p.content.hero.image }] : undefined;
  return { title: { absolute: title }, description, robots, openGraph: { title, description, images: image } };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const row = await load(params.token);
  const state = linkState(row);
  if (state !== "ok") return <ProposalShell><LinkNotice state={state} /></ProposalShell>;
  const p = toPublic(await syncPaid(row));
  const rich = isRich(p.content);
  const View = rich ? RichProposal : ProposalView;
  return (
    <ProposalShell rich={rich}>
      <View proposal={p} token={params.token} payError={searchParams.pay_error === "1"} from={searchParams.from} />
    </ProposalShell>
  );
}
