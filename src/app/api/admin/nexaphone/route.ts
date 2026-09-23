import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Admin: Nexa Pro orders + leads. Auth is enforced by middleware (/api/admin/*).
export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["requested", "invoiced", "paid", "building", "shipped", "delivered", "cancelled"] as const;
const LEAD_STATUSES = ["new", "contacted", "won", "lost"] as const;

export async function GET() {
  const db = createAdminClient();
  const [orders, leads] = await Promise.all([
    db.from("nexaphone_orders").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("nexaphone_leads").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  if (orders.error || leads.error)
    return NextResponse.json({ error: orders.error?.message || leads.error?.message }, { status: 500 });
  return NextResponse.json({ orders: orders.data, leads: leads.data });
}

export async function PATCH(req: NextRequest) {
  const { table, id, status, jhps_invoice_number } = await req.json();
  const db = createAdminClient();
  if (table === "orders") {
    if (status && !(ORDER_STATUSES as readonly string[]).includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) update.status = status;
    if (typeof jhps_invoice_number === "string") update.jhps_invoice_number = jhps_invoice_number.trim().slice(0, 40) || null;
    const { error } = await db.from("nexaphone_orders").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (table === "leads") {
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const { error } = await db.from("nexaphone_leads").update({ status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid table" }, { status: 400 });
}
