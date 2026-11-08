import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { notifyAdmin, notifyDb } from "@/lib/notify";
import { BUSINESS_NAME, defaultPackage, firstMonthly, normalizeContent, money, surchargeOn, type ProposalContent, type PublicProposal } from "./types";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nexavisiongroup.com";
export const FROM = `${BUSINESS_NAME} <info@nexavisiongroup.com>`;
export const INBOX = "info@nexavisiongroup.com";

// Must read live: Next 14 otherwise caches these reads, and a customer would see a stale status.
export const db = () => notifyDb();
export const newToken = () => randomBytes(18).toString("base64url");
export function newNumber() {
  const d = new Date();
  return `NV-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}-${randomBytes(2).toString("hex").toUpperCase()}`;
}
export const projectUrl = (token: string) => `${SITE}/project/${token}`;

// A shareable read-only preview: works for drafts, needs no login, never counts as the
// customer's view and can't be signed. The key is a signature of the token, so the
// preview link can be shared without exposing the real customer link.
const previewSecret = () => process.env.PROPOSAL_PREVIEW_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const previewKey = (token: string) => createHmac("sha256", previewSecret()).update(`preview:${token}`).digest("base64url").slice(0, 22);
export const previewUrl = (token: string) => `${SITE}/preview/${token}?k=${previewKey(token)}`;
export function previewKeyOk(token: string, key: unknown) {
  const want = previewKey(token);
  return typeof key === "string" && key.length === want.length && timingSafeEqual(Buffer.from(key), Buffer.from(want));
}

/** Same input always gives the same text, whatever order the keys were saved in. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}
export const fingerprint = (v: unknown) => createHash("sha256").update(stable(v)).digest("hex");

// Cloudflare sits in front of the site, so its header holds the visitor's real address.
export const clientIp = (req: Request) => req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

export async function logEvent(proposalId: string, event: string, req?: Request, meta: Record<string, unknown> = {}) {
  await db().from("proposal_events").insert({
    proposal_id: proposalId, event, meta,
    ip: req ? clientIp(req) : null,
    user_agent: req ? (req.headers.get("user-agent") || "").slice(0, 300) : null,
  });
}

/** Only these fields ever reach the customer's browser. */
export function toPublic(p: any): PublicProposal {
  return {
    number: p.number, title: p.title, status: p.status, division: p.division,
    client_name: p.client_name, client_company: p.client_company, client_email: p.client_email,
    content: normalizeContent(p.signed_snapshot?.content || p.content),
    sent_at: p.sent_at, expires_at: p.expires_at, updated_at: p.updated_at,
    signed_at: p.signed_at, signed_name: p.signed_name, signed_title: p.signed_title,
    signature_data: p.signature_data, signed_hash: p.signed_hash,
    selected_package_id: p.selected_package_id, due_amount: p.due_amount == null ? null : Number(p.due_amount), paid_at: p.paid_at,
    autopay_opt_in: typeof p.signed_snapshot?.autopay_opt_in === "boolean" ? p.signed_snapshot.autopay_opt_in : null,
  };
}

export type LinkState = "ok" | "missing" | "paused" | "expired";
export function linkState(p: any): LinkState {
  if (!p || p.status === "draft") return "missing";
  if (p.link_enabled === false) return "paused";
  if (!p.signed_at && p.expires_at && new Date(p.expires_at) < new Date()) return "expired";
  return "ok";
}

// ── Payment bridge: the same signed link the Nexa store uses ──
function signed(message: string) {
  const secret = process.env.NEXA_ORDER_SECRET;
  const base = process.env.JHPS_BASE_URL;
  if (!secret || !base) throw new Error("Payment link not configured");
  const ts = String(Math.floor(Date.now() / 1000));
  return { base, headers: { "X-Nexa-Timestamp": ts, "X-Nexa-Signature": "sha256=" + createHmac("sha256", secret).update(`${ts}.${message}`).digest("hex") } };
}

