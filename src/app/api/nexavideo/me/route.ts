import { NextRequest, NextResponse } from "next/server";
import { db, userFrom, bearer, latestRelease, trialState, TRIAL_ENDED, downloadsState, canDownload } from "@/lib/nexavideo";

// The app checks in on every launch: is this account still allowed, and is there a newer build?
// 401 = signed out / turned off (the app returns to its sign-in screen).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const u = await userFrom(bearer(req.headers));
  if (!u) return NextResponse.json({ ok: false, error: "Signed out or account turned off." }, { status: 401 });
  const trial = trialState(u);
  if (trial.expired) return NextResponse.json({ ok: false, error: TRIAL_ENDED, code: "trial_expired" }, { status: 401 });
  const v = req.nextUrl.searchParams;
  await db().from("nexavideo_users").update({
    last_seen_at: new Date().toISOString(),
    app_version: v.get("v")?.slice(0, 20) || u.app_version,
    device: v.get("device")?.slice(0, 80) || u.device,
  }).eq("id", u.id);
  // while downloads are paused, apps aren't offered the update either (allow-listed testers still are)
  const r = canDownload(await downloadsState(), u.username) ? await latestRelease() : null;
  return NextResponse.json({
    ok: true, username: u.username,
    trial: trial.onTrial ? { daysLeft: trial.daysLeft, endsAt: u.trial_ends_at } : null,
    latest: r ? { versionCode: r.version_code, versionName: r.version_name, notes: r.notes, size: r.size_bytes } : null,
  });
}
