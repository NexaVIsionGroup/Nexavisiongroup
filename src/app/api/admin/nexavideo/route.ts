import { NextRequest, NextResponse } from "next/server";
import { db, newToken, type NvUser, type NvRelease } from "@/lib/nexavideo";

// Admin management for Nexa Video accounts + published builds.
// Auth: middleware already requires a Supabase session for /api/admin/*.
export const dynamic = "force-dynamic";

const INVITE_DAYS = 7;
const RESET_HOURS = 48;
const link = (token: string) => `https://nexavisiongroup.com/nexavideo/i/${token}`;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

function publicUser(u: NvUser) {
  const pending = !!u.token_hash && !!u.token_expires && new Date(u.token_expires) > new Date();
  return {
    id: u.id, label: u.label, username: u.username, enabled: u.enabled,
    signed_up: !!u.username && !!u.password_hash,
    pending_link: pending ? u.token_kind : null, link_expires: pending ? u.token_expires : null,
    locked: !!u.locked_until && new Date(u.locked_until) > new Date(),
    created_at: u.created_at, signed_up_at: u.signed_up_at, last_login_at: u.last_login_at,
    last_seen_at: u.last_seen_at, app_version: u.app_version, device: u.device, downloads: u.downloads || 0,
  };
}

export async function GET() {
  const [users, releases] = await Promise.all([
    db().from("nexavideo_users").select("*").order("created_at", { ascending: true }),
    db().from("nexavideo_releases").select("*").order("version_code", { ascending: false }).limit(10),
  ]);
  if (users.error) return err(users.error.message, 500);
  return NextResponse.json({
    users: (users.data as NvUser[]).map(publicUser),
    releases: ((releases.data || []) as NvRelease[]).map((r) => ({
      version_code: r.version_code, version_name: r.version_name, notes: r.notes, size_bytes: r.size_bytes, created_at: r.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const id = String(body.id ?? "");
  const getUser = async () => {
    const { data } = await db().from("nexavideo_users").select("*").eq("id", id).maybeSingle();
    return data as NvUser | null;
  };

  switch (action) {
    case "invite": {
      const t = newToken();
      const { data, error } = await db().from("nexavideo_users").insert({
        label: String(body.label ?? "").slice(0, 80),
        token_hash: t.hash, token_kind: "invite",
        token_expires: new Date(Date.now() + INVITE_DAYS * 86400_000).toISOString(),
      }).select("*").single();
      if (error) return err(error.message, 500);
      return NextResponse.json({ ok: true, link: link(t.token), user: publicUser(data as NvUser) });
    }
    // invite not used yet → fresh invite link; signed up → password-reset link
    case "new_link": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      const kind = u.username && u.password_hash ? "reset" : "invite";
      const t = newToken();
      const ms = kind === "reset" ? RESET_HOURS * 3600_000 : INVITE_DAYS * 86400_000;
      const { error } = await db().from("nexavideo_users").update({
        token_hash: t.hash, token_kind: kind, token_expires: new Date(Date.now() + ms).toISOString(),
        failed_logins: 0, locked_until: null,
      }).eq("id", u.id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ ok: true, link: link(t.token), kind });
    }
    case "toggle": {
      const { error } = await db().from("nexavideo_users").update({ enabled: !!body.enabled }).eq("id", id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ ok: true });
    }
    case "label": {
      const { error } = await db().from("nexavideo_users").update({ label: String(body.label ?? "").slice(0, 80) }).eq("id", id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ ok: true });
    }
    case "unlock": {
      await db().from("nexavideo_users").update({ failed_logins: 0, locked_until: null }).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    case "delete": {
      const { error } = await db().from("nexavideo_users").delete().eq("id", id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ ok: true });
    }
    default:
      return err("Unknown action.");
  }
}
