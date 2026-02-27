import { client } from "@/sanity/lib/client";
import { demosListQuery } from "@/sanity/lib/queries";
import { DemosPageClient } from "./DemosPageClient";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Live Demos",
  description:
    "See the NexaVision Revenue System in action. Interactive demos for HVAC, Auto Repair, and more — real systems, not mockups.",
};

export default async function DemosPage() {
  let demos;
  try {
    demos = await client.fetch(demosListQuery);
  } catch {
    demos = null;
  }

  return <DemosPageClient sanityDemos={demos} />;
}
