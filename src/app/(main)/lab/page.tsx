import { client } from "@/sanity/lib/client";
import { caseStudiesQuery, siteSettingsQuery } from "@/sanity/lib/queries";
import { fallbackSettings } from "@/lib/fallback-data";
import { LabPageContent } from "@/components/sections/LabPageContent";

export const metadata = {
  title: "Systems Lab",
  description:
    "Real systems. Real businesses. See every build NexaVision has shipped — live demos, case studies, and proof of what's possible.",
};

export const revalidate = 60;

export default async function LabPage() {
  let caseStudies;
  let settings;

  try {
    [caseStudies, settings] = await Promise.all([
      client.fetch(caseStudiesQuery),
      client.fetch(siteSettingsQuery),
    ]);
  } catch {
    caseStudies = null;
    settings = null;
  }

  return (
    <main className="min-h-screen pt-24 pb-20">
      <LabPageContent data={caseStudies} settings={settings || fallbackSettings} />
    </main>
  );
}
