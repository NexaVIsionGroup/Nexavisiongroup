import { NextRequest, NextResponse } from "next/server";
import { db, userFrom, bearer, latestRelease, downloadUrl, NV_COOKIE } from "@/lib/nexavideo";

// Newest APK for a signed-in user: web cookie, app bearer, or ?t=<app token> (the app's "Update" button opens
// this in the browser). Answers with a redirect to a 5-minute signed Storage URL — the bucket itself is private.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(NV_COOKIE)?.value || bearer(req.headers, req.nextUrl.searchParams.get("t"));
  const u = await userFrom(token);
  if (!u) return NextResponse.redirect(new URL("/nexavideo", req.url));
  const r = await latestRelease();
  if (!r) return NextResponse.json({ error: "No build published yet." }, { status: 404 });
  const url = await downloadUrl(r);
  if (!url) return NextResponse.json({ error: "Download is unavailable right now." }, { status: 503 });
  await db().from("nexavideo_users").update({ downloads: (u.downloads || 0) + 1 }).eq("id", u.id);
  return NextResponse.redirect(url, 302);
}
