import { client } from "@/sanity/lib/client";
import { homepageQuery, siteSettingsQuery } from "@/sanity/lib/queries";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { AnthillSection } from "@/components/sections/AnthillSection";
import { CaseStudySnapshot } from "@/components/sections/CaseStudySnapshot";
import { IndustrySelector } from "@/components/sections/IndustrySelector";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { PricingPreview } from "@/components/sections/PricingPreview";
import { CtaCloseSection } from "@/components/sections/CtaCloseSection";

// Fallback data when Sanity isn't connected yet
import { fallbackHomepage, fallbackSettings } from "@/lib/fallback-data";

export const revalidate = 60;

export default async function HomePage() {
  let homepage;
  let settings;

  try {
    [homepage, settings] = await Promise.all([
      client.fetch(homepageQuery),
      client.fetch(siteSettingsQuery),
    ]);
  } catch {
    homepage = null;
    settings = null;
  }

  const data = homepage || fallbackHomepage;
  const siteSettings = settings || fallbackSettings;

  return (
    <>
      <Navbar settings={siteSettings} />
      <main>
        {/* 1A: Empathy-first hero — passes the 3-second grunt test */}
        <HeroSection data={data.hero} />

        {/* G2/1B: Trust bar — instant social proof below hero */}
        <TrustBar data={data.trustBar} />

        {/* 1C: Problem section — StoryBrand #2, name the problem */}
        <ProblemSection data={data.problemSection} />

        {/* 1D: Simplified Anthill — 3-layer accordion */}
        <AnthillSection data={data.anthillSection} />

        {/* 1E: Case study snapshot — Arctic Solutions proof */}
        <CaseStudySnapshot data={data.caseStudySnapshot} />

        {/* 1F: Industries preview — HVAC featured */}
        <IndustrySelector data={data.industrySection} />

        {/* 1G: 3-step process (simplified from 4) */}
        <ProcessSection data={data.proofSection} />

        {/* 1H: Pricing preview — anchor + link, no full tiers */}
        <PricingPreview data={data.pricingSection} />

        {/* 1I: Closing CTA — loss-framed */}
        <CtaCloseSection data={data.ctaSection} />
      </main>
      <Footer settings={siteSettings} />
    </>
  );
}