/** Creates the invoice for what's due at signing, or returns the one that already exists. */
export async function ensureInvoice(p: any): Promise<string> {
  if (p.pay_url) return p.pay_url;
  const content: ProposalContent = normalizeContent(p.signed_snapshot?.content || p.content);
  const due = Number(p.due_amount) || 0;
  if (due <= 0) throw new Error("Nothing due");
  const body = JSON.stringify({
    kind: "service",
    order_id: p.id,
    customer: { name: p.client_name || p.client_company || p.signed_name, email: p.client_email, phone: p.client_phone || undefined, company: p.client_company || undefined },
    items: [{ description: `${p.title}: payment due at signing (${p.number})`, quantity: 1, unit_price: due }],
    surcharge: !!content.payment.surcharge,
    notes: `Proposal ${p.number}`,
    return_url: projectUrl(p.token),
  });
  const { base, headers } = signed(body);
  const r = await fetch(`${base}/api/external/nexa-order`, {
    method: "POST", headers: { "Content-Type": "application/json", ...headers }, body, cache: "no-store", signal: AbortSignal.timeout(20000),
  });
  const j = await r.json();
  if (!r.ok || !j.pay_url) throw new Error(j.error || `Invoice failed (${r.status})`);
  await db().from("proposals").update({ invoice_number: j.invoice_number, pay_url: j.pay_url }).eq("id", p.id);
  await logEvent(p.id, "invoice_created", undefined, { invoice_number: j.invoice_number, total: j.total });
  return j.pay_url;
}

