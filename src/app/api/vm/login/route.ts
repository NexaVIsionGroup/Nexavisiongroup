import { NextRequest, NextResponse } from "next/server";
import { db, cleanUsername, verifyPassword, mintSession, VM_COOKIE, type VmUser } from "@/lib/vm";

export const dynamic = "force-dynamic";
const MAX_FAILS = 6;
const LOCK_MIN = 15;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = cleanUsername(body.username);
  const password = String(body.password ?? "");
  const bad = () => NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  if (!username || !password) return bad();

  const { data } = await db().from("vm_users").select("*").eq("username", username).maybeSingle();
  const u = data as VmUser | null;
  if (!u) return bad();
  if (u.locked_until && new Date(u.locked_until) > new Date()) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${LOCK_MIN} minutes.` }, { status: 429 });
  }
  if (!verifyPassword(password, u.password_hash)) {
    const fails = u.failed_logins + 1;
    await db().from("vm_users").update({
      failed_logins: fails,
      locked_until: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MIN * 60000).toISOString() : null,
    }).eq("id", u.id);
    return bad();
  }
  if (!u.enabled) {
    return NextResponse.json({ error: "This account is turned off. Contact your administrator." }, { status: 403 });
  }

  await db().from("vm_users")
    .update({ failed_logins: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq("id", u.id);
  const s = mintSession(u.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VM_COOKIE, s.value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: s.maxAge });
  return res;
}
