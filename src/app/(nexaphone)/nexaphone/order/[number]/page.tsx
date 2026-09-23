import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createHmac } from "crypto";
import Nav from "@/components/nexaphone/Nav";
import { createAdminClient } from "@/lib/supabase/server";
import { money } from "@/components/nexaphone/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Your order | Nexa Pro" }, robots: { index: false, follow: false } };

const STEPS = [
  { id: "requested", label: "Order received" },
  { id: "invoiced", label: "Payment link sent" },
  { id: "paid", label: "Paid" },
  { id: "building", label: "Building and testing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

type Item = { name: string; ram: number; storage: string; color: string; qty: number; line_total: number };

/** Ask JHPS (signed) whether the order's invoice has been paid. Never trusts ?paid=1. */
async function jhpsPaid(orderId: string): Promise<boolean> {
  const secret = process.env.NEXA_ORDER_SECRET;
  const base = process.env.JHPS_BASE_URL;
  if (!secret || !base) return false;
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = "sha256=" + createHmac("sha256", secret).update(`${ts}.${orderId}`).digest("hex");
  try {
    const r = await fetch(`${base}/api/external/nexa-order?order_id=${encodeURIComponent(orderId)}`, {
      headers: { "X-Nexa-Timestamp": ts, "X-Nexa-Signature": sig },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return false;
    const j = await r.json();
    return j.status === "paid";
  } catch {
    return false;
  }
}

export default async function OrderPage({ params }: { params: { number: string } }) {
  const number = decodeURIComponent(params.number).toUpperCase();
  if (!/^NXO-\d{4}-[A-Z0-9]{6,8}$/.test(number)) notFound();
  const db = createAdminClient();
  const { data: o } = await db.from("nexaphone_orders").select("*").eq("order_number", number).maybeSingle();
  if (!o) notFound();

  let status: string = o.status;
  if ((status === "requested" || status === "invoiced") && o.jhps_invoice_number && (await jhpsPaid(number))) {
    status = "paid";
    await db.from("nexaphone_orders").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", o.id);
  }
  const at = STEPS.findIndex((s) => s.id === status);
  const cancelled = status === "cancelled";
  const first = String(o.customer_name || "").split(" ")[0];

  return (
    <>
      <Nav dock={false} />
      <main>
        <section className="np-checkout">
          <div className="np-wrap" style={{ maxWidth: 720 }}>
            <Link href="/nexaphone" className="np-back">
              ← Nexa Pro
            </Link>
            <h1 className="np-display np-h2" style={{ margin: "18px 0 8px" }}>
              {cancelled ? "Order cancelled." : status === "paid" || at > 2 ? `Thanks, ${first}.` : `Order ${number}`}
            </h1>
            <p className="np-done-num np-num" style={{ textAlign: "left", fontSize: 22 }}>
              {number}
            </p>

            {!cancelled && (
              <ol className="np-track" aria-label="Order progress">
                {STEPS.map((s, i) => (
                  <li key={s.id} data-state={i < at ? "done" : i === at ? "now" : "next"}>
                    <span className="np-track-dot" />
                    {s.label}
                  </li>
                ))}
              </ol>
            )}

            <div className="np-panel-dark np-summary" style={{ marginTop: 26 }}>
              <h2>Your phones</h2>
              <ul>
                {(o.items as Item[]).map((it, i) => (
                  <li key={i} style={{ gridTemplateColumns: "1fr auto" }}>
                    <div>
                      <strong>
                        {it.name} × {it.qty}
                      </strong>
                      <small>
                        {it.ram}GB / {it.storage}, {it.color}
                      </small>
                    </div>
                    <b className="np-num">{money(it.line_total)}</b>
                  </li>
                ))}
              </ul>
              <div className="np-sum-row">
                <span>Subtotal</span>
                <b className="np-num">{money(Number(o.subtotal))}</b>
              </div>
            </div>
            <p className="np-footnote" style={{ marginTop: 18 }}>
              Questions about this order? Reply to your confirmation email or write to info@nexavisiongroup.com.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
