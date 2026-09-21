import { NextRequest, NextResponse } from "next/server";
import { db, newToken, pcc, VM_PHONES, trialState, type VmUser } from "@/lib/vm";

// Admin management for virtual cloud phones + their users.
// Auth: middleware already requires a Supabase session for /api/admin/*.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const INVITE_DAYS = 7;
const RESET_HOURS = 24;
// vm.nexavisiongroup.com/<code> is forwarded by the nexa-gate Worker to /vm/join/<code>
const link = (token: string) => `https://vm.nexavisiongroup.com/${token}`;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });
/** whole days, 1..365, or null when the value is not a usable number */
const days = (v: unknown) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 1 && n <= 365 ? n : null; };

function publicUser(u: VmUser) {
  const pending = !!u.token_hash && !!u.token_expires && new Date(u.token_expires) > new Date();
  return {
    id: u.id, label: u.label, username: u.username, phone_id: u.phone_id, enabled: u.enabled,
    signed_up: !!u.username && !!u.password_hash,
    pending_link: pending ? u.token_kind : null,
    link_expires: pending ? u.token_expires : null,
    locked: !!u.locked_until && new Date(u.locked_until) > new Date(),
    created_at: u.created_at, signed_up_at: u.signed_up_at, last_login_at: u.last_login_at,
    plan: u.plan, trial_days: u.trial_days, trial_ends_at: u.trial_ends_at,
    trial_expired: trialState(u).expired, trial_days_left: trialState(u).daysLeft,
    last_active_at: u.last_active_at, minutes_used: u.minutes_used || 0,
    // "in use" from the web side: the /vm page pings every minute while the phone view is open
    active_now: !!u.last_active_at && Date.now() - new Date(u.last_active_at).getTime() < 150_000,
  };
}

