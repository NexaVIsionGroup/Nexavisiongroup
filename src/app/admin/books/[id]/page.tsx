"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/admin/AppShell";
import { ArrowLeft, Eye, Landmark, Loader2, Mail, Phone, RefreshCw, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyLink, ago, billChip, billLabel, btn, btnGhost, chip, field, label, post, statusChip, statusLabel, usd, usdD, type Customer, type Plan } from "../ui";

type Detail = {
  customer: Customer & { side_business?: string | null }; notes: string | null; plans: Plan[];
  users: { id: string; name: string | null; email: string | null; role: string; external_id: string; last_seen: string }[];
  banks: { id: string; institution_name: string; status: string; last_synced_at: string | null; last_error: string | null; accounts: { name: string; mask: string | null; type: string; balance: number | null }[] | null }[];
  events: { type: string; data: Record<string, unknown>; at: string }[];
  invite_delivery?: { to: string; status: string; at: string; reason: string | null } | null;
  access: { kind: string; email: string | null; staff: string | null; reason: string | null; expires_at: string; used_at: string | null; created_at: string }[];
  billing: null | { error: string } | {
    status: string; amount: number; extra_amount?: number; next_billing_date: string | null; card_brand: string | null; card_last4: string | null; card_url: string | null;
    failed_attempts: number; last_error: string | null; history: { at: string; amount: number; status: string; error: string | null }[]; paid_total: number; owed: number;
  };
};

