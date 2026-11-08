"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { money } from "@/lib/proposals/types";
import { field, label, when } from "../shared";

const STATUS: Record<string, string> = {
  awaiting_card: "Waiting for the customer to save a card",
  ready: "Card saved. Set the first charge date to start billing.",
  active: "Active",
  paused: "Paused",
  past_due: "Stopped after 3 failed tries",
  on_hold: "On hold: a charge needs checking in Square",
  cancelled: "Cancelled",
};
const RESULT: Record<string, string> = { success: "Paid", failed: "Failed", pending: "Checking", no_card: "No card" };
const btn = "inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md border border-white/15 text-nv-text-primary disabled:opacity-50";
const main = "inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md bg-nv-teal text-nv-deep font-semibold disabled:opacity-50";
const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function BillingPanel({ id }: { id: string }) {
  const [b, setB] = useState<any>(undefined);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ date: "", amount: "", extra: "", note: "" });

  const fill = useCallback((x: any) => {
    setB(x);
    if (x) setForm({ date: x.next_billing_date || "", amount: String(x.amount ?? ""), extra: x.extra_amount ? String(x.extra_amount) : "", note: x.extra_note || "" });
  }, []);

  useEffect(() => {
    fetch(`/api/admin/proposals/${id}/billing`, { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); fill(j.billing); })
      .catch((e) => { setB(null); setMsg({ ok: false, text: e.message || "Billing is not available right now." }); });
  }, [id, fill]);

  async function act(name: string, body: Record<string, unknown>, done: string) {
    setBusy(name); setMsg(null);
    try {
      const r = await fetch(`/api/admin/proposals/${id}/billing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      fill(j.billing);
      setMsg({ ok: true, text: done });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "That didn't work." });
    } finally {
      setBusy("");
    }
  }

  function save() {
    const body: Record<string, unknown> = { action: "update", amount: Number(form.amount), extra_amount: Number(form.extra) || 0, extra_note: form.note };
    if (form.date && form.date !== b.next_billing_date) body.next_billing_date = form.date;
    act("save", body, b.card_last4 && form.date ? "Saved. The customer was emailed if the charge changed." : "Saved.");
  }

  if (b === undefined) return <section className="nv-glass rounded-nv-lg p-4 sm:p-5 text-nv-text-muted">Loading automatic billing…</section>;
  if (b === null && !msg) return null;

  const total = (Number(form.amount) || 0) + (Number(form.extra) || 0);
  const closed = b?.status === "cancelled";

  return (
    <section className="nv-glass rounded-nv-lg p-4 sm:p-5 grid gap-4">
      <h2 className="text-lg font-semibold text-nv-text-primary">Automatic billing</h2>
      {msg && <p role="status" className={msg.ok ? "text-nv-teal" : "text-red-400"}>{msg.text}</p>}
      {b && (
        <>
          <div className="grid gap-1 text-nv-text-secondary">
            <p className="text-nv-text-primary font-semibold">{STATUS[b.status] || b.status}</p>
            {b.card_last4 && <p>{b.card_brand || "Card"} ending in {b.card_last4}. Authorized {when(b.card_authorized_at)}.</p>}
            {b.next_billing_date && !closed && <p>Next charge {money(b.amount + b.extra_amount)} on {day(b.next_billing_date)}.</p>}
            {b.retry_on && <p>Trying the failed charge again on {day(b.retry_on)}.</p>}
            {b.last_error && <p className="text-amber-300">{b.last_error}</p>}
            {b.plan_note && <p className="text-sm">Their plan: {b.plan_note}</p>}
          </div>

          {b.needs_approval && !closed && (
            <div className="grid gap-2 rounded-nv-md border border-amber-300/40 p-3">
              <p className="text-nv-text-primary">The next charge of <b>{money(b.amount + b.extra_amount)}</b> is over this customer&apos;s {money(b.charge_limit)} limit. It won&apos;t charge, and they won&apos;t be told, until you approve it.</p>
              <button className={`${main} justify-self-start`} disabled={!!busy || !b.next_billing_date} onClick={() => act("approve", { action: "approve", total_cents: Math.round((b.amount + b.extra_amount) * 100) }, "Approved for this one charge. The customer was emailed the amount.")}>Approve {money(b.amount + b.extra_amount)} for this charge</button>
            </div>
          )}

          {!closed && (
            <button type="button" className={`${btn} justify-self-start`} onClick={async () => { await navigator.clipboard.writeText(b.card_url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}{copied ? "Copied" : "Copy the customer's card link"}
            </button>
          )}

          {b.status === "on_hold" && (
            <div className="grid gap-2">
              <p className="text-nv-text-primary">Check this charge in Square, then tell us what happened. It won&apos;t charge again until you do.</p>
              <div className="flex flex-wrap gap-2">
                <button className={btn} disabled={!!busy} onClick={() => act("resolve", { action: "resolve", charged: true }, "Recorded as paid. Moved to the next date.")}>It went through</button>
                <button className={btn} disabled={!!busy} onClick={() => act("resolve", { action: "resolve", charged: false }, "Recorded as not charged. It will try again on the next run.")}>It did not go through</button>
              </div>
            </div>
          )}

          {!closed && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className={label}>{b.charge_count > 0 ? "Next charge date" : "First charge date"}</span><input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
              <label><span className={label}>Monthly price</span><input type="number" min="1" step="0.01" className={field} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
              <label><span className={label}>Added to next charge only</span><input type="number" min="0" step="0.01" className={field} value={form.extra} placeholder="0" onChange={(e) => setForm({ ...form, extra: e.target.value })} /></label>
              <label><span className={label}>What it&apos;s for (customer sees this)</span><input className={field} value={form.note} placeholder="3.5% of online orders, November" onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                <button className={main} disabled={!!busy} onClick={save}>{busy === "save" && <Loader2 size={18} className="animate-spin" />}Save{total > 0 ? `: ${money(total)}` : ""}</button>
                {["active", "ready", "past_due"].includes(b.status) && <button className={btn} disabled={!!busy} onClick={() => act("pause", { action: "pause" }, "Paused. The customer was told.")}>Pause</button>}
                {["paused", "past_due"].includes(b.status) && <button className={btn} disabled={!!busy} onClick={() => act("resume", { action: "resume" }, "Billing is back on.")}>Turn back on</button>}
                <button className={btn} disabled={!!busy} onClick={() => { if (window.confirm("Stop automatic billing and remove this customer's card? This can't be undone.")) act("cancel", { action: "cancel" }, "Cancelled. The card was removed and the customer was told."); }}>Cancel billing</button>
              </div>
            </div>
          )}

          {b.history?.length > 0 && (
            <div className="grid gap-1 text-sm text-nv-text-secondary">
              <p className="text-nv-text-primary font-semibold">Charges</p>
              {b.history.map((h: any, i: number) => <p key={i}>{when(h.at)}: {money(h.amount)}, {RESULT[h.status] || h.status}{h.error ? ` (${h.error})` : ""}</p>)}
            </div>
          )}
        </>
      )}
    </section>
  );
}
