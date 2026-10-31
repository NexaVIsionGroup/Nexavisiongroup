import { NextRequest, NextResponse } from "next/server";
import { db, cleanUsername, verifyPassword, mint, NV_COOKIE, trialState, TRIAL_ENDED, type NvUser } from "@/lib/nexavideo";

// Sign in. Web (download page) → session cookie. App (body.app = true) → { token } it keeps as a bearer.
export const dynamic = "force-dynamic";
const MAX_FAILS = 6;
const LOCK_MIN = 15;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = cleanUsername(body.username);
  const password = String(body.password ?? "");
  const bad = () => NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  if (!username || !password) return bad();

  const { data } = await db().from("nexavideo_users").select("*").eq("username", username).maybeSingle();
  const u = data as NvUser | null;
  if (!u) return bad();
  if (u.locked_until && new Date(u.locked_until) > new Date()) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${LOCK_MIN} minutes.` }, { status: 429 });
  }
  if (!verifyPassword(password, u.password_hash)) {
    const fails = u.failed_logins + 1;
    await db().from("nexavideo_users").update({
      failed_logins: fails,
      locked_until: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MIN * 60000).toISOString() : null,
    }).eq("id", u.id);
    return bad();
  }
  if (!u.enabled) return NextResponse.json({ error: "This account is turned off." }, { status: 403 });
  if (trialState(u).expired) return NextResponse.json({ error: TRIAL_ENDED, code: "trial_expired" }, { status: 402 });

  const app = body.app === true;
  await db().from("nexavideo_users").update({
    failed_logins: 0, locked_until: null, last_login_at: new Date().toISOString(),
    ...(app ? { last_seen_at: new Date().toISOString(), device: String(body.device ?? "").slice(0, 80) || null } : {}),
  }).eq("id", u.id);

  if (app) return NextResponse.json({ ok: true, token: mint(u.id, "app").value, username: u.username });
  const s = mint(u.id, "web");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NV_COOKIE, s.value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: s.maxAge });
  return res;
}
