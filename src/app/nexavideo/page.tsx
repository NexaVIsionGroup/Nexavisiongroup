import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NV_COOKIE, userFrom, latestRelease } from "@/lib/nexavideo";
import NexaVideoClient from "./NexaVideoClient";
import { SHOTS } from "./shots";

// Private download page for the Nexa Video Android app (owner + invited friends). Not linked anywhere on the
// site and kept out of search engines; the APK only downloads for a signed-in account.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nexa Video",
  description: "Private media center for Android — invite only.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function NexaVideoPage() {
  const jar = await cookies();
  const u = await userFrom(jar.get(NV_COOKIE)?.value);
  const r = u ? await latestRelease() : null;
  return (
    <NexaVideoClient
      user={u ? { username: u.username! } : null}
      release={r ? { name: r.version_name, size: r.size_bytes, notes: r.notes, date: r.created_at } : null}
      shots={SHOTS}
    />
  );
}
