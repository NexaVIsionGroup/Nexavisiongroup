import { NextResponse, type NextRequest } from "next/server";
import { billingAction } from "@/lib/proposals/server";
import { billingFor, control, requireBooksAdmin, startBilling } from "@/lib/nexabooks/control";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (e: unknown, status = 400) => NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status });

// GET            → every NexaBooks customer, with plans and billing (paid, owed, next charge)
// GET ?id=<id>   → one customer in full: people, banks, activity, support visits, billing history
export async function GET(req: NextRequest) {
  const admin = await requireBooksAdmin();
  if (!admin) return fail("Only NexaVision admins can manage NexaBooks customers.", 403);
  try {
    const planFor = req.nextUrl.searchParams.get("plan");
    if (planFor) return NextResponse.json(await control("plan", { id: planFor }));
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const d = await control("customer", { id });
      const billing = await billingFor(d.customer.billing_ref).catch((e) => ({ error: e.message }));
      // Keep NexaBooks' copy of the billing status current (it shows the customer an "add a card" note).
      if (billing && !("error" in billing) && billing.status !== d.customer.billing_status) {
        await control("update", { id: d.customer.id, fields: { billing_status: billing.status, card_link: billing.card_url }, staff: "billing sync" }).catch(() => {});
      }
      return NextResponse.json({ ...d, billing });
    }
    const j = await control("customers");
    const billed = j.customers.filter((c: any) => c.billing_ref);
    const billing = await Promise.all(billed.map((c: any) => billingFor(c.billing_ref).catch(() => null)));
    const byId: Record<string, any> = {};
    billed.forEach((c: any, i: number) => { byId[c.id] = billing[i]; });
    await Promise.all(billed.map((c: any) => {
      const b = byId[c.id];
      return b && b.status !== c.billing_status ? control("update", { id: c.id, fields: { billing_status: b.status }, staff: "billing sync" }).catch(() => {}) : null;
    }));
    return NextResponse.json({ customers: j.customers.map((c: any) => ({ ...c, billing: byId[c.id] ?? null })), plans: j.plans });
  } catch (e) { return fail(e, 502); }
}

// POST { action, ... }
export async function POST(req: NextRequest) {
  const admin = await requireBooksAdmin();
  if (!admin) return fail("Only NexaVision admins can manage NexaBooks customers.", 403);
  const b = await req.json().catch(() => ({}));
  const staff = admin.name;
  try {
    switch (b.action) {
      case "create-personal": return NextResponse.json(await control("create-personal", { ...b, staff }));
      case "update": return NextResponse.json(await control("update", { id: b.id, fields: b.fields, staff }));
      case "plan-save": return NextResponse.json(await control("plan-save", { id: b.id, plan: b.plan, staff }));
      case "add-member": return NextResponse.json(await control("add-member", { id: b.id, name: b.name, email: b.email, send: b.send !== false, staff }));
      case "invite": return NextResponse.json(await control("invite", { id: b.id, send: b.send !== false, staff }));
      case "support-link": return NextResponse.json(await control("support-link", { id: b.id, reason: b.reason, staff }));
      case "plan-save": return NextResponse.json(await control("plan-save", { plan: b.plan, staff }));
      case "sync": return NextResponse.json(await control("sync", { id: b.id, staff }));
      case "close": {
        const d = await control("customer", { id: b.id });
        if (d.customer.billing_ref) await billingAction(d.customer.billing_ref, "cancel").catch(() => {});
        return NextResponse.json(await control("close", { id: b.id, confirm: b.confirm, staff }));
      }
      case "billing-start": {
        const d = await control("customer", { id: b.id });
        const first = /^\d{4}-\d{2}-\d{2}$/.test(b.first_charge || "") ? b.first_charge : "";
        return NextResponse.json(await startBilling(d.customer, first, staff));
      }
      case "billing": {
        // pause | resume | cancel | update (amount, next_billing_date): straight to the billing engine.
        const d = await control("customer", { id: b.id });
        if (!d.customer.billing_ref) throw new Error("Billing hasn't been started for this customer.");
        if (!["pause", "resume", "cancel", "update"].includes(b.op)) throw new Error("Unknown billing action.");
        const fields: Record<string, unknown> = {};
        if (b.op === "update") {
          if (b.amount != null) fields.amount = Number(b.amount);
          if (b.next_billing_date) fields.next_billing_date = b.next_billing_date;
        }
        const view = await billingAction(d.customer.billing_ref, b.op, fields);
        const licence: Record<string, unknown> = { billing_status: view.status };
        if (fields.amount != null) licence.monthly_price_cents = Math.round(Number(fields.amount) * 100);
        await control("update", { id: b.id, fields: licence, staff });
        return NextResponse.json({ ok: true, billing: view });
      }
      default: return fail("Unknown action.");
    }
  } catch (e) { return fail(e); }
}
