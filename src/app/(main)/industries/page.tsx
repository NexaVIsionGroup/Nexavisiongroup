import { client } from "@/sanity/lib/client";
import { industriesListQuery, siteSettingsQuery } from "@/sanity/lib/queries";
import { fallbackHomepage } from "@/lib/fallback-data";
import { IndustriesHubClient } from "./IndustriesHubClient";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Revenue infrastructure tailored to your vertical. HVAC, Auto Repair, Property Management, Law Firms, and more — each with industry-specific modules and automation.",
};

export default async function IndustriesPage() {
  let industries;
  try {
    industries = await client.fetch(industriesListQuery);
  } catch {
    industries = null;
  }

  const data = industries && industries.length > 0
    ? industries
    : fallbackHomepage.industrySection.industries;

  return <IndustriesHubClient industries={data} />;
}
