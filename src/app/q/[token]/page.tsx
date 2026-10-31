import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";
import { createAdminClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/questionnaires";
import QuestionnaireClient from "./QuestionnaireClient";
import ProspectClient from "@/components/prospect/ProspectClient";
import "@/styles/prospect.css";

// Atkinson Hyperlegible: designed by the Braille Institute for low-vision readers.
const legible = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
// Prospect check-ups: an editorial serif for headlines.
const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const dynamic = "force-dynamic";

type Props = { params: { token: string } };

/** Which template a link uses (null if the link doesn't exist). Only the template id is read. */
async function templateFor(token: string) {
  const { data } = await createAdminClient().from("client_questionnaires").select("template").eq("token", token).maybeSingle();
  return data ? getTemplate(data.template) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await templateFor(params.token);
  const robots = { index: false, follow: false, nocache: true };
  if (t?.kind === "prospect" && t.brief) {
    const title = `${t.brief.business} × NexaVision Group`;
    const description = "What we found, what it costs you, and how we'd help. Made for " + t.brief.business + ".";
    const image = t.brief.heroImage ? [{ url: t.brief.heroImage }] : undefined;
    return { title, description, robots, openGraph: { title, description, images: image }, twitter: { card: "summary_large_image", title, description } };
  }
  return { title: "Household Check-up", robots };
}

export default async function QuestionnairePage({ params }: Props) {
  const t = await templateFor(params.token);
  if (t?.kind === "prospect") {
    return (
      <div className={serif.variable}>
        <ProspectClient token={params.token} />
      </div>
    );
  }
  return (
    <div className={legible.className}>
      <QuestionnaireClient token={params.token} />
    </div>
  );
}
