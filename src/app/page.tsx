import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { Hero } from "@/components/site/Hero";
import { Junction } from "@/components/site/Junction";
import { FrontDoor, AppStory, Work, WhoAndHow, Pricing, Closer } from "@/components/site/Chapters";

export const metadata: Metadata = {
  title: { absolute: "NexaVision Group | Websites and Business Apps for Your Business" },
  description:
    "We build your website and your own business app: email inbox, private file Drive, quotes, invoices, payments, online ordering and more. Get a free check-up.",
};

export default function Page() {
  return (
    <SiteShell>
      <Hero />
      <Junction src="/site/scenes/kitchen-v1.webp" from="dark" to="light" focus="50% 45%" />
      <FrontDoor />
      <Junction src="/site/scenes/phone-v1.webp" from="light" to="dark" focus="45% 50%" caption="Your whole business, in your pocket." />
      <AppStory />
      <Junction src="/site/scenes/crane-v1.webp" from="dark" to="light" focus="50% 60%" />
      <Work />
      <Junction src="/site/scenes/lawn-v1.webp" from="light" to="dark" focus="50% 35%" />
      <WhoAndHow />
      <Junction src="/site/scenes/cafe-v1.webp" from="dark" to="light" focus="50% 30%" />
      <Pricing />
      <Junction src="/site/scenes/kitchen-v1.webp" from="light" to="dark" focus="70% 40%" />
      <Closer />
    </SiteShell>
  );
}
