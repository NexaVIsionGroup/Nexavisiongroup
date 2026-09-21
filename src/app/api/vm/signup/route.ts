import { NextRequest, NextResponse } from "next/server";
import {
  db, sha256, cleanUsername, USERNAME_RE, hashPassword, mintSession, VM_COOKIE, type VmUser,
} from "@/lib/vm";

// Redeems a one-time link.
//   kind=invite -> the person chooses a username + password (entered twice)
//   kind=reset  -> new password only (username stays)
export const dynamic = "force-dynamic";

const EXPIRED = "This link is invalid or has expired. Ask for a new one.";

async function findByToken(token: string): Promise<VmUser | null> {
  if (!token || token.length < 8 || token.length > 64) return null;
  const { data } = await db().from("vm_users").select("*").eq("token_hash", sha256(token)).maybeSingle();
  const u = data as VmUser | null;
  if (!u || !u.token_expires || new Date(u.token_expires) < new Date()) return null;
  return u;
}

// GET ?token=  -> which form should the page show
export async function GET(req: NextRequest) {
  const u = await findByToken(req.nextUrl.searchParams.get("token") || "");
  if (!u) return NextResponse.json({ ok: false, error: EXPIRED }, { status: 404 });
  return NextResponse.json({ ok: true, kind: u.token_kind, username: u.username });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const u = await findByToken(String(body.token ?? ""));
  if (!u) return NextResponse.json({ error: EXPIRED }, { status: 404 });
  if (!u.enabled) return NextResponse.json({ error: "This account is turned off." }, { status: 403 });

  const password = String(body.password ?? "");
  const confirm = String(body.confirm ?? "");
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== confirm) {
    return NextResponse.json({ error: "The two passwords do not match." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    password_hash: hashPassword(password),
    token_hash: null, token_kind: null, token_expires: null,
    failed_logins: 0, locked_until: null,
    last_login_at: new Date().toISOString(),
  };
  if (u.token_kind === "invite") {
    const username = cleanUsername(body.username);
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters: letters, numbers, dot, dash or underscore." },
        { status: 400 },
      );
    }
    const { data: taken } = await db().from("vm_users").select("id")
      .eq("username", username).neq("id", u.id).maybeSingle();
    if (taken) return NextResponse.json({ error: "That username is taken. Pick another." }, { status: 409 });
    patch.username = username;
    patch.signed_up_at = new Date().toISOString();
    if (u.plan === "trial" && !u.trial_ends_at) {
      patch.trial_ends_at = new Date(Date.now() + (u.trial_days || 7) * 86400_000).toISOString();
    }
  }
  const { error } = await db().from("vm_users").update(patch).eq("id", u.id);
  if (error) return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });

  const s = mintSession(u.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VM_COOKIE, s.value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: s.maxAge });
  return res;
}
