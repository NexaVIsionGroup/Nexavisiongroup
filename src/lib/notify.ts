// Admin notifications — one call for everything that should reach the owner:
//   1. a row in admin_notifications (the 🔔 bell in the admin header + sidebar badges)
//   2. a Web Push to every device that turned notifications on (push_subscriptions) — arrives like any app's
//      notification on the phone, even with the admin closed; tapping it opens `url`.
// Never throws: a failed notification must not fail the request that triggered it.
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export type NotifyKind =
  | "email" | "questionnaire_submitted" | "contact" | "intake" | "verification"
  | "phone_lead" | "phone_order" | "vm_signup" | "nexavideo_request" | "nexavideo_signup" | "proposal" | "test";

// reads must be live (Next 14 caches fetch GETs in route handlers otherwise)
const noStore: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });
export const notifyDb = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: noStore } });

let vapidReady = false;
function vapid() {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:info@nexavisiongroup.com", pub, priv);
  vapidReady = true;
  return true;
}

export async function notifyAdmin(n: {
  type: NotifyKind; title: string; message?: string; url?: string; entityType?: string; entityId?: string;
}): Promise<{ pushed: number }> {
  const db = notifyDb();
  const url = n.url || "/admin";
  try {
    await db.from("admin_notifications").insert({
      type: n.type, title: n.title.slice(0, 200), message: (n.message || "").slice(0, 500),
      entity_type: n.entityType || null, entity_id: n.entityId || null, action_url: url,
    });
  } catch { /* the push below can still go out */ }

  let pushed = 0;
  if (!vapid()) return { pushed };
  try {
    const { data } = await db.from("push_subscriptions").select("id,endpoint,p256dh,auth");
    const payload = JSON.stringify({ title: n.title, body: n.message || "", url, tag: n.type });
    await Promise.all((data || []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" });
        pushed++;
        await db.from("push_subscriptions").update({ last_ok_at: new Date().toISOString() }).eq("id", s.id);
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", s.id);   // phone unsubscribed
      }
    }));
  } catch { /* no-op */ }
  return { pushed };
}
