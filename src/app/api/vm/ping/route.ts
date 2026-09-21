import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, userFromCookie, VM_COOKIE, trialState } from "@/lib/vm";

// Usage heartbeat. /vm calls this once a minute while the phone view is open AND the tab is visible.
// It is what the admin panel's "in use now / last used / time used" comes from, and it costs one
// tiny update per active user per minute. Nothing else is recorded (no screen content, no input).
export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  if (trialState(u).expired) return NextResponse.json({ ok: false, code: "trial_expired" }, { status: 402 });
  await db().from("vm_users")
    .update({ last_active_at: new Date().toISOString(), minutes_used: (u.minutes_used || 0) + 1 })
    .eq("id", u.id);
  return NextResponse.json({ ok: true });
}
