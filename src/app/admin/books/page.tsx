"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/admin/AppShell";
import { AlertTriangle, Loader2, Plus, RefreshCw, Search, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadSaved, fetchJson } from "@/lib/admin/cache";
import { CopyLink, ago, usdD, billChip, billLabel, btn, btnGhost, chip, field, label, post, statusChip, statusLabel, usd, type Customer, type Plan } from "./ui";

const isLead = (c: Customer) => !!c.interested_at && c.status !== "active";
const needsAttention = (c: Customer) => c.bank_errors > 0 || c.billing_status === "past_due" || c.billing_status === "on_hold" || (c.billing?.owed ?? 0) > 0 || c.to_review > 50;

export default function BooksCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"all" | "personal" | "business" | "leads" | "attention" | "plans">("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    type Resp = { customers: Customer[]; plans: Plan[] };
    const r = await loadSaved<Resp>("books:customers", () => fetchJson<Resp>("/api/admin/books", { cache: "no-store" }, 45000),
      (j) => { setCustomers(j.customers || []); setPlans(j.plans || []); setLoading(false); });
    if (!r.ok) setErr(r.hadCache ? `Couldn't refresh (${r.error}). Showing the saved copy.` : r.error || "Failed to load");
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const real = customers.filter((c) => !c.is_demo);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return real
      .filter((c) => tab === "all" || tab === "plans" || (tab === "attention" ? needsAttention(c) : tab === "leads" ? isLead(c) : c.kind === tab))
      .filter((c) => !t || [c.name, c.slug, c.contact_email, c.contact_phone].some((v) => v?.toLowerCase().includes(t)));
  }, [real, tab, q]);

  const active = real.filter((c) => c.status === "active");
  const mrr = real.filter((c) => c.billing?.status === "active").reduce((s, c) => s + c.monthly_price_cents, 0);
  const paid = real.reduce((s, c) => s + (c.billing?.paid_total ?? 0), 0);
  const owed = real.reduce((s, c) => s + (c.billing?.owed ?? 0), 0);
  const attention = real.filter(needsAttention).length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-books-control>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-display font-semibold text-nv-text-primary">NexaBooks customers</h1>
            <p className="text-sm text-nv-text-muted">Businesses and people using NexaBooks: plans, billing, banks, and support access.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-nv-teal text-nv-deep text-sm font-semibold" data-books-add>
              <UserPlus size={16} /> Add a person
            </button>
            <button onClick={load} className="p-2 rounded-nv-md border border-white/10 text-nv-text-muted hover:text-nv-teal" aria-label="Refresh">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Tile label="Active" value={String(active.length)} sub={`${real.length} customers`} />
          <Tile label="Monthly billing" value={usd(mrr)} sub="cards being charged" />
          <Tile label="Paid, all time" value={usdD(paid)} sub="NexaBooks charges" />
          <Tile label="Owed" value={usdD(owed)} sub={attention ? `${attention} need attention` : "nothing failing"} warn={owed > 0 || attention > 0} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2 overflow-x-auto">
            {([["all", `All (${real.length})`], ["personal", "People"], ["business", "Businesses"], ["leads", `Asked for it (${real.filter(isLead).length})`], ["attention", `Attention (${attention})`], ["plans", "Plans & prices"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} data-books-tab={k}
                className={cn("px-4 py-2 rounded-full text-sm border whitespace-nowrap", tab === k ? "bg-nv-teal/15 border-nv-teal/40 text-nv-teal" : "border-white/10 text-nv-text-muted")}>
                {label}
              </button>
            ))}
          </div>
          {tab !== "plans" && (
            <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-nv-deep/60">
              <Search size={15} className="text-nv-text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" className="flex-1 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted outline-none" />
            </label>
          )}
        </div>

        {err && <p className="text-sm text-nv-error mb-3">{err}</p>}
        {tab === "plans" ? <PlansEditor plans={plans} onSaved={setPlans} /> : loading && !customers.length ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-nv-teal" /></div>
        ) : shown.length === 0 ? (
          <p className="text-nv-text-muted text-sm py-10 text-center">No customers here.</p>
        ) : (
          <div className="space-y-3" data-books-list>
            {shown.map((c) => (
              <Link key={c.id} href={`/admin/books/${c.id}`} data-books-row={c.name}
                className="block rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4 hover:border-nv-teal/40 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-nv-text-primary truncate">{c.name}</span>
                    <span className={chip(c.kind === "personal" ? "violet" : "dim")}>{c.kind === "personal" ? "Person" : c.industry}</span>
                    <span className={statusChip(c.status)}>{statusLabel(c.status)}</span>
                    {isLead(c) && <span className={chip("warn")}>Asked for NexaBooks {ago(c.interested_at)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-nv-text-primary">{c.monthly_price_cents ? `${usd(c.monthly_price_cents)}/mo` : c.plan}</span>
                    <span className={billChip(c.billing?.status ?? c.billing_status)}>{billLabel(c.billing?.status ?? c.billing_status)}</span>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-nv-text-muted">
                  <span>{c.contact_email || c.slug}</span>
                  <span className={c.bank_errors ? "text-nv-error" : ""}>{c.banks ? `${c.banks} bank${c.banks > 1 ? "s" : ""}${c.bank_errors ? `, ${c.bank_errors} need reconnecting` : ""}` : "No bank yet"}</span>
                  {c.to_review ? <span className={c.to_review > 50 ? "text-amber-300" : ""}>{c.to_review} to review</span> : null}
                  {c.billing?.owed ? <span className="text-nv-error">Owes {usdD(c.billing.owed)}</span> : null}
                  {c.billing?.next_billing_date && c.billing.status === "active" ? <span>Next charge {c.billing.next_billing_date}</span> : null}
                  <span>Last in {ago(c.last_seen)}</span>
                  {!c.support_access && <span className="text-amber-300">Support access off</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {adding && <AddPerson plans={plans.filter((p) => p.audience === "personal" && p.active)} onClose={() => setAdding(false)} onDone={load} />}
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

function AddPerson({ plans, onClose, onDone }: { plans: Plan[]; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", state: "SC", plan: plans[0]?.code ?? "personal", price: plans[0] ? String(plans[0].monthly_price_cents / 100) : "0", trial: "14", notes: "", send: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ link: string; emailed: boolean; id: string } | null>(null);
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const r = await post({ action: "create-personal", name: f.name, email: f.email, phone: f.phone || undefined, state: f.state, plan: f.plan, price_cents: Math.round(Number(f.price) * 100), trial_days: Number(f.trial) || undefined, notes: f.notes || undefined, send: f.send });
      setResult(r); onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-nv-lg sm:rounded-nv-lg border border-white/10 bg-nv-deep p-5 space-y-4" onClick={(e) => e.stopPropagation()} data-books-addform>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-nv-text-primary">Add a person</h2>
          <button onClick={onClose} className="p-1 text-nv-text-muted" aria-label="Close"><X size={18} /></button>
        </div>
        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-nv-teal">{result.emailed ? "Done. The invitation is in their inbox." : "Done. Send them this link (it works for 14 days):"}</p>
            <CopyLink link={result.link} />
            <div className="flex gap-2"><Link href={`/admin/books/${result.id}`} className={btn}>Open their account</Link><button className={btnGhost} onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <>
            <p className="text-sm text-nv-text-muted">For someone using NexaBooks for their own money (not a business). They get an invitation link, link their bank with Plaid, and add a card if the plan has a price.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className={label}>Name</label><input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} data-add-name /></div>
              <div><label className={label}>Email</label><input className={field} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} data-add-email /></div>
              <div><label className={label}>Phone (optional)</label><input className={field} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div><label className={label}>Plan</label>
                <select className={field} value={f.plan} onChange={(e) => { const p = plans.find((x) => x.code === e.target.value); setF((x) => ({ ...x, plan: e.target.value, price: p ? String(p.monthly_price_cents / 100) : x.price })); }}>
                  {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select></div>
              <div><label className={label}>Price a month ($)</label><input className={field} inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} data-add-price /></div>
              <div><label className={label}>Free days before the first charge</label><input className={field} inputMode="numeric" value={f.trial} onChange={(e) => set("trial", e.target.value)} /></div>
              <div><label className={label}>State</label><input className={field} maxLength={2} value={f.state} onChange={(e) => set("state", e.target.value.toUpperCase())} /></div>
              <div className="sm:col-span-2"><label className={label}>Notes (only NexaVision sees these)</label><textarea className={field} rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-nv-text-secondary"><input type="checkbox" checked={f.send} onChange={(e) => set("send", e.target.checked)} className="w-4 h-4 accent-teal-400" /> Email them the invitation now</label>
            {err && <p className="text-sm text-nv-error">{err}</p>}
            <button className={btn + " w-full"} disabled={busy || !f.name || !f.email} onClick={submit} data-add-go>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create and invite
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PlansEditor({ plans, onSaved }: { plans: Plan[]; onSaved: (p: Plan[]) => void }) {
  const [rows, setRows] = useState<Plan[]>(plans);
  const [msg, setMsg] = useState("");
  useEffect(() => setRows(plans), [plans]);
  const save = async (p: Plan) => {
    setMsg("");
    try { const r = await post({ action: "plan-save", plan: p }); onSaved(r.plans); setMsg(`Saved ${p.name}.`); } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); }
  };
  const edit = (i: number, k: keyof Plan, v: unknown) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-3" data-books-plans>
      <p className="text-sm text-nv-text-muted flex items-start gap-2"><AlertTriangle size={15} className="text-amber-300 shrink-0 mt-0.5" /> Changing a plan&apos;s price affects new customers only. To change what someone already pays, open their account.</p>
      {msg && <p className="text-sm text-nv-teal">{msg}</p>}
      {rows.map((p, i) => (
        <div key={p.code + i} className="rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2"><label className={label}>Name</label><input className={field} value={p.name} onChange={(e) => edit(i, "name", e.target.value)} /></div>
          <div><label className={label}>For</label>
            <select className={field} value={p.audience} onChange={(e) => edit(i, "audience", e.target.value)}><option value="personal">People</option><option value="business">Businesses</option></select></div>
          <div><label className={label}>$ a month</label><input className={field} inputMode="decimal" value={p.monthly_price_cents / 100} onChange={(e) => edit(i, "monthly_price_cents", Math.round(Number(e.target.value) * 100) || 0)} data-plan-price={p.code} /></div>
          <label className="flex items-center gap-2 text-sm text-nv-text-secondary pb-2"><input type="checkbox" checked={p.active} onChange={(e) => edit(i, "active", e.target.checked)} className="w-4 h-4" /> Offered</label>
          <button className={btnGhost} onClick={() => save(p)} data-plan-save={p.code}>Save</button>
          <div className="sm:col-span-6"><label className={label}>What&apos;s included</label><input className={field} value={p.description ?? ""} onChange={(e) => edit(i, "description", e.target.value)} /></div>
          {!plans.some((x) => x.code === p.code) && <div className="sm:col-span-6"><label className={label}>Code (lowercase, no spaces)</label><input className={field} value={p.code} onChange={(e) => edit(i, "code", e.target.value)} /></div>}
        </div>
      ))}
      <button className={btnGhost} onClick={() => setRows((r) => [...r, { code: "", name: "", audience: "personal", monthly_price_cents: 0, description: "", active: true, sort: r.length + 1 }])}><Plus size={14} /> New plan</button>
    </div>
  );
}
