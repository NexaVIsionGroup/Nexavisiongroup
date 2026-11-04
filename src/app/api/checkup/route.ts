import { NextResponse } from "next/server";
import { Resend } from "resend";
import { notifyAdmin } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Free check-up requests from the new marketing site (/contact).
 * 1) saves the person as a Prospect in /admin/customers
 * 2) emails info@ (lands in the admin inbox; reply goes straight to them)
 * 3) phone alert via notifyAdmin
 */
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const clip = (s: unknown, n = 500) => String(s ?? "").trim().slice(0, n);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong sending the form. Please try again." }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field.
  if (clip(body.company_site)) return NextResponse.json({ ok: true });

  const name = clip(body.name, 120);
  const email = clip(body.email, 200).toLowerCase();
  const phone = clip(body.phone, 40);
  const business = clip(body.business, 160);
  const kind = clip(body.kind, 80);
  const website = clip(body.website, 300);
  const contactBy = clip(body.contactBy, 20);
  const message = clip(body.message, 3000);
  const plan = clip(body.plan, 80);
  const needs = Array.isArray(body.needs) ? body.needs.map((n) => clip(n, 60)).filter(Boolean).slice(0, 10) : [];

  if (!name) return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  if (!email && !phone) return NextResponse.json({ ok: false, error: "Please add an email or phone number so we can reach you." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "That email address doesn't look right. Please check it." }, { status: 400 });

  const [first, ...rest] = name.split(/\s+/);

  // 1) Prospect in the admin (skip if this email is already a customer)
  try {
    const db = createAdminClient();
    let exists = false;
    if (email) {
      const { data } = await db.from("customers").select("id").eq("email", email).limit(1);
      exists = !!data?.length;
    }
    if (!exists) {
      await db.from("customers").insert({
        first_name: first || null,
        last_name: rest.join(" ") || null,
        company_name: business || null,
        email: email || null,
        phone: phone || null,
        customer_type: "prospect",
      });
    }
  } catch (e) {
    console.error("checkup: prospect insert failed", e);
  }

  // 2) Email to the inbox
  const rows: [string, string][] = [
    ["Name", name],
    ["Business", business],
    ["Type", kind],
    ["Website", website],
    ["Email", email],
    ["Phone", phone],
    ["Best way", contactBy],
    ["Needs", needs.join(", ")],
    ["Plan clicked", plan],
  ];
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "NexaVision Site <info@nexavisiongroup.com>",
      to: "info@nexavisiongroup.com",
      ...(email ? { replyTo: email } : {}),
      subject: `Free check-up request: ${business || name}`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:600px">
        <h2 style="color:#0f5c55;margin:0 0 12px">New free check-up request</h2>
        <table style="border-collapse:collapse;width:100%">${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#4a5a57;width:110px">${k}</td><td style="padding:6px 0;color:#0d1d1b"><b>${esc(v)}</b></td></tr>`)
          .join("")}</table>
        ${message ? `<div style="margin-top:14px;padding:14px;background:#f2f6f5;border-radius:10px;line-height:1.6">${esc(message).replace(/\n/g, "<br>")}</div>` : ""}
        <p style="color:#4a5a57;font-size:12px;margin-top:16px">Saved as a Prospect in /admin/customers.${email ? " Reply to this email to answer them directly." : ""}</p>
      </div>`,
    });
  } catch (e) {
    console.error("checkup: email failed", e);
  }

  // 3) Phone alert
  await notifyAdmin({
    type: "contact",
    title: `🔎 Free check-up — ${business || name}`,
    message: [kind, needs.join(", "), website].filter(Boolean).join(" · ").slice(0, 160),
    url: "/admin/customers",
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
