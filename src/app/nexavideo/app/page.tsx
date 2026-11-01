import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NV_COOKIE, userFrom, trialState, TRIAL_ENDED } from "@/lib/nexavideo";
import WebApp from "./WebApp";

// Nexa Video in the browser — built for iPhone (Safari → Share → Add to Home Screen), works in any modern browser.
// Same invite accounts as the Android app. Catalogue + stream lookups go through /api/nexavideo/web/* (rack backend).
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nexa Video",
  description: "Private media center — invite only.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  manifest: "/nexavideo/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Nexa Video", statusBarStyle: "black-translucent" },
  icons: { icon: "/nexavideo/icon-192.png", apple: "/nexavideo/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#07080b", viewportFit: "cover", width: "device-width", initialScale: 1, maximumScale: 1 };

export default async function NexaVideoWebApp() {
  const u = await userFrom((await cookies()).get(NV_COOKIE)?.value);
  const expired = !!u && trialState(u).expired;
  const t = u && !expired ? trialState(u) : null;
  return (
    <WebApp
      user={u && !expired ? { username: u.username!, trialDays: t?.onTrial ? t.daysLeft : null } : null}
      notice={expired ? TRIAL_ENDED : null}
    />
  );
}