const EVENT: Record<string, string> = {
  "customer.created": "Account created", "customer.updated": "Account changed", "invite.created": "Invitation made", "invite.accepted": "Accepted the invitation",
  "launch.ok": "Signed in", "mfa.code_sent": "Sign-in code sent", "mfa.failed": "Wrong sign-in code", "support.opened": "Support visit", "support.allowed": "Turned support access on",
  "support.blocked": "Turned support access off", "invite.cancelled": "Invitation cancelled", "customer.email_changed": "Email changed",
  "budget.suggested": "Set budgets from usual spending", "control.sync": "Bank synced by NexaVision", "bank.linked": "Bank linked", "plaid.linked": "Bank linked",
};
const when = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function BooksCustomer({ params }: { params: { id: string } }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<{ what: string; url: string } | null>(null);

  const load = useCallback(async () => {
    setErr("");
    const r = await fetch(`/api/admin/books?id=${encodeURIComponent(params.id)}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) setErr(j.error || `Failed (${r.status})`); else setD(j);
  }, [params.id]);
  useEffect(() => { load(); }, [load]);

  const act = async (name: string, body: Record<string, unknown>, after?: (j: any) => void) => {
    setBusy(name); setMsg(""); setErr("");
    try { const j = await post({ id: d?.customer.id, ...body }); after?.(j); await load(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(null); }
  };

  if (!d) return <AppShell><div className="p-6 max-w-4xl mx-auto">{err ? <p className="text-nv-error text-sm">{err}</p> : <div className="flex justify-center py-16"><Loader2 className="animate-spin text-nv-teal" /></div>}</div></AppShell>;
  const c = d.customer;
  const billing = d.billing && !("error" in d.billing) ? d.billing : null;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4" data-books-detail>
        <Link href="/admin/books" className="inline-flex items-center gap-1 text-sm text-nv-text-muted hover:text-nv-teal"><ArrowLeft size={15} /> All NexaBooks customers</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-display font-semibold text-nv-text-primary">{c.name}</h1>
              <span className={chip(c.kind === "personal" ? "violet" : "dim")}>{c.kind === "personal" ? "Person" : c.industry}</span>
              <span className={statusChip(c.status)}>{statusLabel(c.status)}</span>
              <span className={billChip(billing?.status ?? c.billing_status)}>{billLabel(billing?.status ?? c.billing_status)}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-nv-text-muted">
              {c.contact_email && <a href={`mailto:${c.contact_email}`} className="inline-flex items-center gap-1 hover:text-nv-teal"><Mail size={13} /> {c.contact_email}</a>}
              {c.contact_phone && <a href={`tel:${c.contact_phone}`} className="inline-flex items-center gap-1 hover:text-nv-teal"><Phone size={13} /> {c.contact_phone}</a>}
              <span>Since {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span>Last in {ago(c.last_seen)}</span>
            </div>
          </div>
          <button onClick={load} className="p-2 rounded-nv-md border border-white/10 text-nv-text-muted hover:text-nv-teal" aria-label="Refresh"><RefreshCw size={16} /></button>
        </div>

        {err && <p className="text-sm text-nv-error" role="alert">{err}</p>}
        {msg && <p className="text-sm text-nv-teal">{msg}</p>}

        {/* ── Help them: open their books ── */}
        <Card title="Help them">
          <SupportBox c={c} busy={busy === "support"} onOpen={(reason) => act("support", { action: "support-link", reason }, (j) => { window.open(j.link, "_blank", "noopener"); setLink({ what: "Support link (works once, for 5 minutes)", url: j.link }); })} />
          <div className="flex flex-wrap gap-2">
            {c.banks > 0 && <button className={btnGhost} disabled={!!busy} onClick={() => act("sync", { action: "sync" }, (j) => setMsg(`Synced: ${(j.results || []).map((r: any) => r.ok ? `${r.added ?? 0} new` : r.error).join(", ") || "no banks"}.`))}>{busy === "sync" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Pull latest from their bank</button>}
            {c.kind === "personal" && <>
              <button className={btnGhost} disabled={!!busy} onClick={() => act("invite", { action: "invite", send: true }, (j) => { setMsg(j.emailed ? "A new invitation is in their inbox." : "Made a new invitation, but the email didn't send. Copy the link below."); setLink({ what: "Invitation link (14 days)", url: j.link }); })}><Send size={14} /> Email a new sign-up link</button>
              <button className={btnGhost} disabled={!!busy} onClick={() => act("invite", { action: "invite", send: false }, (j) => setLink({ what: "Invitation link (14 days). Text or email it to them.", url: j.link }))}>Make a link to text them</button>
            </>}
          </div>
          {link && <div className="space-y-1"><p className={label}>{link.what}</p><CopyLink link={link.url} /></div>}
          {d.invite_delivery && ["bounced", "complained", "failed"].includes(d.invite_delivery.status) ? (
            <p className="text-sm text-nv-error" role="alert" data-invite-bounced>The last invitation to {d.invite_delivery.to} did not arrive ({d.invite_delivery.status}). {d.invite_delivery.reason ?? ""} Fix the email under Contact, then send a new sign-up link.</p>
          ) : d.invite_delivery && c.kind === "personal" && !c.terms_accepted_at ? (
            <p className="text-sm text-nv-text-muted">Last invitation: {d.invite_delivery.to}, {d.invite_delivery.status === "delivered" ? "delivered" : d.invite_delivery.status === "opened" ? "opened" : d.invite_delivery.status}.</p>
          ) : null}
          {c.kind === "personal" && !c.terms_accepted_at && <p className="text-sm text-amber-300">They haven&apos;t accepted their invitation yet.</p>}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlanCard c={c} plans={d.plans} busy={busy === "plan"} onSave={(fields) => act("plan", { action: "update", fields }, () => setMsg("Saved."))} />
          <BillingCard c={c} billing={billing} billingError={d.billing && "error" in d.billing ? d.billing.error : null} busy={busy}
            onStart={(first) => act("bstart", { action: "billing-start", first_charge: first }, (j) => { setLink({ what: "Their card link. NexaBooks also shows them an \"Add card\" note.", url: j.card_url }); })}
            onOp={(op, extra) => act("bop", { action: "billing", op, ...extra }, () => setMsg("Billing updated."))} />
        </div>

        <Card title={`Banks (${d.banks.length})`}>
          {d.banks.length === 0 ? <p className="text-sm text-nv-text-muted">No bank linked yet.</p> : d.banks.map((b) => (
            <div key={b.id} className="rounded-nv-md border border-white/10 p-3 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-nv-text-primary font-medium"><Landmark size={14} /> {b.institution_name}</span>
                <span className={b.status === "ok" ? chip("ok") : chip("bad")}>{b.status === "ok" ? "Connected" : "Needs reconnecting"}</span>
              </div>
              <p className="text-xs text-nv-text-muted">Last synced {ago(b.last_synced_at)}{b.last_error ? ` · ${b.last_error}` : ""}</p>
              {(b.accounts || []).map((a, i) => (
                <div key={i} className="flex justify-between text-sm text-nv-text-secondary"><span>{a.name}{a.mask ? ` ••${a.mask}` : ""} <span className="text-nv-text-muted text-xs">{a.type}</span></span><span>{a.balance != null ? usd(a.balance) : ""}</span></div>
              ))}
            </div>
          ))}
          <p className="text-xs text-nv-text-muted">{c.txns.toLocaleString()} transactions{c.last_txn ? `, newest ${c.last_txn}` : ""} · {c.to_review} waiting for their answer</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Support visits and invitations">
            {d.access.length === 0 ? <p className="text-sm text-nv-text-muted">None yet.</p> : d.access.map((a, i) => (
              <div key={i} className="text-sm border-b border-white/5 pb-2">
                <p className="text-nv-text-primary">{a.kind === "support" ? `Support: ${a.staff}` : `Invitation to ${a.email}`}</p>
                <p className="text-xs text-nv-text-muted">{when(a.created_at)}{a.reason ? ` · ${a.reason}` : ""} · {a.used_at ? (a.kind === "support" ? "opened" : "accepted") : new Date(a.expires_at) < new Date() ? "expired" : "not used yet"}</p>
              </div>
            ))}
            <p className="text-xs text-nv-text-muted">{c.support_access ? "They allow support visits." : "They have turned support visits off."} Visits are listed in their Settings too.</p>
          </Card>
          <Card title="Recent activity">
            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {d.events.map((e, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span className="text-nv-text-secondary">{EVENT[e.type] || e.type}{e.type === "support.opened" ? ` (${String(e.data?.staff ?? "")})` : ""}{e.type === "invite.created" && e.data?.to ? `, emailed to ${String(e.data.to)}` : ""}{e.type === "customer.email_changed" ? `: ${String(e.data?.from ?? "")} → ${String(e.data?.to ?? "")}` : ""}</span>
                  <span className="text-xs text-nv-text-muted whitespace-nowrap">{when(e.at)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {c.kind === "personal" && <HouseholdCard users={d.users} busy={busy === "member"} onAdd={(name, email) => act("member", { action: "add-member", name, email }, (j) => { setMsg(j.emailed ? `Added ${name}. Their invitation went to ${j.to}.` : `Added ${name}.`); setLink({ what: `${name}'s invitation link (14 days)`, url: j.link }); })} />}

        <NotesCard initial={d.notes} side={c.kind === "personal" ? (c.side_business ?? "") : null} contact={{ email: c.contact_email, phone: c.contact_phone, name: c.name }} busy={busy === "notes"} onSave={(fields) => act("notes", { action: "update", fields }, () => setMsg("Saved."))} />

        {c.kind === "personal" && <CloseCard name={c.name} busy={busy === "close"} onClose={(confirm) => act("close", { action: "close", confirm }, () => { window.location.href = "/admin/books"; })} />}
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4 space-y-3"><h2 className="font-display font-semibold text-nv-text-primary">{title}</h2>{children}</section>;
}

function SupportBox({ c, busy, onOpen }: { c: Customer; busy: boolean; onOpen: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  if (!c.support_access) return <p className="text-sm text-amber-300">{c.name} has turned off support access, so you can&apos;t open their books. Ask them to turn it on in NexaBooks Settings, or go through it on their screen.</p>;
  return (
    <div className="space-y-2">
      <label className={label} htmlFor="reason">Why are you opening their books? They see this.</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input id="reason" className={field} placeholder='e.g. "Called about a $412 charge on Nov 3"' value={reason} onChange={(e) => setReason(e.target.value)} data-support-reason />
        <button className={btn + " whitespace-nowrap"} disabled={busy || reason.trim().length < 3} onClick={() => onOpen(reason.trim())} data-support-open>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} View their books
        </button>
      </div>
      <p className="text-xs text-nv-text-muted">Opens in a new tab, read-only, for up to 2 hours, with a banner saying NexaVision support is viewing.</p>
    </div>
  );
}

function PlanCard({ c, plans, busy, onSave }: { c: Customer; plans: Plan[]; busy: boolean; onSave: (f: Record<string, unknown>) => void }) {
  const [plan, setPlan] = useState(c.plan);
  const [price, setPrice] = useState(String(c.monthly_price_cents / 100));
  const [status, setStatus] = useState(c.status);
  const [trial, setTrial] = useState(c.trial_ends ?? "");
  useEffect(() => { setPlan(c.plan); setPrice(String(c.monthly_price_cents / 100)); setStatus(c.status); setTrial(c.trial_ends ?? ""); }, [c]);
  const options = plans.filter((p) => p.audience === c.kind || p.code === c.plan);
  return (
    <Card title="Plan and access">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Plan</label>
          <select className={field} value={plan} onChange={(e) => { setPlan(e.target.value); const p = plans.find((x) => x.code === e.target.value); if (p) setPrice(String(p.monthly_price_cents / 100)); }}>
            {!options.some((p) => p.code === plan) && <option value={plan}>{plan}</option>}
            {options.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select></div>
        <div><label className={label}>$ a month</label><input className={field} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} data-plan-price-edit /></div>
        <div><label className={label}>Access</label>
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value)} data-plan-status>
            <option value="available">Not started</option><option value="active">Active</option><option value="suspended">Paused (they see &quot;paused&quot;)</option>
          </select></div>
        <div><label className={label}>Free until</label><input className={field} type="date" value={trial} onChange={(e) => setTrial(e.target.value)} /></div>
      </div>
      {c.plan === "preview" && <p className="text-sm text-amber-300">{c.interested_at ? `They asked for NexaBooks ${ago(c.interested_at)}. ` : ""}On the preview plan they can look but can&apos;t switch it on. Pick Business or Business Pro and save; then they tap Activate in their admin app.</p>}
      <button className={btn} disabled={busy} onClick={() => onSave({ plan, monthly_price_cents: Math.round(Number(price) * 100), status, trial_ends: trial || null })} data-plan-save-customer>
        {busy && <Loader2 size={14} className="animate-spin" />} Save
      </button>
      {c.billing_ref && <p className="text-xs text-nv-text-muted">A new price here doesn&apos;t change the card charge. Change it under Billing too.</p>}
    </Card>
  );
}

function BillingCard({ c, billing, billingError, busy, onStart, onOp }: { c: Customer; billing: any; billingError: string | null; busy: string | null; onStart: (first: string) => void; onOp: (op: string, extra?: Record<string, unknown>) => void }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [first, setFirst] = useState(c.trial_ends && c.trial_ends > today ? c.trial_ends : today);
  const [date, setDate] = useState(billing?.next_billing_date ?? "");
  const [amount, setAmount] = useState(billing ? String(billing.amount) : "");
  useEffect(() => { setDate(billing?.next_billing_date ?? ""); setAmount(billing ? String(billing.amount) : ""); }, [billing]);
  return (
    <Card title="Billing">
      {billingError && <p className="text-sm text-nv-error">Couldn&apos;t read billing: {billingError}</p>}
      {!billing ? (
        c.monthly_price_cents < 100 ? <p className="text-sm text-nv-text-muted">No charge on this plan. Set a price under Plan to bill them.</p> : (
          <div className="space-y-2">
            <p className="text-sm text-nv-text-muted">Charges {usd(c.monthly_price_cents)} a month to their card, through NexaVision billing. They get an email before each charge.</p>
            <label className={label}>First charge on</label>
            <input className={field} type="date" min={today} value={first} onChange={(e) => setFirst(e.target.value)} />
            <button className={btn} disabled={!!busy} onClick={() => onStart(first)} data-billing-start>{busy === "bstart" && <Loader2 size={14} className="animate-spin" />} Start billing and get their card link</button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat k="Monthly" v={usdD(billing.amount)} />
            <Stat k="Card" v={billing.card_last4 ? `${billing.card_brand || "Card"} ••${billing.card_last4}` : "Not added yet"} warn={!billing.card_last4} />
            <Stat k="Next charge" v={billing.next_billing_date || "No date"} />
            <Stat k="Paid so far" v={usdD(billing.paid_total)} />
            {billing.owed > 0 && <Stat k="Owed" v={usdD(billing.owed)} warn />}
            {billing.failed_attempts > 0 && <Stat k="Failed tries" v={String(billing.failed_attempts)} warn />}
          </div>
          {billing.last_error && <p className="text-xs text-nv-error">{billing.last_error}</p>}
          {!billing.card_last4 && billing.card_url && <div><p className={label}>Their card link</p><CopyLink link={billing.card_url} /></div>}
          {billing.status !== "cancelled" && (
            <div className="grid grid-cols-2 gap-2">
              <div><label className={label}>Next charge date</label><input className={field} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><label className={label}>$ a month</label><input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <button className={btnGhost + " col-span-2"} disabled={!!busy} onClick={() => onOp("update", { next_billing_date: date && date !== billing.next_billing_date ? date : undefined, amount: Number(amount) !== billing.amount ? Number(amount) : undefined })}>Save date and amount</button>
              {billing.status === "paused" ? <button className={btnGhost} disabled={!!busy} onClick={() => onOp("resume")}>Resume billing</button> : <button className={btnGhost} disabled={!!busy} onClick={() => onOp("pause")}>Pause billing</button>}
              <button className={btnGhost} disabled={!!busy} onClick={() => { if (confirm("Stop billing this customer? Their card won't be charged again.")) onOp("cancel"); }}>Stop billing</button>
            </div>
          )}
          {billing.history?.length > 0 && (
            <div className="space-y-1">
              <p className={label}>Charges</p>
              {billing.history.map((h: any, i: number) => (
                <div key={i} className="flex justify-between text-sm"><span className="text-nv-text-secondary">{when(h.at)}</span><span className={h.status === "success" ? "text-nv-teal" : h.status === "failed" ? "text-nv-error" : "text-nv-text-muted"}>{usdD(h.amount)} {h.status === "success" ? "paid" : h.status}</span></div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return <div className="rounded-nv-md border border-white/10 p-2"><p className="text-[11px] uppercase tracking-wide text-nv-text-muted">{k}</p><p className={cn("font-semibold", warn ? "text-amber-300" : "text-nv-text-primary")}>{v}</p></div>;
}

function HouseholdCard({ users, busy, onAdd }: { users: Detail["users"]; busy: boolean; onAdd: (name: string, email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const people = users.filter((u) => u.external_id !== "nexa-support");
  return (
    <Card title="Household">
      <p className="text-sm text-nv-text-muted">Everyone here signs in with their own email and sees the same books.</p>
      {people.map((u) => (
        <div key={u.id} className="flex justify-between gap-3 text-sm border-b border-white/5 pb-2" data-member={u.email ?? ""}>
          <span className="text-nv-text-primary">{u.name || u.email}<span className="text-nv-text-muted"> · {u.email}</span></span>
          <span className="text-xs text-nv-text-muted whitespace-nowrap">{u.last_seen && new Date(u.last_seen).getTime() > Date.now() - 400 * 86400000 ? `Last in ${ago(u.last_seen)}` : "Not signed in yet"}</span>
        </div>
      ))}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input className={field} placeholder="Name (e.g. their spouse)" value={name} onChange={(e) => setName(e.target.value)} data-member-name />
        <input className={field} placeholder="Their email (their login)" value={email} onChange={(e) => setEmail(e.target.value.trim())} data-member-email />
        <button className={btn} disabled={busy || !name || !email} onClick={() => { onAdd(name.trim(), email); setName(""); setEmail(""); }} data-member-add>{busy && <Loader2 size={14} className="animate-spin" />} Add and email them</button>
      </div>
    </Card>
  );
}

function NotesCard({ initial, contact, side, busy, onSave }: { initial: string | null; side: string | null; contact: { email: string | null; phone: string | null; name: string }; busy: boolean; onSave: (f: Record<string, unknown>) => void }) {
  const [notes, setNotes] = useState(initial ?? "");
  const [sideName, setSideName] = useState(side ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [name, setName] = useState(contact.name);
  return (
    <Card title="Contact and notes">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className={label}>Name</label><input className={field} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className={label}>Email</label><input className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className={label}>Phone</label><input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      </div>
      {side !== null && <div><label className={label}>Side business (its sales and costs get this name, e.g. Palm Studio)</label><input className={field} value={sideName} onChange={(e) => setSideName(e.target.value)} data-side-business /></div>}
      <div><label className={label}>Notes (only NexaVision sees these)</label><textarea className={field} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <button className={btnGhost} disabled={busy} onClick={() => onSave({ notes: notes || null, contact_email: email || null, contact_phone: phone || null, name, ...(side !== null && sideName !== side ? { side_business: sideName || null } : {}) })}>Save</button>
    </Card>
  );
}

function CloseCard({ name, busy, onClose }: { name: string; busy: boolean; onClose: (confirm: string) => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  return (
    <section className="rounded-nv-lg border border-nv-error/30 bg-nv-error/5 p-4 space-y-2">
      {!open ? <button className="inline-flex items-center gap-1.5 text-sm text-nv-error" onClick={() => setOpen(true)}><Trash2 size={14} /> Close this account</button> : (
        <>
          <p className="text-sm text-nv-text-secondary">This stops billing, disconnects their bank and deletes everything in their NexaBooks for good. Download anything they need first. Type <b>{name}</b> to confirm.</p>
          <input className={field} value={typed} onChange={(e) => setTyped(e.target.value)} />
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-nv-error text-white text-sm font-semibold disabled:opacity-40" disabled={busy || typed.trim() !== name} onClick={() => onClose(typed.trim())}>Delete for good</button>
            <button className={btnGhost} onClick={() => { setOpen(false); setTyped(""); }}>Cancel</button>
          </div>
        </>
      )}
    </section>
  );
}
