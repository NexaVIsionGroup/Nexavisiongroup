import type { Metadata } from "next";
import { db, linkState, syncPaid, toPublic } from "@/lib/proposals/server";
import { ProposalShell, LinkNotice } from "@/components/proposal/ProposalShell";
import { ProposalView } from "@/components/proposal/ProposalView";
import { BUSINESS_NAME } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

type Props = { params: { token: string }; searchParams: { paid?: string; pay_error?: string; from?: string } };

const load = async (token: string) => (await db().from("proposals").select("*").eq("token", token).maybeSingle()).data;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load(params.token);
  const robots = { index: false, follow: false, nocache: true };
  if (linkState(p) !== "ok") return { title: { absolute: BUSINESS_NAME }, robots };
  const title = `${p.title} | ${BUSINESS_NAME}`;
  const description = `Your ${p.signed_at ? "agreement" : "proposal"} from ${BUSINESS_NAME}.`;
  return { title: { absolute: title }, description, robots, openGraph: { title, description } };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const row = await load(params.token);
  const state = linkState(row);
  if (state !== "ok") return <ProposalShell><LinkNotice state={state} /></ProposalShell>;
  const p = await syncPaid(row);
  return (
    <ProposalShell>
      <ProposalView proposal={toPublic(p)} token={params.token} payError={searchParams.pay_error === "1"} from={searchParams.from} />
    </ProposalShell>
  );
}
