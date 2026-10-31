import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db, newToken, trialState, type NvUser, type NvRelease } from "@/lib/nexavideo";

// Admin management for Nexa Video accounts + published builds.
// Auth: middleware already requires a Supabase session for /api/admin/*.
export const dynamic = "force-dynamic";

const INVITE_DAYS = 7;
const RESET_HOURS = 48;
const link = (token: string) => `https://nexavisiongroup.com/nexavideo/i/${token}`;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });
/** whole days, 1..365, or null when the value is not a usable number */
const days = (v: unknown) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 1 && n <= 365 ? n : null; };

function publicUser(u: NvUser) {
  const pending = !!u.token_hash && !!u.token_expires && new Date(u.token_expires) > new Date();
  return {
    id: u.id, label: u.label, username: u.username, enabled: u.enabled,
    signed_up: !!u.username && !!u.password_hash,
    pending_link: pending ? u.token_kind : null, link_expires: pending ? u.token_expires : null,
    locked: !!u.locked_until && new Date(u.locked_until) > new Date(),
    created_at: u.created_at, signed_up_at: u.signed_up_at, last_login_at: u.last_login_at,
    last_seen_at: u.last_seen_at, app_version: u.app_version, device: u.device, downloads: u.downloads || 0,
    plan: u.plan, trial_days: u.trial_days, trial_ends_at: u.trial_ends_at,
    trial_expired: trialState(u).expired, trial_days_left: trialState(u).daysLeft,
  };
}

export async function GET() {
  const [users, releases, requests] = await Promise.all([
    db().from("nexavideo_users").select("*").order("created_at", { ascending: true }),
    db().from("nexavideo_releases").select("*").order("version_code", { ascending: false }).limit(10),
    db().from("nexavideo_requests").select("id,name,contact,note,username,status,created_at,decided_at")
      .eq("status", "pending").order("created_at", { ascending: false }).limit(50),
  ]);
  if (users.error) return err(users.error.message, 500);
  return NextResponse.json({
    users: (users.data as NvUser[]).map(publicUser),
    releases: ((releases.data || []) as NvRelease[]).map((r) => ({
      version_code: r.version_code, version_name: r.version_name, notes: r.notes, size_bytes: r.size_bytes, created_at: r.created_at,
    })),
    requests: requests.data || [],
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
      // trial_days set → free-trial link: same sign-up, access ends N days after they sign up
      const trialDays = body.trial_days == null || body.trial_days === "" ? null : days(body.trial_days);
      if (body.trial_days != null && body.trial_days !== "" && !trialDays) return err("Trial length must be 1 to 365 days.");
      const { data, error } = await db().from("nexavideo_users").insert({
        plan: trialDays ? "trial" : "full", trial_days: trialDays,
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
    // extend / revive a trial: adds days on top of what's left (or from now if it already ended); for an unused
    // trial invite it changes the trial's length
    case "add_days": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      const n = days(body.days);
      if (!n) return err("Days must be 1 to 365.");
      if (!u.trial_ends_at) {
        await db().from("nexavideo_users").update({ plan: "trial", trial_days: n }).eq("id", u.id);
      } else {
        const base = Math.max(Date.now(), new Date(u.trial_ends_at).getTime());
        await db().from("nexavideo_users").update({ plan: "trial", trial_ends_at: new Date(base + n * 86400_000).toISOString() }).eq("id", u.id);
      }
      return NextResponse.json({ ok: true });
    }
    // full = permanent (no expiry). trial = put them on a clock of N days from now (or from sign-up if not redeemed)
    case "set_plan": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      if (body.plan === "full") {
        await db().from("nexavideo_users").update({ plan: "full" }).eq("id", u.id);
      } else {
        const n = days(body.days) || 10;
        await db().from("nexavideo_users").update({
          plan: "trial", trial_days: n,
          trial_ends_at: u.username ? new Date(Date.now() + n * 86400_000).toISOString() : null,
        }).eq("id", u.id);
      }
      return NextResponse.json({ ok: true });
    }
    // access request → live account (trial of N days from now, or permanent); emails them if they left an email
    case "approve_request": {
      const { data: r } = await db().from("nexavideo_requests").select("*").eq("id", id).eq("status", "pending").maybeSingle();
      if (!r) return err("Request not found (already handled?).", 404);
      const trial = body.plan !== "full";
      const n = trial ? days(body.days) || 10 : null;
      const { data: taken } = await db().from("nexavideo_users").select("id").eq("username", r.username).maybeSingle();
      if (taken) return err(`The username "${r.username}" was taken meanwhile — dismiss this request and send them an invite instead.`, 409);
      const now = new Date();
      const { data: u, error } = await db().from("nexavideo_users").insert({
        label: `${r.name} · ${r.contact}`.slice(0, 80), username: r.username, password_hash: r.password_hash,
        plan: trial ? "trial" : "full", trial_days: n,
        trial_ends_at: trial ? new Date(now.getTime() + n! * 86400_000).toISOString() : null,
        signed_up_at: now.toISOString(),
      }).select("id").single();
      if (error) return err(error.message, 500);
      await db().from("nexavideo_requests").update({ status: "approved", decided_at: now.toISOString(), user_id: u.id }).eq("id", r.id);
      if (r.email) {
        try {
          await new Resend(process.env.RESEND_API_KEY).emails.send({
            from: "Nexa Video <info@nexavisiongroup.com>", to: r.email,
            subject: "You're in — Nexa Video",
            html: `<div style="font-family:system-ui,sans-serif;background:#0b0c10;color:#e6e6e6;padding:28px;border-radius:14px">
              <div style="font-size:26px;font-weight:900;letter-spacing:4px;color:#4FA3FF">NEXA <span style="font-size:13px;color:#9aa0aa;letter-spacing:6px">VIDEO</span></div>
              <h2 style="margin:18px 0 8px">You're in, ${r.name.replace(/[<>&]/g, "")}! 🎬</h2>
              <p style="color:#c4c9d2">${trial ? `Your ${n}-day free trial has started.` : "Your account is ready."} Sign in with the username <b>${r.username}</b> and the password you chose.</p>
              <p style="margin:22px 0"><a href="https://nexavisiongroup.com/nexavideo" style="background:#fff;color:#0b0c10;padding:12px 22px;border-radius:24px;font-weight:700;text-decoration:none">Download the app</a></p></div>`,
          });
        } catch { /* account is live either way */ }
      }
      return NextResponse.json({ ok: true, username: r.username, emailed: !!r.email });
    }
    case "dismiss_request": {
      await db().from("nexavideo_requests").update({ status: "dismissed", decided_at: new Date().toISOString() }).eq("id", id);
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
