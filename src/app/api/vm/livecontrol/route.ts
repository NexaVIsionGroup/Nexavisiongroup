import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pcc, userFromCookie, VM_COOKIE, VM_LIVE_DEVICES, LIVE_CONSOLE, mintLiveToken, trialState } from "@/lib/vm";

// The signed-in user's live-control appliance door. Same /vm door and vm_session cookie as the
// cloud phones and the hotspot; the account's phone_id decides which device answers.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function me() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  if (!u || !u.phone_id || !VM_LIVE_DEVICES[u.phone_id] || trialState(u).expired) return null;
  return u;
}

// Wake + unlock the phone, then hand back its single-device viewer with a short `live` token.
// The nexa-gate Worker turns that into a 2 h cookie good for this one device only.
export async function POST() {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  if (!process.env.VM_GATE_SECRET) return NextResponse.json({ ok: false, error: "gate not configured" }, { status: 500 });
  const dev = u.phone_id!;
  await pcc(`/${dev}/cmd`, "POST", { cmd: "unlock" });
  const url = new URL("/share", LIVE_CONSOLE);
  url.searchParams.set("token", VM_LIVE_DEVICES[dev].share);
  url.searchParams.set("vmlive", mintLiveToken(dev));
  return NextResponse.json({ ok: true, control_url: url.toString() });
}
