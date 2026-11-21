import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pcc, userFromCookie, VM_COOKIE, VM_LIVE_DEVICES, mintPhoneGateToken } from "@/lib/vm";

// The signed-in user's live-control appliance: a real phone reached the same way the admin
// "Live Control" panel reaches it — wake it over pcc(), then hand back the shared WebRTC relay
// URL the rack already gave this device (control_url from /pcc/devices). Same /vm door and same
// vm_session cookie as the cloud phones and the hotspot — the account's phone_id decides which
// device answers, so a user can only ever reach their own.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function me() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  if (!u || !u.phone_id || !VM_LIVE_DEVICES[u.phone_id]) return null;
  return u;
}

// Wake + unlock the device (same call the admin page's "Open live control" button makes) and
// return its control_url. The client opens that URL once this responds ok.
export async function POST() {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  const dev = u.phone_id!;
  const [devices] = await Promise.all([
    pcc("/devices"),
    pcc(`/${dev}/cmd`, "POST", { cmd: "unlock" }),
  ]);
  const list = (devices.devices as { id: string; control_url?: string }[] | undefined) || [];
  const found = list.find((d) => d.id === dev);
  if (!found?.control_url) return NextResponse.json({ ok: false, error: "No live-control URL for this device right now." }, { status: 502 });
  if (!process.env.GATE_SECRET) return NextResponse.json({ ok: false, error: "gate not configured" }, { status: 500 });
  // control_url (phone.nexavisiongroup.com) sits behind the nexa-gate Worker, which only takes
  // an admin login or this signed token — same mechanism /admin/gate uses, minted here instead.
  const url = new URL(found.control_url);
  url.searchParams.set("nexatoken", mintPhoneGateToken());
  return NextResponse.json({ ok: true, control_url: url.toString() });
}
