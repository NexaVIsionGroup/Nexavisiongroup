"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export type Plan = { code: string; name: string; audience: "business" | "personal"; monthly_price_cents: number; description: string | null; active: boolean; sort: number };
type Billing = { status: string; amount: number; next_billing_date: string | null; card_last4: string | null; paid_total: number; owed: number } | null;
export type Customer = {
  id: string; slug: string; name: string; kind: "business" | "personal"; industry: string; state: string; is_demo: boolean;
  contact_email: string | null; contact_phone: string | null; created_at: string; support_access: boolean; terms_accepted_at: string | null;
  status: string; plan: string; monthly_price_cents: number; trial_ends: string | null; billing_status: string | null; billing_ref: string | null;
  activated_at: string | null; last_seen: string | null; interested_at: string | null; banks: number; bank_errors: number; to_review: number; txns: number; last_txn: string | null;
  billing: Billing;
};

export const usd = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
export const usdD = (d: number) => d.toLocaleString("en-US", { style: "currency", currency: "USD" });
export const ago = (s: string | null) => {
  if (!s) return "never";
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};
export const chip = (tone: "ok" | "warn" | "bad" | "dim" | "violet") =>
  cn("text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap",
    tone === "ok" && "text-nv-teal bg-nv-teal/10 border-nv-teal/30",
    tone === "warn" && "text-amber-300 bg-amber-300/10 border-amber-300/30",
    tone === "bad" && "text-nv-error bg-nv-error/10 border-nv-error/30",
    tone === "violet" && "text-violet-300 bg-violet-400/10 border-violet-400/30",
    tone === "dim" && "text-nv-text-secondary bg-white/5 border-white/10");
export const statusChip = (s: string) => s === "active" ? chip("ok") : s === "suspended" ? chip("bad") : chip("dim");
export const statusLabel = (s: string) => (s === "active" ? "Active" : s === "suspended" ? "Paused" : "Not started");
export const billChip = (s: string | null | undefined) => !s || s === "none" ? chip("dim") : s === "active" ? chip("ok") : s === "past_due" || s === "on_hold" ? chip("bad") : chip("warn");
export const billLabel = (s: string | null | undefined) => ({ none: "No billing", awaiting_card: "Waiting for card", ready: "Card saved, no date", active: "Billing", paused: "Billing paused", past_due: "Payment failed", on_hold: "On hold", cancelled: "Cancelled" } as Record<string, string>)[s || "none"] || s || "No billing";
export const field = "w-full px-3 py-2.5 rounded-nv-md border border-white/10 bg-nv-void/60 text-sm text-nv-text-primary outline-none focus:border-nv-teal/50";
export const label = "block text-xs text-nv-text-muted mb-1";
export const btn = "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-nv-teal text-nv-deep text-sm font-semibold disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-white/15 text-nv-text-secondary text-sm hover:text-nv-teal hover:border-nv-teal/40 disabled:opacity-50";

export async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Failed (${r.status})`);
  return j;
}

export function CopyLink({ link }: { link: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-nv-md border border-nv-teal/30 bg-nv-teal/5 p-2">
      <span className="flex-1 text-xs text-nv-text-secondary break-all font-mono">{link}</span>
      <button className={btnGhost} onClick={() => { navigator.clipboard.writeText(link); setDone(true); setTimeout(() => setDone(false), 1500); }}>
        {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

