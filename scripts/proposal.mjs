// Create or update a customer proposal as a DRAFT. It never emails anyone.
//   node scripts/proposal.mjs path/to/proposal.json --check      validate only, nothing saved
//   node scripts/proposal.mjs path/to/proposal.json              create a draft
//   node scripts/proposal.mjs path/to/proposal.json --id <uuid>  update an unsigned proposal
// Run from the repo root. Full instructions: memory file nexa-proposal-writer.md
import { createHmac, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DIVISIONS = ["Restaurants", "Contractors & Home Services", "Automotive", "Other"];
const SITE = "https://nexavisiongroup.com";

const args = process.argv.slice(2);
const idAt = args.indexOf("--id");
const file = args.find((a, i) => !a.startsWith("--") && (idAt < 0 || i !== idAt + 1));
const check = args.includes("--check");
const id = idAt >= 0 ? args[idAt + 1] : null;
if (idAt >= 0 && !/^[0-9a-f-]{36}$/i.test(id || "")) { console.error("ERROR: --id needs the proposal's id."); process.exit(1); }
const die = (m) => { console.error(`ERROR: ${m}`); process.exit(1); };
if (!file) die("Pass the path to a proposal JSON file.");

let b;
try { b = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch (e) { die(`Could not read ${file}: ${e.message}`); }

// ── Validate ──
const problems = [];
const need = (cond, msg) => { if (!cond) problems.push(msg); };
const text = (v) => typeof v === "string" && v.trim().length > 0;
const list = (v) => Array.isArray(v);
const c = b.content || {};

need(text(b.title), "title is required");
need(DIVISIONS.includes(b.division), `division must be one of: ${DIVISIONS.join(", ")}`);
need(text(b.client_company) || text(b.client_name), "client_company or client_name is required");
if (b.client_email) need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.client_email), "client_email is not a valid address");
need(text(c.intro), "content.intro is required");
need(list(c.findings) && c.findings.length > 0, "content.findings needs at least one finding");
(c.findings || []).forEach((f, i) => {
  need(text(f.title) && text(f.detail), `findings[${i}] needs title and detail`);
  if (f.image) need(/^(https:\/\/|\/)/.test(f.image), `findings[${i}].image must start with https:// or /`);
  if (f.image?.startsWith("/")) need(fs.existsSync(path.join("public", f.image)), `findings[${i}].image is not in public${f.image}`);
});
const img = (v, where) => {
  if (!v) return;
  need(/^(https:\/\/|\/)/.test(v), `${where} must start with https:// or /`);
  if (v.startsWith("/")) need(fs.existsSync(path.join("public", v)), `${where} is not in public${v}`);
};
(c.findings || []).forEach((f, i) => {
  if (f.body) need(list(f.body) && f.body.every(text), `findings[${i}].body must be a list of paragraphs`);
  if (f.compare) need(list(f.compare) && f.compare.every((r) => text(r.source) && text(r.value)), `findings[${i}].compare rows need source and value`);
  if (f.bars) need(list(f.bars) && f.bars.every((r) => text(r.label) && typeof r.value === "number"), `findings[${i}].bars rows need label and a number value`);
  if (f.tone) need(["warn", "money", "info", "good"].includes(f.tone), `findings[${i}].tone must be warn, money, info or good`);
});
// ── optional rich sections (animated, chaptered layout) ──
if (c.hero) { img(c.hero.image, "hero.image"); img(c.hero.seamImage, "hero.seamImage"); }
if (c.facts) need(list(c.facts) && c.facts.length > 0 && c.facts.every((f) => text(f.value) && text(f.label)), "every fact needs value and label");
if (c.strengths) need(list(c.strengths) && c.strengths.every((f) => text(f.title) && text(f.detail)), "every strength needs title and detail");
if (c.features) {
  need(list(c.features) && c.features.length > 0 && c.features.every((f) => text(f.title) && text(f.body)), "every feature needs title and body");
  (c.features || []).forEach((f, i) => img(f.image, `features[${i}].image`));
}
if (c.comparison) need(list(c.comparison.rows) && c.comparison.rows.length > 0 && c.comparison.rows.every((r) => text(r.label) && text(r.today) && text(r.after)), "every comparison row needs label, today and after");
if (c.summary) {
  const s = c.summary;
  need(text(s.headline), "summary.headline is required");
  need(list(s.today) && s.today.length > 0 && s.today.length <= 4 && s.today.every((f) => text(f.value) && text(f.label)), "summary.today needs 1 to 4 items with value and label");
  need(list(s.changes) && s.changes.length > 0 && s.changes.length <= 6 && s.changes.every(text), "summary.changes needs 1 to 6 lines (keep it one screen)");
}
if (c.entry !== undefined) need(["full", "short", "sign"].includes(c.entry), "content.entry must be full, short or sign");
if (c.entry === "short") need(!!c.summary, "content.entry is short, so content.summary is required");
need(list(c.goals) && c.goals.length > 0 && c.goals.every(text), "content.goals needs at least one goal");
need(list(c.work) && c.work.length > 0, "content.work needs at least one service");
(c.work || []).forEach((w, i) => need(text(w.area) && list(w.items) && w.items.length > 0, `work[${i}] needs area and items`));
if (c.timeline) need(list(c.timeline) && c.timeline.every((t) => text(t.label) && text(t.when)), "every timeline step needs label and when");
need(list(c.packages) && c.packages.length > 0, "content.packages needs at least one package");
const pkgs = c.packages || [];
pkgs.forEach((p, i) => {
  need(text(p.id) && text(p.name), `packages[${i}] needs id and name`);
  need(typeof p.price === "number" && p.price >= 0 && typeof p.monthly === "number" && p.monthly >= 0, `packages[${i}] price and monthly must be numbers (0 if none)`);
  need(p.price > 0 || p.monthly > 0, `packages[${i}] has no price`);
  need(list(p.includes) && p.includes.length > 0, `packages[${i}] needs includes`);
  if (p.ramp) need(list(p.ramp) && p.ramp.length > 0 && p.ramp.every((r) => text(r.label) && typeof r.monthly === "number" && r.monthly > 0), `packages[${i}].ramp steps need label and a monthly number above 0`);
  if (p.ramp) need(p.monthly > 0, `packages[${i}] has a ramp, so monthly (the price after the ramp) must be above 0`);
  if (p.monthlyLabel !== undefined) need(text(p.monthlyLabel), `packages[${i}].monthlyLabel must be text`);
  if (p.rampNote !== undefined) need(text(p.rampNote) && p.ramp?.length, `packages[${i}].rampNote needs text and a ramp to explain`);
  if (p.percent) need(typeof p.percent.rate === "number" && p.percent.rate > 0 && p.percent.rate < 100 && text(p.percent.of), `packages[${i}].percent needs rate (number) and of (what it's a share of)`);
});
need(new Set(pkgs.map((p) => p.id)).size === pkgs.length, "package ids must be different");
need(pkgs.filter((p) => p.recommended).length <= 1, "only one package can be recommended");
const pay = c.payment || { mode: "none", value: 0, surcharge: false, notes: "" };
need(["none", "percent", "fixed"].includes(pay.mode), "payment.mode must be none, percent or fixed");
if (pay.mode !== "none") need(typeof pay.value === "number" && pay.value > 0, "payment.value must be a number above 0");
if (pay.mode === "percent") need(pay.value <= 100, "payment.value is a percent, so 100 or less");
if (pay.autopay) need(typeof pay.autopay.offer === "boolean", "payment.autopay.offer must be true or false");
if (pay.schedule) need(list(pay.schedule) && pay.schedule.length > 0 && pay.schedule.length <= 5 && pay.schedule.every((x) => text(x.when) && typeof x.amount === "number" && x.amount >= 0), "payment.schedule needs 1 to 5 steps with when and amount (number)");
if (c.terms) need(list(c.terms) && c.terms.every((t) => text(t.title) && text(t.text)), "every term needs title and text");

