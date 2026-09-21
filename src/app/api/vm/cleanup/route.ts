import { NextRequest, NextResponse } from "next/server";
import { db, pcc, type VmUser } from "@/lib/vm";

// Nexa Cloud self-cleaning. Runs daily from Vercel Cron (CRON_SECRET bearer). Nothing here needs an
// admin to remember anything; the point is that nothing piles up over the years.
//   1. Used links are already gone: redeeming a link nulls its token in the same write.
//   2. Expired, never-used links: a reset link just loses its token; a sign-up link that nobody
//      redeemed is removed with its row, and the phone that was built for it is wiped and powered
//      off so the slot is free again.
//   3. Ended trials: phone powered off right away (data kept). If nobody reactivates or pays within
//      TRIAL_GRACE_DAYS, the account is deleted and its phone is wiped.
//   4. Turned-off accounts keep their phone off (in case the rack rebooted and started it).
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TRIAL_GRACE_DAYS = 30;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || auth !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = Date.now();
  const { data, error } = await db().from("vm_users").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const out = { invites_removed: 0, tokens_cleared: 0, trials_powered_off: 0, trials_deleted: 0, phones_wiped: [] as string[] };
  for (const u of (data || []) as VmUser[]) {
    const tokenDead = !!u.token_hash && !!u.token_expires && new Date(u.token_expires).getTime() < now;

    if (tokenDead && !u.username) {                        // sign-up link nobody used
      await db().from("vm_users").delete().eq("id", u.id);
      if (u.phone_id) { await pcc(`/vm/${u.phone_id}/wipe`, "POST"); out.phones_wiped.push(u.phone_id); }
      out.invites_removed++;
      continue;
    }
    if (tokenDead) {                                       // stale password-reset link
      await db().from("vm_users").update({ token_hash: null, token_kind: null, token_expires: null }).eq("id", u.id);
      out.tokens_cleared++;
    }
    if (u.plan === "trial" && u.trial_ends_at) {
      const ended = new Date(u.trial_ends_at).getTime();
      if (ended + TRIAL_GRACE_DAYS * 86400_000 < now) {    // long gone: remove account + data
        await db().from("vm_users").delete().eq("id", u.id);
        if (u.phone_id) { await pcc(`/vm/${u.phone_id}/wipe`, "POST"); out.phones_wiped.push(u.phone_id); }
        out.trials_deleted++;
        continue;
      }
      if (ended < now && u.phone_id) { await pcc(`/vm/${u.phone_id}/off`, "POST"); out.trials_powered_off++; }
    }
    if (!u.enabled && u.phone_id) await pcc(`/vm/${u.phone_id}/off`, "POST");
  }
  return NextResponse.json({ ok: true, ...out });
}