/** Asks the payment system whether the invoice has been paid. Never throws. */
export async function syncPaid(p: any): Promise<any> {
  if (!p?.invoice_number || p.paid_at) return p;
  try {
    const { base, headers } = signed(p.id);
    const r = await fetch(`${base}/api/external/nexa-order?order_id=${p.id}`, { headers, cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!r.ok) return p;
    const j = await r.json();
    if (j.status !== "paid") return p;
    const paid_at = j.paid_date ? new Date(j.paid_date).toISOString() : new Date().toISOString();
    const { data } = await db().from("proposals").update({ paid_at }).eq("id", p.id).is("paid_at", null).select("id");
    if (data?.length) {
      await logEvent(p.id, "paid", undefined, { invoice_number: p.invoice_number, amount: j.amount_paid });
      await notifyAdmin({ type: "proposal", title: `💰 Paid: ${p.client_company || p.client_name || p.title}`, message: `${money(Number(j.amount_paid) || 0)} on ${p.number}`, url: `/admin/proposals/${p.id}`, entityType: "proposal", entityId: p.id });
    }
    return { ...p, paid_at };
  } catch {
    return p;
  }
}

// ── Automatic monthly billing: the same signed link, to the billing engine ──
async function billingPost(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  const { base, headers } = signed(body);
  const r = await fetch(`${base}/api/external/nexa-subscription`, {
    method: "POST", headers: { "Content-Type": "application/json", ...headers }, body, cache: "no-store", signal: AbortSignal.timeout(20000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `Billing failed (${r.status})`);
  return j;
}

/** Creates the customer's automatic billing the first time, or returns what exists. Nothing charges until a card and a date are set. */
export async function ensureSubscription(p: any) {
  const content: ProposalContent = normalizeContent(p.signed_snapshot?.content || p.content);
  const pkg = content.packages.find((x) => x.id === p.selected_package_id) || defaultPackage(content);
  const amount = pkg ? firstMonthly(pkg) : 0;
  if (!pkg || amount <= 0) throw new Error("This proposal has no monthly price to bill.");
  if (!p.client_email) throw new Error("Add the customer's email first.");
  const plan_note = [
    pkg.ramp?.length ? pkg.ramp.map((r) => `${r.label}: ${money(r.monthly)}/mo`).join(", ") : "",
    pkg.ramp?.length ? `${pkg.monthlyLabel || "After that"}: ${money(pkg.monthly)}/mo` : "",
    pkg.percent ? `Plus ${pkg.percent.rate}% of ${pkg.percent.of}` : "",
  ].filter(Boolean).join(". ");
  return billingPost({
    action: "ensure", order_id: p.id, amount, plan_name: pkg.name, reference: p.number, plan_note, return_url: projectUrl(p.token),
    customer: { name: p.client_name || p.client_company || p.signed_name, email: p.client_email, phone: p.client_phone || undefined, company: p.client_company || undefined },
  });
}

export const billingAction = (proposalId: string, action: string, fields: Record<string, unknown> = {}) => billingPost({ ...fields, action, order_id: proposalId });

export async function billingStatus(proposalId: string) {
  const { base, headers } = signed(proposalId);
  const r = await fetch(`${base}/api/external/nexa-subscription?order_id=${proposalId}`, { headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `Billing failed (${r.status})`);
  return j;
}

// ── Email ──
const shell = (heading: string, body: string, button?: { label: string; href: string }) => `
<div style="background:#eef2f0;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#10211f">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden">
    <div style="background:#0d1d1b;color:#ffffff;padding:20px 26px;font-size:18px;font-weight:700">${BUSINESS_NAME}</div>
    <div style="padding:26px;font-size:16px;line-height:1.55">
      <h1 style="margin:0 0 14px;font-size:23px;line-height:1.2">${heading}</h1>
      ${body}
      ${button ? `<p style="margin:24px 0 8px"><a href="${button.href}" style="display:inline-block;background:#0f5c55;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:9px">${button.label}</a></p>` : ""}
    </div>
    <div style="padding:16px 26px;border-top:1px solid #dfe6e3;color:#51625f;font-size:14px">${BUSINESS_NAME} · ${INBOX} · nexavisiongroup.com</div>
  </div>
</div>`;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export async function emailProposal(p: any) {
  if (!p.client_email) throw new Error("This customer has no email address");
  const first = esc((p.client_name || "").split(" ")[0] || "there");
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM, to: p.client_email, replyTo: INBOX,
    subject: `Your proposal from ${BUSINESS_NAME}: ${p.title}`,
    html: shell(`Hi ${first}, your proposal is ready`,
      `<p style="margin:0 0 12px">We put together <b>${esc(p.title)}</b> for ${esc(p.client_company || "your business")}. It covers what we found, your goals, what we'd do and what it costs.</p><p style="margin:0">Read it on your phone or computer, and sign right on the page when you're ready. Questions? Just reply to this email.</p>`,
      { label: "Open your proposal", href: `${projectUrl(p.token)}?from=email` }),
  });
  if (error) throw new Error(error.message);
}

export async function emailSignedCopy(p: any, pdf: Buffer | null) {
  const content = normalizeContent(p.signed_snapshot?.content || p.content);
  const due = Number(p.due_amount) || 0;
  const total = due + surchargeOn(content, due);
  const autopay = p.signed_snapshot?.autopay_opt_in === true;
  const attachments = pdf ? [{ filename: `${p.number}-signed.pdf`, content: pdf }] : undefined;
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (p.client_email) {
    await resend.emails.send({
      from: FROM, to: p.client_email, replyTo: INBOX, attachments,
      subject: `Signed copy: ${p.title}`,
      html: shell("Thank you. You're all signed.",
        `<p style="margin:0 0 12px">Your signed copy of <b>${esc(p.title)}</b> is ${pdf ? "attached" : "on your project page"}. Keep it for your records.</p>${due > 0 ? `<p style="margin:0 0 12px">The next step is your payment of <b>${money(total)}</b>.</p>` : autopay ? "" : `<p style="margin:0">We'll be in touch with next steps.</p>`}${autopay ? `<p style="margin:0">You chose automatic monthly billing. ${due > 0 ? `After your payment, <a href="${projectUrl(p.token)}/card">save your card here</a>.` : "Save your card with the button below."} Nothing is charged when you save it, and we'll email you the date and amount before the first charge.</p>` : ""}`,
        due > 0 ? { label: "Make your payment", href: `${projectUrl(p.token)}/pay` } : autopay ? { label: "Save your card", href: `${projectUrl(p.token)}/card` } : { label: "Open your project page", href: projectUrl(p.token) }),
    });
  }
  await resend.emails.send({
    from: FROM, to: INBOX, attachments,
    subject: `Signed: ${p.client_company || p.client_name || p.title} (${p.number})`,
    html: shell("A proposal was signed", `<p style="margin:0"><b>${esc(p.signed_name)}</b> signed <b>${esc(p.title)}</b>.</p>`, { label: "Open in admin", href: `${SITE}/admin/proposals/${p.id}` }),
  });
}
