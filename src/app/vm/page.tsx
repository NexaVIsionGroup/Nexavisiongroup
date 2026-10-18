import type { Metadata } from "next";
import { cookies } from "next/headers";
import { VM_COOKIE, VM_PHONES, VM_HOTSPOTS, userFromCookie, trialState } from "@/lib/vm";
import VmClient from "./VmClient";
import HotspotClient from "./HotspotClient";

// One door for every VM user: sign in here and the ACCOUNT decides which phone opens.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nexa Cloud", robots: { index: false, follow: false } };

export default async function VmPage() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  // An appliance account (a hotspot, not a screen) gets controls instead of a phone. Signed-out
  // visitors still fall through to the usual lock screen -- one door, whoever is holding the key.
  const appliance = u?.phone_id ? VM_HOTSPOTS[u.phone_id] : null;
  if (u && appliance) {
    return <HotspotClient user={{ username: u.username! }} device={appliance} />;
  }
  const phone = u?.phone_id ? VM_PHONES[u.phone_id] : null;
  const trial = u ? trialState(u) : null;
  const expired = !!trial?.expired;
  return (
    <VmClient
      user={u ? { username: u.username!, hasPhone: !!phone } : null}
      phoneUrl={phone && !expired ? `https://${phone.host}/` : null}
      trial={trial?.onTrial ? { expired, daysLeft: trial.daysLeft } : null}
      payUrl={process.env.NEXT_PUBLIC_VM_PAY_URL || null}
    />
  );
}
