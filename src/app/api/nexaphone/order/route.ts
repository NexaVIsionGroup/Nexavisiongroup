import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { createHmac, randomBytes } from "crypto";
import { ADDONS, money, productBySlug } from "@/components/nexaphone/catalog";
import { shipLabel, verifyQuote, type ShipOption } from "@/lib/nexaphone/shipping";

// Nexa Pro order. Prices are recomputed here from the catalog — the browser
// only says what it wants, never what it costs. With NEXA_AUTO_CHECKOUT=1 the
// order becomes a Nexa-branded JHPS invoice and the buyer goes straight to pay;
// otherwise we email a secure payment link manually.

const resend = new Resend(process.env.RESEND_API_KEY);
const INBOX = "info@nexavisiongroup.com";

type InItem = { slug: string; ram: number; storage: string; color: string; addons: string[]; qty: number };
type InBody = {
  customer: { name: string; email: string; phone?: string; company?: string };
  address: { line1: string; line2?: string; city: string; state: string; zip: string };
  items: InItem[];
  notes?: string;
  shipping?: { token: string; option: string };
  website?: string; // honeypot
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Automatic checkout (off unless NEXA_AUTO_CHECKOUT=1): create the Nexa-branded
 * invoice in JHPS server-to-server (HMAC-signed) and return its pay link.
 * Any failure falls back to the manual flow (we email a link within a day).
 */
async function createJhpsInvoice(p: {
  orderId: string;
  customer: { name: string; email: string; phone: string; company: string };
  address: { line1: string; line2: string; city: string; state: string; zip: string };
  items: { name: string; ram: number; storage: string; color: string; addons: string[]; qty: number; unit_price: number }[];
  ship: ShipOption;
  notes: string;
}): Promise<{ invoice_number: string; pay_url: string } | null> {
  const secret = process.env.NEXA_ORDER_SECRET;
  const base = process.env.JHPS_BASE_URL;
  if (process.env.NEXA_AUTO_CHECKOUT !== "1" || !secret || !base) return null;
  const body = JSON.stringify({
    order_id: p.orderId,
    customer: { ...p.customer, address: p.address },
    items: p.items.map((i) => ({
      description: `${i.name}, ${i.ram}GB / ${i.storage}, ${i.color}, like new${i.addons.length ? ` + ${i.addons.join(", ")}` : ""}`,
      quantity: i.qty,
      unit_price: i.unit_price,
    })),
    shipping: { description: `Shipping: ${shipLabel(p.ship)}`, amount: p.ship.amount },
    notes: p.notes,
    return_url: `https://nexavisiongroup.com/nexaphone/order/${p.orderId}`,
  });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = "sha256=" + createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  try {
    const r = await fetch(`${base}/api/external/nexa-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Nexa-Timestamp": ts, "X-Nexa-Signature": sig },
      body,
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      console.error("jhps invoice", r.status, await r.text());
      return null;
    }
    return await r.json();
  } catch (e) {
    console.error("jhps invoice", e);
    return null;
  }
}

function orderNumber() {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const d = new Date();
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const bytes = randomBytes(8);
  let r = "";
  for (let i = 0; i < 8; i++) r += a[bytes[i] % a.length];
  return `NXO-${ym}-${r}`;
}

export async function POST(req: Request) {
  let body: InBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ ok: true, orderNumber: "NXO-0000-HONEY" }); // bot

  const customer = {
    name: str(body.customer?.name, 120),
    email: str(body.customer?.email, 160).toLowerCase(),
    phone: str(body.customer?.phone, 40),
    company: str(body.customer?.company, 160),
  };
  const address = {
    line1: str(body.address?.line1),
    line2: str(body.address?.line2),
    city: str(body.address?.city, 80),
    state: str(body.address?.state, 40),
    zip: str(body.address?.zip, 12),
  };
  if (!customer.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email))
    return NextResponse.json({ error: "Enter your name and a valid email." }, { status: 400 });
  if (!address.line1 || !address.city || !address.state || !address.zip)
    return NextResponse.json({ error: "Enter a complete shipping address." }, { status: 400 });
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30)
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const items = [];
  for (const it of body.items) {
    const p = productBySlug(str(it.slug, 60));
    const cfg = p?.configs.find((c) => c.ram === Number(it.ram) && c.storage === str(it.storage, 10));
    const color = p?.colors.find((c) => c.name === str(it.color, 40));
    const qty = Math.floor(Number(it.qty));
    if (!p || !cfg || !color || !(qty >= 1 && qty <= 99))
      return NextResponse.json({ error: "Something in your cart is no longer available. Refresh and try again." }, { status: 400 });
    const addons = (Array.isArray(it.addons) ? it.addons : []).map((a) => ADDONS.find((x) => x.id === a)).filter(Boolean) as (typeof ADDONS)[number][];
    const unit = cfg.price + addons.reduce((s, a) => s + a.price, 0);
    items.push({
      slug: p.slug,
      name: p.name,
      ram: cfg.ram,
      storage: cfg.storage,
      color: color.name,
      addons: addons.map((a) => a.name),
      qty,
      unit_price: unit,
      line_total: unit * qty,
    });
  }
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const phones = items.reduce((s, i) => s + i.qty, 0);
  const ship = verifyQuote(str(body.shipping?.token, 4000), str(body.shipping?.option, 80), address, phones);
  if (!ship) return NextResponse.json({ error: "Shipping prices changed. Pick a shipping option again." }, { status: 409 });
  const shipping = ship.amount;
  const number = orderNumber();

  const db = createAdminClient();
  const { error } = await db.from("nexaphone_orders").insert({
    order_number: number,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone || null,
    company: customer.company || null,
    shipping_address: address,
    items,
    subtotal,
    shipping,
    total_before_tax: subtotal + shipping,
    shipping_method: shipLabel(ship),
    notes: str(body.notes, 1000) || null,
  });
  if (error) {
    console.error("nexaphone order insert", error);
    return NextResponse.json({ error: "We couldn't save your order. Try again in a minute." }, { status: 500 });
  }

  const invoice = await createJhpsInvoice({ orderId: number, customer, address, items, ship, notes: str(body.notes, 800) });
  if (invoice) {
    await db.from("nexaphone_orders").update({ status: "invoiced", jhps_invoice_number: invoice.invoice_number, updated_at: new Date().toISOString() }).eq("order_number", number);
  }
  const payLink = invoice?.pay_url || null;

  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #1c2a33"><b>${esc(i.name)}</b> × ${i.qty}<br><span style="color:#8fa3b0;font-size:13px">${i.ram}GB / ${esc(i.storage)}, ${esc(i.color)}${i.addons.length ? `<br>${esc(i.addons.join(", "))}` : ""}</span></td><td style="padding:10px 0;border-bottom:1px solid #1c2a33;text-align:right">${money(i.line_total)}</td></tr>`
    )
    .join("");
  const table = `<table style="width:100%;border-collapse:collapse;font-size:15px">${rows}<tr><td style="padding:12px 0"><b>Subtotal</b></td><td style="text-align:right"><b>${money(subtotal)}</b></td></tr><tr><td style="color:#8fa3b0">Shipping, ${esc(shipLabel(ship))}</td><td style="text-align:right;color:#8fa3b0">${money(shipping)}</td></tr></table>`;
  const addr = `${esc(address.line1)}${address.line2 ? `, ${esc(address.line2)}` : ""}<br>${esc(address.city)}, ${esc(address.state)} ${esc(address.zip)}`;
  const shell = (inner: string) =>
    `<div style="background:#0d1419;padding:32px 20px;font-family:system-ui,sans-serif;color:#e9eef0"><div style="max-width:560px;margin:0 auto"><div style="font-weight:800;font-size:22px;letter-spacing:.04em;margin-bottom:24px">NEXA PRO</div>${inner}</div></div>`;

  try {
    await Promise.all([
      resend.emails.send({
        from: "Nexa Pro Orders <info@nexavisiongroup.com>",
        to: INBOX,
        replyTo: customer.email,
        subject: `New Nexa Pro order ${number}: ${money(subtotal + shipping)} + tax`,
        html: shell(
          `<h2 style="margin:0 0 6px">Order ${number}</h2><p style="color:#8fa3b0;margin:0 0 20px">${invoice ? `Invoice ${invoice.invoice_number} was created in JHPS and the buyer was sent to pay.` : "Send the Nexa-branded invoice from JHPS admin."}</p>${table}<p style="margin-top:20px"><b>${esc(customer.name)}</b>${customer.company ? `, ${esc(customer.company)}` : ""}<br>${esc(customer.email)}${customer.phone ? `<br>${esc(customer.phone)}` : ""}</p><p>${addr}</p>${body.notes ? `<p style="color:#8fa3b0">Notes: ${esc(str(body.notes, 1000))}</p>` : ""}`
        ),
      }),
      resend.emails.send({
        from: "Nexa Pro <info@nexavisiongroup.com>",
        to: customer.email,
        replyTo: INBOX,
        subject: `We have your Nexa Pro order (${number})`,
        html: shell(
          `<h2 style="margin:0 0 10px">Your order is in, ${esc(customer.name.split(" ")[0])}.</h2>${
            payLink
              ? `<p style="color:#cfd9df;line-height:1.6">We're reserving your phones for order <b>${number}</b>. If you haven't paid yet, use your secure payment link:</p><p><a href="${payLink}" style="display:inline-block;background:#56e0e8;color:#0d1419;padding:14px 26px;border-radius:999px;font-weight:700;text-decoration:none">Pay securely</a></p>`
              : `<p style="color:#cfd9df;line-height:1.6">We're reserving your phones now. Within one business day you'll get a secure payment link for order <b>${number}</b>, with tax calculated for your address. Nothing is charged until you pay that link.</p>`
          }${table}<p style="color:#8fa3b0;margin-top:20px">Shipping to:<br>${addr}</p><p style="color:#8fa3b0">Questions? Reply to this email.</p>`
        ),
      }),
    ]);
  } catch (e) {
    console.error("nexaphone order email", e); // order is saved; don't fail the buyer
  }

  return NextResponse.json({ ok: true, orderNumber: number, payUrl: payLink });
}
