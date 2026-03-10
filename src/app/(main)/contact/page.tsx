import { client } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import { fallbackSettings } from "@/lib/fallback-data";
import { IntakeForm } from "@/components/sections/IntakeForm";

export const metadata = {
  title: "Tell Us About Your Business",
  description:
    "10 questions. 2 minutes. We'll recommend the right system for your service business.",
};

export const revalidate = 60;

export default async function ContactPage() {
  let settings;
  try {
    settings = await client.fetch(siteSettingsQuery);
  } catch {
    settings = null;
  }
  const siteSettings = settings || fallbackSettings;

  return (
    <main className="min-h-screen pt-24 pb-20">
      <IntakeForm settings={siteSettings} />
    </main>
  );
}
