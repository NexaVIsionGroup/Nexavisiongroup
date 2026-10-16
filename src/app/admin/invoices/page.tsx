"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/admin/AppShell";
import { Loader2, RefreshCw, Search, ChevronDown, Copy, Check, ExternalLink, Mail, Phone, Plus, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import NewInvoiceForm, { type PickCustomer } from "./NewInvoiceForm";

type LineItem = { description?: string; quantity?: number; unit_price?: number; amount?: number };
type Payment = { amount: number; method: string | null; paid_at: string | null; processor: string | null; receipt_url: string | null };
type Invoice = {
  invoice_number: string;
  status: string;
  created_at: string;
  due_date: string | null;
  paid_date: string | null;
  customer: { name: string | null; email: string | null; phone: string | null; company: string | null };
  line_items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  surcharge_amount: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  source: string;
  order_id: string | null;
  no_email: boolean;
  pay_url: string | null;
  payments: Payment[];
};

const usd = (n: number) => Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

const chip = (s: string) =>
  cn(
    "text-[11px] px-2 py-0.5 rounded-full border capitalize",
    s === "paid" && "text-nv-teal bg-nv-teal/10 border-nv-teal/30",
    s === "partial" && "text-amber-300 bg-amber-300/10 border-amber-300/30",
    s === "overdue" && "text-nv-error bg-nv-error/10 border-nv-error/30",
    !["paid", "partial", "overdue"].includes(s) && "text-nv-text-secondary bg-white/5 border-white/10"
  );

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("paid");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [customers, setCustomers] = useState<PickCustomer[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/invoices", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load");
      setInvoices(j.invoices || []);
      setCustomers(j.customers || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const paid = invoices.filter((i) => i.status === "paid");
  const unpaid = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.status !== "draft");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const paidThisMonth = paid.filter((i) => i.paid_date && new Date(i.paid_date).getTime() >= monthStart);
  const sum = (list: Invoice[], f: (i: Invoice) => number) => list.reduce((s, i) => s + f(i), 0);

  const shown = useMemo(() => {
    const base = filter === "paid" ? paid : filter === "unpaid" ? unpaid : invoices;
    const t = q.trim().toLowerCase();
    if (!t) return base;
    return base.filter((i) =>
      [i.invoice_number, i.customer.name, i.customer.email, i.customer.phone, i.customer.company, ...i.line_items.map((l) => l.description)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [filter, q, invoices, paid, unpaid]);

  const act = async (action: "send" | "link" | "delete", inv: Invoice) => {
    if (action === "delete" && !confirm(`Delete ${inv.invoice_number} for ${usd(inv.total)}? The payment link will stop working.`)) return;
    setActing(`${action}:${inv.invoice_number}`);
    setErr("");
    setNote("");
    try {
      const r = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, invoice_number: inv.invoice_number }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      if (action === "link") {
        await navigator.clipboard.writeText(j.short_url);
        setCopied(inv.invoice_number);
        setTimeout(() => setCopied(null), 2500);
      } else if (action === "send") {
        setNote(`${inv.invoice_number} emailed to ${inv.customer.email}.`);
      } else {
        setNote(`${inv.invoice_number} deleted.`);
        setOpen(null);
        load();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setActing(null);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-display font-semibold text-nv-text-primary">Invoices</h1>
            <p className="text-sm text-nv-text-muted">Nexa invoices. Customers pay through the secure Nexa pay page.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-nv-teal text-nv-deep text-sm font-semibold"
            >
              <Plus size={16} /> New invoice
            </button>
            <button onClick={load} className="p-2 rounded-nv-md border border-white/10 text-nv-text-muted hover:text-nv-teal" aria-label="Refresh">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Tile label="Paid, all time" value={usd(sum(paid, (i) => i.amount_paid || i.total))} sub={`${paid.length} invoices`} />
          <Tile label="Paid this month" value={usd(sum(paidThisMonth, (i) => i.amount_paid || i.total))} sub={`${paidThisMonth.length} invoices`} />
          <Tile
            label="Waiting on payment"
            value={usd(sum(unpaid, (i) => i.total - i.amount_paid))}
            sub={`${unpaid.length} open`}
            warn={unpaid.length > 0}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2">
            {(["paid", "unpaid", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm border capitalize",
                  filter === f ? "bg-nv-teal/15 border-nv-teal/40 text-nv-teal" : "border-white/10 text-nv-text-muted"
                )}
              >
                {f === "paid" ? `Paid (${paid.length})` : f === "unpaid" ? `Unpaid (${unpaid.length})` : `All (${invoices.length})`}
              </button>
            ))}
          </div>
          <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-nv-deep/60">
            <Search size={15} className="text-nv-text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer, invoice #, item"
              className="flex-1 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted outline-none"
            />
          </label>
        </div>

        {err && <p className="text-sm text-nv-error mb-3">{err}</p>}
        {note && <p className="text-sm text-nv-teal mb-3">{note}</p>}
        {loading && !invoices.length ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-nv-teal" />
          </div>
        ) : shown.length === 0 ? (
          <p className="text-nv-text-muted text-sm py-10 text-center">No invoices here.</p>
        ) : (
          <div className="space-y-3">
            {shown.map((inv) => {
              const isOpen = open === inv.invoice_number;
              const what = inv.line_items.map((l) => l.description).filter(Boolean).join(", ");
              return (
                <div key={inv.invoice_number} className="rounded-nv-lg border border-white/10 bg-nv-deep/60">
                  <button onClick={() => setOpen(isOpen ? null : inv.invoice_number)} className="w-full text-left p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm text-nv-teal">{inv.invoice_number}</span>
                        <span className={chip(inv.status)}>{inv.status}</span>
                        {inv.source !== "manual" && <span className={chip("store")}>store order</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-nv-text-primary">{usd(inv.total)}</span>
                        <ChevronDown size={16} className={cn("text-nv-text-muted transition-transform", isOpen && "rotate-180")} />
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-nv-text-primary">
                        {inv.customer.name || inv.customer.phone || inv.customer.email || <span className="text-nv-text-muted">Link only (customer fills in when paying)</span>}
                        {inv.customer.company && <span className="text-nv-text-muted"> · {inv.customer.company}</span>}
                      </span>
                      <span className="text-xs text-nv-text-muted">
                        {inv.status === "paid" ? `Paid ${day(inv.paid_date)}` : `Sent ${day(inv.created_at)}`}
                      </span>
                    </div>
                    {what && <p className="mt-1 text-xs text-nv-text-muted truncate">{what}</p>}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-4 text-sm">
                      <div className="flex flex-wrap gap-4 text-nv-text-secondary">
                        {inv.customer.email && (
                          <a href={`mailto:${inv.customer.email}`} className="inline-flex items-center gap-1 hover:text-nv-teal">
                            <Mail size={13} /> {inv.customer.email}
                          </a>
                        )}
                        {inv.customer.phone && (
                          <a href={`tel:${inv.customer.phone}`} className="inline-flex items-center gap-1 hover:text-nv-teal">
                            <Phone size={13} /> {inv.customer.phone}
                          </a>
                        )}
                        {inv.no_email && <span className="text-amber-300">No emails (texted link)</span>}
                      </div>

                      <div>
                        {inv.line_items.map((l, i) => (
                          <div key={i} className="flex justify-between gap-3 py-1 border-b border-white/5">
                            <span className="text-nv-text-primary">
                              {l.description || "Item"}
                              {(l.quantity || 1) > 1 && <span className="text-nv-text-muted"> × {l.quantity}</span>}
                            </span>
                            <span className="font-mono text-nv-text-secondary">{usd(l.amount ?? (l.unit_price || 0) * (l.quantity || 1))}</span>
                          </div>
                        ))}
                        <div className="mt-2 space-y-0.5 text-nv-text-muted">
                          <Row label="Subtotal" value={usd(inv.subtotal)} />
                          {inv.surcharge_amount > 0 && <Row label="Card surcharge" value={usd(inv.surcharge_amount)} />}
                          {inv.tax_amount > 0 && <Row label={`Tax (${inv.tax_rate}%)`} value={usd(inv.tax_amount)} />}
                          <Row label="Total" value={usd(inv.total)} strong />
                          {inv.status !== "paid" && inv.amount_paid > 0 && <Row label="Paid so far" value={usd(inv.amount_paid)} />}
                        </div>
                      </div>

                      {inv.payments.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-nv-text-muted mb-1">Payments</p>
                          {inv.payments.map((p, i) => (
                            <div key={i} className="flex flex-wrap justify-between gap-2 py-1">
                              <span className="text-nv-text-secondary">
                                {day(p.paid_at)} · {p.method || "card"}
                                {p.processor && <span className="text-nv-text-muted"> via {p.processor === "stripe" ? "Stripe" : "Square"}</span>}
                              </span>
                              <span className="flex items-center gap-3">
                                <span className="font-mono text-nv-text-primary">{usd(p.amount)}</span>
                                {p.receipt_url && (
                                  <a href={p.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-nv-teal">
                                    Receipt <ExternalLink size={12} />
                                  </a>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {inv.notes && <p className="text-nv-text-muted whitespace-pre-line">{inv.notes}</p>}

                      {inv.pay_url && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => act("link", inv)}
                            disabled={!!acting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-nv-teal/40 bg-nv-teal/10 text-nv-teal"
                          >
                            {acting === `link:${inv.invoice_number}` ? <Loader2 size={15} className="animate-spin" /> : copied === inv.invoice_number ? <Check size={15} /> : <Copy size={15} />}
                            {copied === inv.invoice_number ? "Copied" : "Copy payment link"}
                          </button>
                          {inv.customer.email && !inv.no_email && (
                            <button
                              onClick={() => act("send", inv)}
                              disabled={!!acting}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-nv-text-secondary hover:text-nv-teal"
                            >
                              {acting === `send:${inv.invoice_number}` ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Email invoice
                            </button>
                          )}
                          {inv.amount_paid === 0 && inv.payments.length === 0 && (
                            <button
                              onClick={() => act("delete", inv)}
                              disabled={!!acting}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-nv-text-muted hover:text-nv-error"
                            >
                              {acting === `delete:${inv.invoice_number}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showNew && <NewInvoiceForm customers={customers} onClose={() => setShowNew(false)} onCreated={load} />}
    </AppShell>
  );
}

function Tile({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className="rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4">
      <p className="text-xs uppercase tracking-wide text-nv-text-muted">{label}</p>
      <p className={cn("text-2xl font-display font-semibold mt-1", warn ? "text-amber-300" : "text-nv-text-primary")}>{value}</p>
      <p className="text-xs text-nv-text-muted mt-0.5">{sub}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "text-nv-text-primary font-semibold")}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
