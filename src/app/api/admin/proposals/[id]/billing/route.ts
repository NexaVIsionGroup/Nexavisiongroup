import { NextResponse } from "next/server";
import { billingAction, billingStatus, db, ensureSubscription, logEvent } from "@/lib/proposals/server";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const { data: p } = await db().from("proposals").select("*").eq("id", id).maybeSingle();
  return p;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const p = await load(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!p.signed_at || p.signed_snapshot?.autopay_opt_in !== true) return NextResponse.json({ billing: null });
  try {
    await ensureSubscription(p);
    return NextResponse.json({ billing: await billingStatus(p.id) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Billing is not available right now." }, { status: 502 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const p = await load(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!p.signed_at || p.signed_snapshot?.autopay_opt_in !== true) return NextResponse.json({ error: "This customer didn't choose automatic billing." }, { status: 409 });
  const b = await req.json().catch(() => ({}));
  const allowed = ["update", "approve", "pause", "resume", "cancel", "resolve"];
  if (!allowed.includes(b.action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  try {
    await ensureSubscription(p);
    const { action, ...rest } = b;
    await billingAction(p.id, action, rest);
    await logEvent(p.id, `billing_${action}`, req, rest);
    return NextResponse.json({ billing: await billingStatus(p.id) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Billing could not be updated." }, { status: 400 });
  }
}
