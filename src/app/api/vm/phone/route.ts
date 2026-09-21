import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pcc, userFromCookie, VM_COOKIE, trialState } from "@/lib/vm";

// The signed-in user's own phone: is it up, and start it if not.
// Phones are not kept running for everyone all the time (memory on the rack is the limit): a phone
// starts when its user signs in (~35 s) and the rack only stops idle, unwatched phones when it needs
// the memory for someone else.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Slot = { power?: boolean; running?: boolean; booted?: boolean };

async function me() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  if (!u || !u.phone_id || trialState(u).expired) return null;
  return u;
}
async function stateOf(phone: string) {
  const st = await pcc("/vm/status");
  const slot = ((st.phones as Record<string, Slot> | undefined) || {})[phone] || {};
  return { ok: st.ok === true, state: slot.booted ? "ready" : slot.running || slot.power ? "starting" : "off" };
}

export async function GET() {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(await stateOf(u.phone_id!));
}

// Start it (no-op when it is already up). "rack_full" = every running phone is being watched right now.
export async function POST() {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  const cur = await stateOf(u.phone_id!);
  if (cur.state !== "off") return NextResponse.json(cur);
  const r = await pcc(`/vm/${u.phone_id}/on`, "POST");
  if (r.ok !== true) return NextResponse.json({ ok: false, state: "off", code: r.error === "rack_full" ? "rack_full" : "error" }, { status: 503 });
  return NextResponse.json({ ok: true, state: "starting" });
}
