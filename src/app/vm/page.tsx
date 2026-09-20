import type { Metadata } from "next";
import { cookies } from "next/headers";
import { VM_COOKIE, VM_PHONES, userFromCookie } from "@/lib/vm";
import VmClient from "./VmClient";

// One door for every VM user: sign in here and the ACCOUNT decides which phone opens.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cloud Phone", robots: { index: false, follow: false } };

export default async function VmPage() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  const phone = u?.phone_id ? VM_PHONES[u.phone_id] : null;
  return (
    <VmClient
      user={u ? { username: u.username!, hasPhone: !!phone } : null}
      phoneUrl={phone ? `https://${phone.host}/` : null}
    />
  );
}
