import { NextRequest, NextResponse } from "next/server";
import { db, newToken, pcc, VM_PHONES, type VmUser } from "@/lib/vm";

// Admin management for virtual cloud phones + their users.
// Auth: middleware already requires a Supabase session for /api/admin/*.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SITE = "https://nexavisiongroup.com";
const INVITE_DAYS = 7;
const RESET_HOURS = 24;
const link = (token: string) => `${SITE}/vm/join/${token}`;
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

function publicUser(u: VmUser) {
  const pending = !!u.token_hash && !!u.token_expires && new Date(u.token_expires) > new Date();
  return {
    id: u.id, label: u.label, username: u.username, phone_id: u.phone_id, enabled: u.enabled,
    signed_up: !!u.username && !!u.password_hash,
    pending_link: pending ? u.token_kind : null,
    link_expires: pending ? u.token_expires : null,
    locked: !!u.locked_until && new Date(u.locked_until) > new Date(),
    created_at: u.created_at, signed_up_at: u.signed_up_at, last_login_at: u.last_login_at,
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
  return NextResponse.json({ users, phones, backend_ok: status.ok === true });
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
      const { data, error } = await db().from("vm_users").insert({
        label: String(body.label ?? "").slice(0, 80), phone_id: phone,
        token_hash: t.hash, token_kind: "invite",
        token_expires: new Date(Date.now() + INVITE_DAYS * 86400_000).toISOString(),
      }).select("*").single();
      if (error) return err(error.message, 500);
      await pcc(`/vm/${phone}/wipe`, "POST");            // fresh phone for a fresh person
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
