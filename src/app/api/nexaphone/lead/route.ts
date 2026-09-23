import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { products } from "@/components/nexaphone/catalog";

// Nexa Pro leads: fleet quotes, technical guide requests and phone questions.
const resend = new Resend(process.env.RESEND_API_KEY);
const INBOX = "info@nexavisiongroup.com";
const KINDS = { quote: "Fleet quote", guide: "Technical guide request", question: "Phone question" } as const;
type Kind = keyof typeof KINDS;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (b.website) return NextResponse.json({ ok: true }); // bot

  const kind = str(b.kind, 20) as Kind;
  if (!(kind in KINDS)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const name = str(b.name, 120);
  const email = str(b.email, 160).toLowerCase();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Enter your name and a valid email." }, { status: 400 });

  const unitsNum = Math.floor(Number(b.units));
  const units = Number.isFinite(unitsNum) && unitsNum > 0 && unitsNum < 100000 ? unitsNum : null;
  const deviceSlug = str(b.device, 60);
  const device = products.find((p) => p.slug === deviceSlug)?.name ?? null;
  const row = {
    kind,
    name,
    email,
    phone: str(b.phone, 40) || null,
    company: str(b.company, 160) || null,
    units,
    location: str(b.location, 200) || null,
    device,
    message: str(b.message, 2000) || null,
  };

  const db = createAdminClient();
  const { error } = await db.from("nexaphone_leads").insert(row);
  if (error) {
    console.error("nexaphone lead insert", error);
    return NextResponse.json({ error: "We couldn't send that. Try again in a minute." }, { status: 500 });
  }

  const lines = [
    ["Name", row.name],
    ["Email", row.email],
    ["Phone", row.phone],
    ["Company", row.company],
    ["Phones needed", row.units ? String(row.units) : null],
    ["Location", row.location],
    ["Model", row.device],
    ["Message", row.message],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#8fa3b0">${k}</td><td style="padding:6px 0">${esc(v as string)}</td></tr>`)
    .join("");
  const shell = (inner: string) =>
    `<div style="background:#0d1419;padding:32px 20px;font-family:system-ui,sans-serif;color:#e9eef0"><div style="max-width:560px;margin:0 auto"><div style="font-weight:800;font-size:22px;letter-spacing:.04em;margin-bottom:24px">NEXA PRO</div>${inner}</div></div>`;
  const reply =
    kind === "guide"
      ? "We'll send the Nexa Pro technical guide to this address within one business day."
      : kind === "quote"
        ? "We'll put together fleet pricing and setup for your site and reply within one business day."
        : "We'll get back to you within one business day.";

  try {
    await Promise.all([
      resend.emails.send({
        from: "Nexa Pro <info@nexavisiongroup.com>",
        to: INBOX,
        replyTo: email,
        subject: `${KINDS[kind]}: ${name}${row.company ? `, ${row.company}` : ""}${row.units ? ` (${row.units} phones)` : ""}`,
        html: shell(`<h2 style="margin:0 0 16px">${KINDS[kind]}</h2><table style="font-size:15px">${lines}</table>`),
      }),
      resend.emails.send({
        from: "Nexa Pro <info@nexavisiongroup.com>",
        to: email,
        replyTo: INBOX,
        subject: kind === "guide" ? "Your Nexa Pro technical guide request" : "We got your message",
        html: shell(`<h2 style="margin:0 0 10px">Thanks, ${esc(name.split(" ")[0])}.</h2><p style="color:#cfd9df;line-height:1.6">${reply}</p><p style="color:#8fa3b0">Questions in the meantime? Just reply to this email.</p>`),
      }),
    ]);
  } catch (e) {
    console.error("nexaphone lead email", e);
  }
  return NextResponse.json({ ok: true });
}
