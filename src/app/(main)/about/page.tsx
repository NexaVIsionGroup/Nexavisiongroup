import type { Metadata } from "next";
import { AboutPageContent } from "@/components/sections/AboutPageContent";

export const metadata: Metadata = {
  title: "About",
  description:
    "Built by Den Chai. Systems architect for service businesses. Learn why NexaVision builds revenue infrastructure, not websites.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <AboutPageContent />
    </main>
  );
}
