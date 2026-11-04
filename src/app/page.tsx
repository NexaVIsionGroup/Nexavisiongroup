import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { HomePage } from "@/components/site/HomePage";

export const metadata: Metadata = {
  title: { absolute: "NexaVision Group | Websites and Business Apps for Your Business" },
  description:
    "We build your website and your own business app: email inbox, private file Drive, quotes, invoices, payments, online ordering and more. Get a free check-up.",
};

export default function Page() {
  return (
    <SiteShell>
      <HomePage />
    </SiteShell>
  );
}
