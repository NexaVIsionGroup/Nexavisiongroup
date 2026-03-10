import { client } from "@/sanity/lib/client";
import { pricingPageQuery, siteSettingsQuery } from "@/sanity/lib/queries";
import { fallbackSettings } from "@/lib/fallback-data";
import { PricingPageContent } from "@/components/sections/PricingPageContent";

export const metadata = {
  title: "Pricing",
  description:
    "Systems that pay for themselves. See what your NexaVision revenue system costs — and what it saves.",
};

export const revalidate = 60;

export default async function PricingPage() {
  let pricingData;
  let settings;

  try {
    [pricingData, settings] = await Promise.all([
      client.fetch(pricingPageQuery),
      client.fetch(siteSettingsQuery),
    ]);
  } catch {
    pricingData = null;
    settings = null;
  }

  return (
    <main className="min-h-screen pt-24 pb-20">
      <PricingPageContent data={pricingData} settings={settings || fallbackSettings} />
    </main>
  );
}
