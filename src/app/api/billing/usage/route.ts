import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { billingAction, billingStatus, db, ensureSubscription, logEvent } from "@/lib/proposals/server";

export const dynamic = "force-dynamic";

/**
 * For the monthly billing agents. Sets what a customer's next automatic charge will be.
 *   Authorization: Bearer <BILLING_AGENT_KEY>
 *   POST { proposal: "NV-2611-43FC", period: "2026-12", usage_amount: 242, usage_note: "3.5% of $6,914 in online orders", monthly_price?: 900 }
 *   GET  ?proposal=NV-2611-43FC   returns status, next charge date and history
 * Safe to re-run: the same month replaces its amount, and a month already charged is refused with 409.
 * A total over the customer's limit is saved but waits for a person to approve it (needs_approval: true). Agents can't approve.
 */

function authorized(req: Request) {
  const key = process.env.BILLING_AGENT_KEY || "";
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (key.length < 32 || got.length !== key.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(key));
}

async function find(number: unknown) {
  if (typeof number !== "string" || !number.trim()) return null;
  const { data } = await db().from("proposals").select("*").eq("number", number.trim()).maybeSingle();
  return data;
}

const summary = (b: any) => ({
  status: b.status, monthly_price: b.amount, usage_amount: b.extra_amount, usage_note: b.extra_note, usage_period: b.extra_period,
  next_charge_total: Math.round((b.amount + b.extra_amount) * 100) / 100, next_charge_date: b.next_billing_date,
  last_billed_period: b.last_billed_period, needs_approval: b.needs_approval, charge_limit: b.charge_limit, card_on_file: !!b.card_last4, failed_attempts: b.failed_attempts, last_error: b.last_error, history: b.history,
});

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const p = await find(new URL(req.url).searchParams.get("proposal"));
  if (!p) return NextResponse.json({ error: "No proposal with that number." }, { status: 404 });
  if (!p.signed_at || p.signed_snapshot?.autopay_opt_in !== true) return NextResponse.json({ error: "This customer isn't on automatic billing." }, { status: 409 });
  try {
    await ensureSubscription(p);
    return NextResponse.json(summary(await billingStatus(p.id)));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Billing is not available." }, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const p = await find(b.proposal);
  if (!p) return NextResponse.json({ error: "No proposal with that number." }, { status: 404 });
  if (!p.signed_at || p.signed_snapshot?.autopay_opt_in !== true) return NextResponse.json({ error: "This customer isn't on automatic billing." }, { status: 409 });
  if (!/^\d{4}-\d{2}$/.test(String(b.period || ""))) return NextResponse.json({ error: "period is required and must look like 2026-12." }, { status: 400 });
  const usage = Number(b.usage_amount);
  if (!Number.isFinite(usage) || usage < 0) return NextResponse.json({ error: "usage_amount must be a number, 0 or more." }, { status: 400 });
  const update: Record<string, unknown> = { extra_amount: usage, extra_note: b.usage_note, period: b.period };
  if (b.monthly_price !== undefined) update.amount = Number(b.monthly_price);
  try {
    await ensureSubscription(p);
    await billingAction(p.id, "update", update);
    await logEvent(p.id, "billing_usage_reported", req, update);
    return NextResponse.json(summary(await billingStatus(p.id)));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Billing could not be updated.";
    return NextResponse.json({ error: message }, { status: /already billed/.test(message) ? 409 : 400 });
  }
}
