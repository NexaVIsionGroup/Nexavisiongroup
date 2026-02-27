import { client } from "@/sanity/lib/client";
import { industryBySlugQuery, industriesListQuery } from "@/sanity/lib/queries";
import { IndustryPageClient } from "./IndustryPageClient";
import { getIndustryFallback } from "@/lib/industry-fallbacks";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

// Generate static paths for all industries
export async function generateStaticParams() {
  let industries;
  try {
    industries = await client.fetch(industriesListQuery);
  } catch {
    industries = null;
  }

  if (industries && industries.length > 0) {
    return industries.map((i: any) => ({ slug: i.slug?.current || i.slug }));
  }

  // Fallback slugs
  return [
    "hvac", "auto-repair", "property-management", "law-firms",
    "insurance", "salons-spas", "logistics", "veterinary",
    "home-healthcare", "self-storage",
  ].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let industry;
  try {
    industry = await client.fetch(industryBySlugQuery, { slug: params.slug });
  } catch {
    industry = null;
  }

  const data = industry || getIndustryFallback(params.slug);
  if (!data) return { title: "Industry" };

  return {
    title: `${data.name} Revenue Systems`,
    description: data.seo?.metaDescription || data.shortDescription ||
      `Revenue infrastructure built for ${data.name} businesses. Intake, CRM, quoting, invoicing, automations — configured for your vertical.`,
  };
}

export default async function IndustryPage({ params }: Props) {
  let industry;
  try {
    industry = await client.fetch(industryBySlugQuery, { slug: params.slug });
  } catch {
    industry = null;
  }

  const data = industry || getIndustryFallback(params.slug);
  if (!data) notFound();

  return <IndustryPageClient data={data} />;
}
