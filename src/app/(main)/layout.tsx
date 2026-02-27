import { client } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { fallbackSettings } from "@/lib/fallback-data";

export default async function InnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings;
  try {
    settings = await client.fetch(siteSettingsQuery);
  } catch {
    settings = null;
  }

  const siteSettings = settings || fallbackSettings;

  return (
    <>
      <Navbar settings={siteSettings} />
      {children}
      <Footer settings={siteSettings} />
    </>
  );
}