// Words that must never reach a customer.
const blob = JSON.stringify({ t: b.title, c });
for (const [re, why] of [[/jhps|jhpsfl/i, "the JHPS name"], [/\bLLC\b/, '"LLC" (the company is not formed yet)'], [/\b(small|boutique|one-man|solo)\b (team|shop|company|business|agency)/i, "calling NexaVision small"]]) {
  if (re.test(blob)) problems.push(`Copy mentions ${why}. Remove it.`);
}
if (problems.length) die(`Fix these and run again:\n - ${problems.join("\n - ")}`);

const content = { ...c, timeline: c.timeline || [], payment: { mode: pay.mode, value: pay.value || 0, surcharge: !!pay.surcharge, notes: pay.notes || "", ...(pay.autopay ? { autopay: pay.autopay } : {}), ...(pay.schedule ? { schedule: pay.schedule } : {}) } };
if (!c.terms) delete content.terms; // the app fills in the standard terms

// ── Summary ──
const usd = (n) => `$${Number(n).toLocaleString("en-US")}`;
console.log(`OK: ${b.title} for ${b.client_company || b.client_name}`);
for (const p of pkgs) {
  const base = p.price > 0 ? p.price : p.monthly;
  const due = pay.mode === "percent" ? (base * pay.value) / 100 : pay.mode === "fixed" ? pay.value : 0;
  const ramp = (p.ramp || []).map((r) => `${usd(r.monthly)}/mo ${r.label}, then `).join("");
  const pct = p.percent ? ` + ${p.percent.rate}% of ${p.percent.of}` : "";
  console.log(`  ${p.name}: ${usd(p.price)} one-time, ${ramp}${usd(p.monthly)}/mo${p.monthlyLabel ? ` (${p.monthlyLabel.toLowerCase()})` : ""}${pct}, due at signing ${usd(due)}${pay.surcharge && due ? " + 4% card fee" : ""}`);
  if (p.rampNote) console.log(`    Ramp rule: ${p.rampNote}`);
}
if (pay.autopay?.offer) console.log(`  Automatic monthly billing offered at signing${pay.autopay.recommended ? " (recommended)" : ""}.`);
const rich = !!(c.hero || c.facts || c.features || (c.findings || []).some((f) => f.stat || f.bars || f.compare));
console.log(`  Layout: ${rich ? "chaptered (animated)" : "plain"}`);
if (check) { console.log("Check only. Nothing saved."); process.exit(0); }

