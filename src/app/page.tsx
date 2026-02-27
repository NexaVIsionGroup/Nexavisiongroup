import { client } from "@/sanity/lib/client";
import { homepageQuery, siteSettingsQuery } from "@/sanity/lib/queries";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { AnthillSection } from "@/components/sections/AnthillSection";
import { IndustrySelector } from "@/components/sections/IndustrySelector";
import { ModulesSection } from "@/components/sections/ModulesSection";
import { ProofSection } from "@/components/sections/ProofSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { CtaCloseSection } from "@/components/sections/CtaCloseSection";

// Fallback data when Sanity isn't connected yet
import { fallbackHomepage, fallbackSettings } from "@/lib/fallback-data";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  let homepage;
  let settings;

  try {
    [homepage, settings] = await Promise.all([
      client.fetch(homepageQuery),
      client.fetch(siteSettingsQuery),
    ]);
  } catch {
    // Fallback to static data if Sanity isn't connected
    homepage = null;
    settings = null;
  }

  const data = homepage || fallbackHomepage;
  const siteSettings = settings || fallbackSettings;

  return (
    <>
      <Navbar settings={siteSettings} />
      <main>
        <HeroSection data={data.hero} />
        <AnthillSection data={data.anthillSection} />
        <IndustrySelector data={data.industrySection} />
        <ModulesSection data={data.modulesSection} />
        <ProofSection data={data.proofSection} />
        <PricingSection data={data.pricingSection} />
        <CtaCloseSection data={data.ctaSection} />
      </main>
      <Footer settings={siteSettings} />
    </>
  );
}