export async function GET() {
  const [{ data, error }, status] = await Promise.all([
    db().from("vm_users").select("*").order("created_at", { ascending: true }),
    pcc("/vm/status"),
  ]);
  if (error) return err(error.message, 500);
  const users = (data as VmUser[]).map(publicUser);
  const used = new Set(users.map((u) => u.phone_id).filter(Boolean));
  const phones = Object.entries(VM_PHONES).map(([id, p]) => ({
    id, label: p.label, url: `https://${p.host}`,
    assigned: used.has(id),
    state: ((status.phones as Record<string, unknown> | undefined)?.[id] as Record<string, unknown>) || null,
  }));
  const slots = Object.values((status.phones as Record<string, { running?: boolean; in_use?: boolean }> | undefined) || {});
  return NextResponse.json({
    users, phones, backend_ok: status.ok === true,
    rack: { free_gb: status.free_gb ?? null, running: slots.filter((x) => x.running).length, in_use: slots.filter((x) => x.in_use).length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const id = String(body.id ?? "");
  const getUser = async () => {
    const { data } = await db().from("vm_users").select("*").eq("id", id).maybeSingle();
    return data as VmUser | null;
  };
  const freePhone = async (): Promise<string | null> => {
    const { data } = await db().from("vm_users").select("phone_id");
    const used = new Set((data || []).map((r: { phone_id: string | null }) => r.phone_id));
    return Object.keys(VM_PHONES).find((p) => !used.has(p)) || null;
  };

  switch (action) {
    // New sign-up link = reserve a free slot, build a factory-fresh phone in it, boot it.
    case "invite": {
      const phone = await freePhone();
      if (!phone) return err("All phones are in use. Delete or unassign a user first.", 409);
      const t = newToken();
      // trial_days set -> free-trial link: same sign-up flow, but access ends N days after they sign up
      const trialDays = body.trial_days == null || body.trial_days === "" ? null : days(body.trial_days);
      if (body.trial_days != null && body.trial_days !== "" && !trialDays) return err("Trial length must be 1 to 365 days.");
      const { data, error } = await db().from("vm_users").insert({
        plan: trialDays ? "trial" : "full", trial_days: trialDays,
        label: String(body.label ?? "").slice(0, 80), phone_id: phone,
        token_hash: t.hash, token_kind: "invite",
        token_expires: new Date(Date.now() + INVITE_DAYS * 86400_000).toISOString(),
      }).select("*").single();
      if (error) return err(error.message, 500);
      await pcc(`/vm/${phone}/wipe`, "POST");            // fresh phone for a fresh person
      // If the rack has no spare memory right now the link is still good: the phone is built (wiped) and
      // simply starts when the person signs in.
      const on = await pcc(`/vm/${phone}/on`, "POST");
      return NextResponse.json({ ok: true, link: link(t.token), user: publicUser(data as VmUser), phone, phone_started: on.ok === true });
    }
    // Replace the pending link (invite not used yet) or issue a password-reset link.
    case "new_link":
    case "reset_link": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      const kind = u.username && u.password_hash ? "reset" : "invite";
      const t = newToken();
      const ms = kind === "reset" ? RESET_HOURS * 3600_000 : INVITE_DAYS * 86400_000;
      const { error } = await db().from("vm_users").update({
        token_hash: t.hash, token_kind: kind, token_expires: new Date(Date.now() + ms).toISOString(),
        failed_logins: 0, locked_until: null,
      }).eq("id", u.id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ ok: true, link: link(t.token), kind });
    }
    case "toggle": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      const enabled = !!body.enabled;
      await db().from("vm_users").update({ enabled }).eq("id", u.id);
      if (u.phone_id) await pcc(`/vm/${u.phone_id}/${enabled ? "on" : "off"}`, "POST");   // off = frees RAM/GPU
      return NextResponse.json({ ok: true });
    }
    // Reactivate / extend a trial: adds days on top of whatever is left (or from now if it already
    // ended), turns the phone back on. Works for a not-yet-redeemed trial link too (changes its length).
    case "add_days": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      const n = days(body.days);
      if (!n) return err("Days must be 1 to 365.");
      if (!u.trial_ends_at) {
        await db().from("vm_users").update({ plan: "trial", trial_days: n }).eq("id", u.id);
      } else {
        const base = Math.max(Date.now(), new Date(u.trial_ends_at).getTime());
        await db().from("vm_users").update({
          plan: "trial", trial_ends_at: new Date(base + n * 86400_000).toISOString(),
        }).eq("id", u.id);
      }
      if (u.phone_id && u.enabled) await pcc(`/vm/${u.phone_id}/on`, "POST");
      return NextResponse.json({ ok: true });
    }
    // full = no expiry (what a paid invoice will set later). trial = put them back on a clock.
    case "set_plan": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      if (body.plan === "full") {
        await db().from("vm_users").update({ plan: "full" }).eq("id", u.id);
        if (u.phone_id && u.enabled) await pcc(`/vm/${u.phone_id}/on`, "POST");
      } else {
        const n = days(body.days) || 7;
        await db().from("vm_users").update({
          plan: "trial", trial_days: n,
          trial_ends_at: u.username ? new Date(Date.now() + n * 86400_000).toISOString() : null,
        }).eq("id", u.id);
      }
      return NextResponse.json({ ok: true });
    }
    case "label": {
      await db().from("vm_users").update({ label: String(body.label ?? "").slice(0, 80) }).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    case "unlock": {
      await db().from("vm_users").update({ failed_logins: 0, locked_until: null }).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    // Move a user to another free phone, or pass phone_id "" to unassign (their phone is left as is).
    case "reassign": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      const target = String(body.phone_id ?? "");
      if (target && !VM_PHONES[target]) return err("Unknown phone.");
      if (target) {
        const { data: clash } = await db().from("vm_users").select("id").eq("phone_id", target).neq("id", u.id).maybeSingle();
        if (clash) return err("That phone is assigned to someone else.", 409);
        await pcc(`/vm/${target}/on`, "POST");
      }
      await db().from("vm_users").update({ phone_id: target || null }).eq("id", u.id);
      return NextResponse.json({ ok: true });
    }
    // Delete the account. The phone is powered off and wiped so nothing of theirs remains.
    case "delete": {
      const u = await getUser();
      if (!u) return err("User not found.", 404);
      await db().from("vm_users").delete().eq("id", u.id);
      if (u.phone_id && body.keep_phone !== true) await pcc(`/vm/${u.phone_id}/wipe`, "POST");
      return NextResponse.json({ ok: true });
    }
    case "power": {
      const phone = String(body.phone ?? "");
      if (!VM_PHONES[phone]) return err("Unknown phone.");
      return NextResponse.json(await pcc(`/vm/${phone}/${body.on ? "on" : "off"}`, "POST"));
    }
    // Per-phone resources. RAM / cores / storage are read by the emulator when the phone STARTS, so they
    // apply on the next start (restart:true does that now). sleep_min applies immediately. Storage only grows.
    case "config": {
      const phone = String(body.phone ?? "");
      if (!VM_PHONES[phone]) return err("Unknown phone.");
      const conf: Record<string, number> = {};
      for (const k of ["ram_mb", "cores", "data_gb", "sleep_min"]) {
        if (body[k] != null && body[k] !== "") {
          const n = Math.floor(Number(body[k]));
          if (!Number.isFinite(n)) return err(`${k} must be a number.`);
          conf[k] = n;
        }
      }
      const r = await pcc(`/vm/${phone}/config`, "POST", conf);
      if (body.restart === true) { await pcc(`/vm/${phone}/off`, "POST"); await pcc(`/vm/${phone}/on`, "POST"); }
      return NextResponse.json(r);
    }
    // Factory reset: wipe, then boot again if it is assigned to someone.
    case "wipe": {
      const phone = String(body.phone ?? "");
      if (!VM_PHONES[phone]) return err("Unknown phone.");
      await pcc(`/vm/${phone}/wipe`, "POST");
      const { data: owner } = await db().from("vm_users").select("id").eq("phone_id", phone).maybeSingle();
      if (owner) await pcc(`/vm/${phone}/on`, "POST");
      return NextResponse.json({ ok: true });
    }
    default:
      return err("Unknown action.");
  }
}
