import { Resend } from "resend";
import type { AccessField, AccessValue, Answers, Template } from "./types";

// Server-only. Emails admin@ when a prospect first opens their check-up link
// and each time they send it in. Internal preview links (client_name starting
// with "PREVIEW") never email. Failures are swallowed: a missed email must
// never break the client's page.

const TO = "admin@nexavisiongroup.com";
const FROM = "NexaVision <info@nexavisiongroup.com>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nexavisiongroup.com";

interface Row {
  id: string;
  title: string;
  client_name: string | null;
  answers: Answers;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const isPreview = (row: Row) => /^preview/i.test(row.client_name || "");

function accessLine(f: AccessField, v: AccessValue | undefined): string | null {
  if (!v?.via) return null;
  const how =
    v.via === "invite" ? (v.done ? "✅ invite sent" : "⏳ will invite us") :
    v.via === "login" ? (v.pass_saved ? "🔑 login shared (reveal in admin)" : "🔑 login chosen, no password yet") :
    v.via === "call" ? "📞 wants a call to set it up" :
    v.via === "unknown" ? "❓ not sure / doesn't have it" : v.via;
  const extra = [v.user ? `user ${v.user}` : "", v.note ? `“${v.note}”` : ""].filter(Boolean).join(" · ");
  return `<li><b>${esc(f.platform)}</b>: ${how}${extra ? ` <span style="color:#5A6A7E">(${esc(extra)})</span>` : ""}</li>`;
}

function summary(t: Template, a: Answers): string {
  const access = t.sections.flatMap((s) => s.fields.filter((f): f is AccessField => f.type === "access"));
  const lines = access.map((f) => accessLine(f, a[f.id])).filter(Boolean);
  const who = [a.owner_first, a.owner_phone, a.owner_email].filter(Boolean).map(esc).join(" · ");
  const pref = [a.contact_pref ? `prefers: ${a.contact_pref}` : "", a.best_time ? `best time: ${String(a.best_time).replace(/_/g, " ")}` : ""].filter(Boolean).join(" · ");
  return `
    ${who ? `<p style="margin:0 0 4px"><b>${who}</b></p>` : ""}
    ${pref ? `<p style="margin:0 0 14px;color:#5A6A7E">${esc(pref)}</p>` : ""}
    ${lines.length ? `<p style="margin:14px 0 6px"><b>Access</b></p><ul style="margin:0;padding-left:18px;line-height:1.7">${lines.join("")}</ul>` : "<p>No access cards answered yet.</p>"}
    ${a.online_week ? `<p style="margin:14px 0 0">Online sales/week: <b>${esc(String(a.online_week).replace(/_/g, " "))}</b></p>` : ""}
    ${a.anything_else ? `<p style="margin:10px 0 0;white-space:pre-wrap">“${esc(a.anything_else)}”</p>` : ""}`;
}

export async function notifyProspect(kind: "opened" | "submitted" | "resubmitted", row: Row, t: Template) {
  if (!process.env.RESEND_API_KEY || isPreview(row)) return;
  const biz = t.brief?.business || row.title;
  const name = String(row.answers?.owner_first || "").trim();
  const subject =
    kind === "opened" ? `${biz} opened their check-up link` :
    kind === "submitted" ? `${name || biz} sent the check-up` :
    `${name || biz} updated the check-up`;
  const adminUrl = `${SITE}/admin/questionnaires/${row.id}`;
  const body =
    kind === "opened"
      ? `<p>The link for <b>${esc(biz)}</b> was just opened for the first time.</p>`
      : summary(t, row.answers || {});
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to: TO,
      subject,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1f2328;max-width:560px">
        <p style="margin:0 0 14px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5A6A7E">Prospect check-up · ${esc(biz)}</p>
        ${body}
        <p style="margin:22px 0 0"><a href="${adminUrl}" style="display:inline-block;background:#0A1628;color:#00E5CC;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Open in admin</a></p>
      </div>`,
    });
  } catch (e) {
    console.error("notifyProspect failed", e);
  }
}
