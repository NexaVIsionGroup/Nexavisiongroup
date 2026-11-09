import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { Hero } from "@/components/site/Hero";
import { Junction } from "@/components/site/Junction";
import { FrontDoor, AppStory, AppWall, Work, WhoAndHow, Pricing, Closer } from "@/components/site/Chapters";

export const metadata: Metadata = {
  title: { absolute: "NexaVision Group | Empowering Your Digital Ecosystem" },
  description:
    "We're your outsourced tech and marketing department. We build it, we run it, you run your business: websites, business apps, Google, ads, email, online ordering and design.",
};

export default function Page() {
  return (
    <SiteShell>
      <Hero />
      <Junction src="/site/scenes/kitchen-v1.webp" from="dark" to="light" focus="50% 45%" />
      <FrontDoor />
      <Junction src="/site/scenes/phone-v1.webp" from="light" to="dark" focus="45% 50%" caption="Your whole business, in your pocket." />
      <AppStory />
      <AppWall />
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
