import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { db, linkState, logEvent } from "@/lib/proposals/server";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** True when the browser has a NexaVision admin login. Only staff can sign in (admin login or team invite). */
async function isAdmin() {
  const jar = cookies();
  if (!jar.getAll().some((c) => c.name.startsWith("sb-"))) return false;
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => jar.getAll(), setAll: () => {} },
    });
    return !!(await supabase.auth.getUser()).data.user;
  } catch {
    return false;
  }
}

/**
 * Sent by the customer's browser, never from the server render, so link previews
 * in texts and email scanners don't count as the customer opening it.
 */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  let body: { type?: string; seconds?: number; from?: string } = {};
  try { body = JSON.parse(await req.text()); } catch { /* sendBeacon with an empty body */ }
  const supabase = db();
  const { data: p } = await supabase.from("proposals").select("id,status,title,number,client_name,client_company,first_viewed_at,view_count,seconds_viewed,link_enabled,signed_at,expires_at").eq("token", params.token).maybeSingle();
  if (!p || linkState(p) !== "ok") return NextResponse.json({ ok: false });
  // Our own opens (logged in as admin) don't count as views, time, or the first-open alert.
  if (await isAdmin()) return NextResponse.json({ ok: true, counted: false });

  const now = new Date().toISOString();
  if (body.type === "open") {
    const patch: Record<string, unknown> = { view_count: (p.view_count || 0) + 1, last_viewed_at: now };
    if (!p.first_viewed_at) patch.first_viewed_at = now;
    if (p.status === "sent") patch.status = "viewed";
    await supabase.from("proposals").update(patch).eq("id", p.id);
    await logEvent(p.id, "opened", req, body.from ? { from: String(body.from).slice(0, 20) } : {});
    if (!p.first_viewed_at) {
      await notifyAdmin({ type: "proposal", title: `👀 Opened: ${p.client_company || p.client_name || p.title}`, message: `${p.number} was just opened for the first time.`, url: `/admin/proposals/${p.id}`, entityType: "proposal", entityId: p.id });
    }
  } else if (body.type === "time") {
    const s = Math.max(0, Math.min(3600, Math.round(Number(body.seconds) || 0)));
    if (s > 0) await supabase.from("proposals").update({ seconds_viewed: (p.seconds_viewed || 0) + s, last_viewed_at: now }).eq("id", p.id);
  }
  return NextResponse.json({ ok: true });
}
