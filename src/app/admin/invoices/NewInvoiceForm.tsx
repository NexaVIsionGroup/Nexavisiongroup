"use client";

import { useMemo, useState } from "react";
import { X, Plus, Trash2, Loader2, Copy, Check, Mail, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickCustomer = { id: string; name: string | null; email: string | null; phone: string | null; company: string | null };
type Row = { key: number; description: string; quantity: string; unit_price: string };

const usd = (n: number) => Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
const cents = (v: string) => Math.round((parseFloat(v) || 0) * 100);
const input =
  "w-full px-3 py-2.5 rounded-nv-md border border-white/10 bg-nv-deep/80 text-nv-text-primary placeholder:text-nv-text-muted outline-none focus:border-nv-teal/50";
const label = "block text-xs uppercase tracking-wide text-nv-text-muted mb-1";

let nextKey = 1;
const blankRow = (): Row => ({ key: nextKey++, description: "", quantity: "1", unit_price: "" });

export default function NewInvoiceForm({
  customers,
  onClose,
  onCreated,
}: {
  customers: PickCustomer[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">(customers.length ? "existing" : "new");
  const [customerId, setCustomerId] = useState("");
  const [custSearch, setCustSearch] = useState("");
  const [newCust, setNewCust] = useState({ name: "", phone: "", email: "", company: "" });
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [taxRate, setTaxRate] = useState("0");
  const [surcharge, setSurcharge] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [noEmail, setNoEmail] = useState(false);
  const [busy, setBusy] = useState<"" | "email" | "link">("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ invoice_number: string; total: number; short_url: string; emailed: boolean; email_error: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const picked = customers.find((c) => c.id === customerId) || null;
  const matches = useMemo(() => {
    const t = custSearch.trim().toLowerCase();
    const list = t
      ? customers.filter((c) => [c.name, c.email, c.phone, c.company].filter(Boolean).some((v) => String(v).toLowerCase().includes(t)))
      : customers;
    return list.slice(0, 8);
  }, [custSearch, customers]);

  // Same math as JHPS: 4% surcharge on the subtotal, tax on subtotal + surcharge
  const subtotal = rows.reduce((s, r) => s + cents(r.unit_price) * Math.max(1, Math.round(Number(r.quantity) || 1)), 0);
  const surchargeAmt = surcharge ? Math.round(subtotal * 0.04) : 0;
  const tax = Math.round((subtotal + surchargeAmt) * ((parseFloat(taxRate) || 0) / 100));
  const total = subtotal + surchargeAmt + tax;

  const custEmail = mode === "existing" ? picked?.email : newCust.email.trim();
  const canEmail = !noEmail && !!custEmail;

  const setRow = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async (send: boolean) => {
    setErr("");
    if (mode === "existing" && !customerId) return setErr("Pick a customer, or switch to New customer.");
    if (mode === "new" && !newCust.name.trim() && !newCust.phone.trim() && !newCust.email.trim()) return setErr("Enter the customer's name or phone.");
    const items = rows
      .filter((r) => r.description.trim() && cents(r.unit_price) > 0)
      .map((r) => ({ description: r.description.trim(), quantity: Math.max(1, Math.round(Number(r.quantity) || 1)), unit_price: cents(r.unit_price) / 100 }));
    if (!items.length) return setErr("Add at least one item with a price.");

    setBusy(send ? "email" : "link");
    try {
      const r = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          customer: mode === "existing" ? { id: customerId } : newCust,
          items,
          tax_rate: parseFloat(taxRate) || 0,
          surcharge,
          due_date: dueDate || null,
          notes,
          no_email: noEmail,
          send,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not create the invoice");
      setDone(j);
      onCreated();
      if (!send || !j.emailed) {
        try {
          await navigator.clipboard.writeText(j.short_url);
          setCopied(true);
        } catch {
          /* clipboard can be blocked; the link is shown to copy by hand */
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the invoice");
    } finally {
      setBusy("");
    }
  };

  const copy = async () => {
    if (!done) return;
    await navigator.clipboard.writeText(done.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto p-0 sm:p-6">
      <div className="w-full sm:max-w-2xl bg-nv-deep border border-white/10 sm:rounded-nv-lg min-h-screen sm:min-h-0">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-nv-deep">
          <h2 className="text-lg font-display font-semibold text-nv-text-primary">{done ? "Invoice created" : "New invoice"}</h2>
          <button onClick={onClose} className="p-2 text-nv-text-muted hover:text-nv-teal" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="rounded-nv-lg border border-nv-teal/30 bg-nv-teal/10 p-4">
              <p className="font-mono text-nv-teal">{done.invoice_number}</p>
              <p className="text-2xl font-display font-semibold text-nv-text-primary mt-1">{usd(done.total)}</p>
              <p className="text-sm text-nv-text-secondary mt-2">
                {done.emailed
                  ? `Emailed to ${custEmail}.`
                  : done.email_error
                    ? `Created, but the email didn't go out: ${done.email_error}`
                    : copied
                      ? "Payment link copied. Paste it in a text to the customer."
                      : "Copy the payment link below and text it to the customer."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate px-3 py-2.5 rounded-nv-md border border-white/10 text-sm text-nv-text-primary">{done.short_url}</code>
              <button onClick={copy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-nv-teal/40 bg-nv-teal/10 text-nv-teal">
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-full bg-nv-teal text-nv-deep font-semibold">
              Done
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Customer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={label}>Customer</span>
                <div className="flex gap-1">
                  {(["existing", "new"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border",
                        mode === m ? "bg-nv-teal/15 border-nv-teal/40 text-nv-teal" : "border-white/10 text-nv-text-muted"
                      )}
                    >
                      {m === "existing" ? "Existing" : "New customer"}
                    </button>
                  ))}
                </div>
              </div>
              {mode === "existing" ? (
                picked ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-nv-md border border-nv-teal/30 bg-nv-teal/5">
                    <div className="min-w-0">
                      <p className="text-nv-text-primary truncate">{picked.name || picked.company || picked.phone}</p>
                      <p className="text-xs text-nv-text-muted truncate">{[picked.phone, picked.email].filter(Boolean).join(" · ") || "No contact info"}</p>
                    </div>
                    <button onClick={() => setCustomerId("")} className="text-xs text-nv-teal shrink-0">
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="Search name, phone, email" className={input} />
                    <div className="mt-1 rounded-nv-md border border-white/10 divide-y divide-white/5 max-h-64 overflow-y-auto">
                      {matches.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-nv-text-muted">No match. Use “New customer”.</p>
                      ) : (
                        matches.map((c) => (
                          <button key={c.id} onClick={() => setCustomerId(c.id)} className="w-full text-left px-3 py-2.5 hover:bg-white/5">
                            <p className="text-sm text-nv-text-primary">{c.name || c.company || "—"}</p>
                            <p className="text-xs text-nv-text-muted">{[c.phone, c.email].filter(Boolean).join(" · ")}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} placeholder="Name" className={input} />
                  <input value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} placeholder="Phone" inputMode="tel" className={input} />
                  <input value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} placeholder="Email (optional)" inputMode="email" className={input} />
                  <input value={newCust.company} onChange={(e) => setNewCust({ ...newCust, company: e.target.value })} placeholder="Company (optional)" className={input} />
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <span className={label}>Items</span>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.key} className="grid grid-cols-[1fr_auto] gap-2 rounded-nv-md border border-white/10 p-2">
                    <input value={r.description} onChange={(e) => setRow(r.key, { description: e.target.value })} placeholder="What is it? (e.g. Nexa Pro 11, 12GB/256GB, black)" className={cn(input, "col-span-2")} />
                    <div className="flex gap-2">
                      <input value={r.quantity} onChange={(e) => setRow(r.key, { quantity: e.target.value })} inputMode="numeric" aria-label="Quantity" className={cn(input, "w-16 text-center")} />
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nv-text-muted">$</span>
                        <input value={r.unit_price} onChange={(e) => setRow(r.key, { unit_price: e.target.value })} inputMode="decimal" placeholder="0.00" aria-label="Price each" className={cn(input, "pl-7 font-mono")} />
                      </div>
                    </div>
                    <button
                      onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [blankRow()]))}
                      className="px-3 text-nv-text-muted hover:text-nv-error"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setRows((rs) => [...rs, blankRow()])} className="mt-2 inline-flex items-center gap-1 text-sm text-nv-teal">
                <Plus size={15} /> Add item
              </button>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className={label}>Tax %</span>
                <input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" className={cn(input, "font-mono")} />
              </div>
              <div>
                <span className={label}>Due date (optional)</span>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={input} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle on={surcharge} onClick={() => setSurcharge(!surcharge)} label={surcharge ? "4% card surcharge: ON" : "4% card surcharge: OFF"} />
              <Toggle on={noEmail} warn onClick={() => setNoEmail(!noEmail)} label={noEmail ? "No emails: text the link only" : "Emails ON (invoice + receipt)"} />
            </div>
            <div>
              <span className={label}>Notes (optional, shown on the invoice)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={input} />
            </div>

            {/* Totals */}
            <div className="rounded-nv-md border border-white/10 p-3 text-sm space-y-1">
              <Line l="Subtotal" v={usd(subtotal / 100)} />
              {surchargeAmt > 0 && <Line l="Card surcharge (4%)" v={usd(surchargeAmt / 100)} />}
              {tax > 0 && <Line l={`Tax (${parseFloat(taxRate) || 0}%)`} v={usd(tax / 100)} />}
              <Line l="Total" v={usd(total / 100)} strong />
            </div>

            {err && <p className="text-sm text-nv-error">{err}</p>}

            <div className="flex flex-col sm:flex-row gap-2 pb-2">
              <button
                onClick={() => submit(false)}
                disabled={!!busy}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-full font-semibold border",
                  canEmail ? "border-nv-teal/40 text-nv-teal" : "bg-nv-teal text-nv-deep border-nv-teal"
                )}
              >
                {busy === "link" ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />} Create & copy link
              </button>
              {canEmail && (
                <button
                  onClick={() => submit(true)}
                  disabled={!!busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-full font-semibold bg-nv-teal text-nv-deep"
                >
                  {busy === "email" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Create & email
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, warn, label: text, onClick }: { on: boolean; warn?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-nv-md border text-sm font-medium",
        on
          ? warn
            ? "border-amber-300/40 bg-amber-300/10 text-amber-300"
            : "border-nv-teal/40 bg-nv-teal/10 text-nv-teal"
          : "border-white/10 text-nv-text-muted"
      )}
    >
      {text}
    </button>
  );
}

function Line({ l, v, strong }: { l: string; v: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong ? "text-nv-text-primary font-semibold" : "text-nv-text-muted")}>
      <span>{l}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}
