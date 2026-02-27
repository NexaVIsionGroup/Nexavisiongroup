import { SystemsPageClient } from "./SystemsPageClient";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Systems — How It Works",
  description:
    "The NexaVision Revenue System: modular infrastructure across five families — Acquisition, Operations, Portals, Admin, and Integrations. See how the pieces fit together.",
};

export default function SystemsPage() {
  return <SystemsPageClient />;
}
