import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { ADDONS, money, productBySlug } from "@/components/nexaphone/catalog";

// Nexa Pro order request. Prices are recomputed here from the catalog —
// the browser only says what it wants, never what it costs. Until the JHPS
// Nexa-branded checkout is live, we email a secure payment link manually.

const resend = new Resend(process.env.RESEND_API_KEY);
const INBOX = "info@nexavisiongroup.com";

type InItem = { slug: string; ram: number; storage: string; color: string; addons: string[]; qty: number };
type InBody = {
  customer: { name: string; email: string; phone?: string; company?: string };
  address: { line1: string; line2?: string; city: string; state: string; zip: string };
  items: InItem[];
  notes?: string;
  website?: string; // honeypot
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function orderNumber() {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const d = new Date();
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
  let r = "";
  for (let i = 0; i < 6; i++) r += a[Math.floor(Math.random() * a.length)];
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
  const shipping = 0;
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
    notes: str(body.notes, 1000) || null,
  });
  if (error) {
    console.error("nexaphone order insert", error);
    return NextResponse.json({ error: "We couldn't save your order. Try again in a minute." }, { status: 500 });
  }

  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #1c2a33"><b>${esc(i.name)}</b> × ${i.qty}<br><span style="color:#8fa3b0;font-size:13px">${i.ram}GB / ${esc(i.storage)}, ${esc(i.color)}${i.addons.length ? `<br>${esc(i.addons.join(", "))}` : ""}</span></td><td style="padding:10px 0;border-bottom:1px solid #1c2a33;text-align:right">${money(i.line_total)}</td></tr>`
    )
    .join("");
  const table = `<table style="width:100%;border-collapse:collapse;font-size:15px">${rows}<tr><td style="padding:12px 0"><b>Subtotal</b></td><td style="text-align:right"><b>${money(subtotal)}</b></td></tr><tr><td style="color:#8fa3b0">Shipping</td><td style="text-align:right;color:#8fa3b0">Free</td></tr></table>`;
  const addr = `${esc(address.line1)}${address.line2 ? `, ${esc(address.line2)}` : ""}<br>${esc(address.city)}, ${esc(address.state)} ${esc(address.zip)}`;
  const shell = (inner: string) =>
    `<div style="background:#0d1419;padding:32px 20px;font-family:system-ui,sans-serif;color:#e9eef0"><div style="max-width:560px;margin:0 auto"><div style="font-weight:800;font-size:22px;letter-spacing:.04em;margin-bottom:24px">NEXA PRO</div>${inner}</div></div>`;

  try {
    await Promise.all([
      resend.emails.send({
        from: "Nexa Pro Orders <info@nexavisiongroup.com>",
        to: INBOX,
        replyTo: customer.email,
        subject: `New Nexa Pro order ${number}: ${money(subtotal)}`,
        html: shell(
          `<h2 style="margin:0 0 6px">Order ${number}</h2><p style="color:#8fa3b0;margin:0 0 20px">Send the Nexa-branded invoice from JHPS admin.</p>${table}<p style="margin-top:20px"><b>${esc(customer.name)}</b>${customer.company ? `, ${esc(customer.company)}` : ""}<br>${esc(customer.email)}${customer.phone ? `<br>${esc(customer.phone)}` : ""}</p><p>${addr}</p>${body.notes ? `<p style="color:#8fa3b0">Notes: ${esc(str(body.notes, 1000))}</p>` : ""}`
        ),
      }),
      resend.emails.send({
        from: "Nexa Pro <info@nexavisiongroup.com>",
        to: customer.email,
        replyTo: INBOX,
        subject: `We have your Nexa Pro order (${number})`,
        html: shell(
          `<h2 style="margin:0 0 10px">Your order is in, ${esc(customer.name.split(" ")[0])}.</h2><p style="color:#cfd9df;line-height:1.6">We're reserving your phones now. Within one business day you'll get a secure payment link for order <b>${number}</b>, with tax calculated for your address. Nothing is charged until you pay that link.</p>${table}<p style="color:#8fa3b0;margin-top:20px">Shipping to:<br>${addr}</p><p style="color:#8fa3b0">Questions? Reply to this email.</p>`
        ),
      }),
    ]);
  } catch (e) {
    console.error("nexaphone order email", e); // order is saved; don't fail the buyer
  }

  return NextResponse.json({ ok: true, orderNumber: number });
}
