import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notifyDb } from "@/lib/notify";
import { billingAction, billingStatus } from "@/lib/proposals/server";

// The NexaBooks control centre: customers, plans, invitations, support visits (through NexaBooks' control API)
// and their monthly card billing (through the same billing engine as proposals, keyed "nb-<slug>").

const BOOKS = () => (process.env.NEXABOOKS_URL || "https://books.nexavisiongroup.com").replace(/\/$/, "");
export const SITE = "https://nexavisiongroup.com";

/** Only full admins (admin_users.role = "admin") manage NexaBooks customers. Returns their name for the audit trail. */
export async function requireBooksAdmin(): Promise<{ email: string; name: string } | null> {
  const jar = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data: admin } = await notifyDb().from("admin_users").select("role, display_name").eq("email", user.email.toLowerCase()).maybeSingle();
  if (admin?.role !== "admin") return null;
  return { email: user.email, name: admin.display_name || (user.user_metadata?.full_name as string | undefined) || user.email };
}

export async function control<T = any>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const key = process.env.NEXA_CONTROL_KEY;
  if (!key) throw new Error("NexaBooks control key is not set on this server.");
  const r = await fetch(`${BOOKS()}/api/control/${action}`, {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
    cache: "no-store", signal: AbortSignal.timeout(45000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `NexaBooks said ${r.status}`);
  return j as T;
}

// ── Billing ──

export const orderId = (slug: string) => `nb-${slug}`.slice(0, 40);

export type Billing = {
  status: string; amount: number; next_billing_date: string | null; card_brand: string | null; card_last4: string | null; card_url: string | null;
  failed_attempts: number; last_error: string | null; charge_count: number; history: { at: string; amount: number; status: string; error: string | null }[];
  paid_total: number; owed: number;
};

/** Billing status from the engine, with what they've paid and what they owe worked out. Null when billing was never started. */
export async function billingFor(ref: string | null | undefined): Promise<Billing | null> {
  if (!ref) return null;
  const j = await billingStatus(ref).catch((e: Error) => { if (/not found/i.test(e.message)) return null; throw e; });
  if (!j) return null;
  const paid_total = (j.history || []).filter((h: any) => h.status === "success").reduce((s: number, h: any) => s + Number(h.amount), 0);
  const owed = j.status === "past_due" || (j.failed_attempts > 0 && j.status !== "cancelled") ? Number(j.amount) + Number(j.extra_amount || 0) : 0;
  return { ...j, paid_total, owed };
}

/** Sets up monthly card billing for a NexaBooks customer and returns the link where they add their card. */
export async function startBilling(c: { id: string; slug: string; name: string; contact_email: string | null; monthly_price_cents: number; plan: string; trial_ends: string | null }, firstCharge: string, staff: string) {
  if (!c.contact_email) throw new Error("This customer has no email address.");
  if (c.monthly_price_cents < 100) throw new Error("Set a monthly price of at least $1 first.");
  const ref = orderId(c.slug);
  const view = await billingAction(ref, "ensure", {
    amount: c.monthly_price_cents / 100, plan_name: `NexaBooks ${c.plan.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase())}`, reference: c.slug,
    plan_note: "NexaBooks bookkeeping, billed monthly. Cancel any time.", return_url: `${SITE}/books/card-saved`,
    customer: { name: c.name, email: c.contact_email },
  });
  if (firstCharge) await billingAction(ref, "update", { next_billing_date: firstCharge, notify: false });
  await control("update", { id: c.id, staff, fields: { billing_ref: ref, card_link: view.card_url, billing_status: view.status } });
  return { ref, card_url: view.card_url as string, status: view.status as string };
}
