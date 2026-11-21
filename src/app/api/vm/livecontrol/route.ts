import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userFromCookie, VM_COOKIE, VM_LIVE_DEVICES } from "@/lib/vm";

// The signed-in user's live-control appliance door. Same /vm door and vm_session cookie as the
// cloud phones and the hotspot; the account's phone_id decides which device answers.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function me() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  if (!u || !u.phone_id || !VM_LIVE_DEVICES[u.phone_id]) return null;
  return u;
}

// DISABLED: control_url (phone.nexavisiongroup.com) is the shared cloudphone console. A nexa-gate
// token there shows EVERY device plus Terminal/Files, not just this account's phone, and the token
// is not device-bound. Until the Worker can scope a token to one device, this door must not mint one.
export async function POST() {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(
    { ok: false, error: "Live control for this phone isn't switched on yet. Ask your administrator." },
    { status: 503 },
  );
}
