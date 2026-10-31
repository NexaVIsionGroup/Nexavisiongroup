import { NextRequest, NextResponse } from "next/server";
import { notifyDb, notifyAdmin } from "@/lib/notify";

// Admin bell + sidebar badges + phone push subscriptions.
// Auth: middleware requires a Supabase session for /api/admin/*.
//   GET                                  → { items, unread, badges: { "/admin/inbox": n, ... } }
//   POST {action:"read", id} | {action:"read_all"} | {action:"read_path", path}
//   POST {action:"subscribe", subscription, device} | {action:"unsubscribe", endpoint} | {action:"test"}
export const dynamic = "force-dynamic";

const PAGES = ["/admin/inbox", "/admin/questionnaires", "/admin/nexavideo", "/admin/verification", "/admin/phones", "/admin/devices", "/admin/customers"];

export async function GET() {
  const db = notifyDb();
  const [items, unread, emails, quest, requests] = await Promise.all([
    db.from("admin_notifications").select("id,type,title,message,action_url,read,created_at").order("created_at", { ascending: false }).limit(40),
    db.from("admin_notifications").select("action_url").eq("read", false).limit(500),
    db.from("email_messages").select("id", { count: "exact", head: true }).eq("read", false).eq("folder", "inbox").eq("is_draft", false),
    db.from("client_questionnaires").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    db.from("nexavideo_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  // badge per admin page: real "waiting" counts where they exist, else unread alerts that point at that page
  const badges: Record<string, number> = {};
  for (const p of PAGES) badges[p] = 0;
  for (const r of unread.data || []) {
    const p = PAGES.find((x) => (r.action_url || "").startsWith(x));
    if (p) badges[p]++;
  }
  badges["/admin/inbox"] = emails.count || 0;
  badges["/admin/questionnaires"] = quest.count || 0;
  badges["/admin/nexavideo"] = Math.max(badges["/admin/nexavideo"], requests.count || 0);
  return NextResponse.json({ items: items.data || [], unread: (unread.data || []).length, badges });
}

export async function POST(req: NextRequest) {
  const db = notifyDb();
  const b = await req.json().catch(() => ({}));
  switch (b.action) {
    case "read":
      await db.from("admin_notifications").update({ read: true }).eq("id", String(b.id ?? ""));
      return NextResponse.json({ ok: true });
    case "read_all":
      await db.from("admin_notifications").update({ read: true }).eq("read", false);
      return NextResponse.json({ ok: true });
    case "read_path": {                       // visiting a page clears its alerts
      const path = String(b.path ?? "");
      if (path.startsWith("/admin")) await db.from("admin_notifications").update({ read: true }).eq("read", false).like("action_url", `${path}%`);
      return NextResponse.json({ ok: true });
    }
    case "subscribe": {
      const s = b.subscription || {};
      if (!s.endpoint || !s.keys?.p256dh || !s.keys?.auth) return NextResponse.json({ error: "Bad subscription." }, { status: 400 });
      const { error } = await db.from("push_subscriptions").upsert(
        { endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, device: String(b.device ?? "").slice(0, 120) },
        { onConflict: "endpoint" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "unsubscribe":
      await db.from("push_subscriptions").delete().eq("endpoint", String(b.endpoint ?? ""));
      return NextResponse.json({ ok: true });
    case "test": {
      const r = await notifyAdmin({ type: "test", title: "Notifications are on ✅", message: "This is how NexaVision alerts will look on this phone.", url: "/admin" });
      return NextResponse.json({ ok: true, pushed: r.pushed });
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
