import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userFromCookie, VM_COOKIE, VM_LIVE_DEVICES } from "@/lib/vm";

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

// DISABLED: control_url (phone.nexavisiongroup.com) is the shared cloudphone console � one gate
// token there shows EVERY device plus Terminal/Files, not just this account's phone. Until the
// nexa-gate Worker can scope a token to one device, this door must not mint one.
export async function POST() {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: false, error: "Live control for this phone isn't switched on yet. Ask your administrator." }, { status: 503 });
}
