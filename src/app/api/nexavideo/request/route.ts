import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db, sha256, cleanUsername, USERNAME_RE, hashPassword } from "@/lib/nexavideo";
import { notifyAdmin } from "@/lib/notify";

// "Request access" from the Nexa Video download page. The person picks a username + password now; the owner approves
// in /admin/nexavideo (free trial or permanent) and the account goes live — no invite link to send.
// Abuse guards: hidden honeypot field, max 3 requests per IP per day, username must be free.
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
  if (String(b.website ?? "")) return NextResponse.json({ ok: true });            // honeypot: pretend it worked

  const name = String(b.name ?? "").trim().slice(0, 60);
  const contact = String(b.contact ?? "").trim().slice(0, 80);
  const note = String(b.note ?? "").trim().slice(0, 300);
  const username = cleanUsername(b.username);
  const password = String(b.password ?? "");
  if (!name) return bad("Please enter your name.");
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact.toLowerCase() : null;
  if (!email && contact.replace(/\D/g, "").length < 10) return bad("Enter a phone number or an email so we can reach you.");
  if (!USERNAME_RE.test(username)) return bad("Username must be 3-30 characters: letters, numbers, dot, dash or underscore.");
  if (password.length < 8) return bad("Password must be at least 8 characters.");
  if (password !== String(b.confirm ?? "")) return bad("The two passwords do not match.");

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const ipHash = sha256(`${ip}:nexavideo`);
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await db().from("nexavideo_requests").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
  if ((count || 0) >= 3) return bad("Too many requests from here today. Try again tomorrow.", 429);

  const [{ data: takenUser }, { data: takenReq }] = await Promise.all([
    db().from("nexavideo_users").select("id").eq("username", username).maybeSingle(),
    db().from("nexavideo_requests").select("id").eq("username", username).eq("status", "pending").maybeSingle(),
  ]);
  if (takenUser || takenReq) return bad("That username is taken. Pick another.", 409);

  const { error } = await db().from("nexavideo_requests").insert({
    name, contact, email, note, username, password_hash: hashPassword(password), ip_hash: ipHash,
  });
  if (error) return bad("Could not send your request. Try again.", 500);
  await notifyAdmin({
    type: "nexavideo_request", title: `🎬 Nexa Video access request — ${name}`,
    message: `${contact} · username ${username}${note ? ` · “${note.slice(0, 80)}”` : ""}`, url: "/admin/nexavideo",
  });

  try {
    await resend.emails.send({
      from: "Nexa Video <info@nexavisiongroup.com>",
      to: "info@nexavisiongroup.com",
      subject: `Nexa Video access request — ${name}`,
      html: `<div style="font-family:system-ui,sans-serif;background:#0b0c10;color:#e6e6e6;padding:24px;border-radius:12px">
        <h2 style="margin:0 0 12px;color:#4FA3FF">New Nexa Video access request</h2>
        <p style="margin:4px 0"><b>${esc(name)}</b> · ${esc(contact)}</p>
        <p style="margin:4px 0;color:#9aa0aa">Username: ${esc(username)}</p>
        ${note ? `<p style="margin:12px 0;padding:12px;background:#15171c;border-radius:8px">${esc(note)}</p>` : ""}
        <p style="margin-top:16px"><a style="color:#4FA3FF" href="https://nexavisiongroup.com/admin/nexavideo">Open the admin to start their free trial →</a></p></div>`,
    });
  } catch { /* the request is saved either way */ }
  return NextResponse.json({ ok: true });
}