// ── Save ──
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const email = (b.client_email || "").trim().toLowerCase() || null;
const fields = {
  title: b.title.trim(), division: b.division, client_name: b.client_name?.trim() || null, client_company: b.client_company?.trim() || null,
  client_email: email, client_phone: b.client_phone?.trim() || null, content,
  expires_at: b.expires_at ? new Date(`${b.expires_at}T23:59:59`).toISOString() : null,
};

let row;
if (id) {
  const { data: cur } = await db.from("proposals").select("id,status,signed_at").eq("id", id).maybeSingle();
  if (!cur) die(`No proposal with id ${id}`);
  if (cur.signed_at) die("That proposal is signed, so it is locked. Make a new one.");
  const { data, error } = await db.from("proposals").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select("id,number,token,status").single();
  if (error) die(error.message);
  row = data;
  if (cur.status !== "draft") console.log(`NOTE: this proposal was already ${cur.status}. The customer sees the change on their next page load.`);
} else {
  let customer_id = null;
  if (email) {
    const { data: found } = await db.from("customers").select("id").ilike("email", email).limit(1).maybeSingle();
    customer_id = found?.id || null;
    if (!customer_id) {
      const [first, ...rest] = (b.client_name || "").trim().split(/\s+/);
      const { data, error } = await db.from("customers").insert({ first_name: first || null, last_name: rest.join(" ") || null, company_name: fields.client_company, email, phone: fields.client_phone, customer_type: "prospect", source: "proposal" }).select("id").single();
      if (error) die(error.message);
      customer_id = data.id;
    }
  }
  const d = new Date();
  const number = `NV-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const { data, error } = await db.from("proposals").insert({ ...fields, customer_id, token: randomBytes(18).toString("base64url"), number }).select("id,number,token,status").single();
  if (error) die(error.message);
  row = data;
}

console.log(`Saved ${row.number} (${row.status})`);
console.log(`  id:      ${row.id}`);
console.log(`  Review:  ${SITE}/admin/proposals/${row.id}`);
console.log(`  Preview: ${SITE}/admin/proposals/${row.id}/preview`);
const pk = createHmac("sha256", env.PROPOSAL_PREVIEW_SECRET || env.SUPABASE_SERVICE_ROLE_KEY).update(`preview:${row.token}`).digest("base64url").slice(0, 22);
console.log(`  Share preview (no login, read-only, not counted): ${SITE}/preview/${row.token}?k=${pk}`);
console.log(`  Customer link, works once sent: ${SITE}/project/${row.token}`);
console.log(`  Short link (send this; it opens the ${c.entry === "sign" ? "agreement" : c.entry === "short" ? "summary" : "proposal"} before signing and the project page after): ${SITE}/go/${row.token.slice(0, 6)}`);
if (c.summary) console.log(`  One-screen summary (send this to someone who won't read the whole page): ${SITE}/project/${row.token}/short`);
