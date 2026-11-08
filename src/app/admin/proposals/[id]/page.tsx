"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, ExternalLink, Eye, Loader2, Lock, Mail, Pause, Play, Plus, Trash2, X } from "lucide-react";
import AppShell from "@/components/admin/AppShell";
import { DIVISIONS, WORK_CATALOG, dueAtSigning, defaultPackage, money, surchargeOn, type ProposalContent } from "@/lib/proposals/types";
import { field, label, StatusChip, statusOf, when } from "../shared";
import BillingPanel from "./BillingPanel";

const lines = (s: string) => s.split("\n");
const clean = (a: string[]) => a.map((x) => x.trim()).filter(Boolean);
const uid = () => Math.random().toString(36).slice(2, 10);
const EVENT: Record<string, string> = {
  emailed: "Emailed to the customer", link_published: "Link turned on", opened: "Customer opened it", signed: "Signed",
  signed_copy_emailed: "Signed copy emailed", signed_copy_failed: "Signed copy email failed", invoice_created: "Invoice created",
  pay_clicked: "Customer went to payment", pay_failed: "Payment page failed to open", paid: "Paid",
  card_link_opened: "Customer opened the card page", card_link_failed: "Card page failed to open", billing_update: "Billing changed", billing_approve: "Charge over the limit approved",
  billing_pause: "Billing paused", billing_resume: "Billing turned back on", billing_cancel: "Billing cancelled", billing_resolve: "Held charge resolved", billing_usage_reported: "Usage amount reported",
};

function Section({ title, children, note }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="nv-glass rounded-nv-lg p-4 sm:p-5 grid gap-4">
      <div><h2 className="font-display font-bold text-lg text-nv-text-primary">{title}</h2>{note && <p className="text-sm text-nv-text-muted mt-1">{note}</p>}</div>
      {children}
    </section>
  );
}
const AddBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-2 min-h-[44px] px-3 justify-self-start rounded-nv-md border border-white/15 text-nv-text-primary"><Plus size={16} aria-hidden />{children}</button>
);
const Remove = ({ onClick, what }: { onClick: () => void; what: string }) => (
  <button type="button" aria-label={`Remove ${what}`} onClick={onClick} className="p-2.5 text-nv-text-muted hover:text-red-400 flex-none"><Trash2 size={18} /></button>
);

export default function ProposalEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [p, setP] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [c, setC] = useState<ProposalContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/proposals/${params.id}`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) { setMsg({ ok: false, text: j.error || "Could not load this proposal." }); return; }
    setP(j.proposal); setC(j.proposal.content); setEvents(j.events); setDirty(false);
  }, [params.id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const locked = !!p?.signed_at;
  const patchP = (k: string, v: unknown) => { setP((x: any) => ({ ...x, [k]: v })); setDirty(true); };
  const patchC = (f: (x: ProposalContent) => ProposalContent) => { setC((x) => (x ? f(x) : x)); setDirty(true); };

  async function save(): Promise<boolean> {
    if (!c) return false;
    setBusy("save"); setMsg(null);
    const content: ProposalContent = {
      ...c,
      goals: clean(c.goals),
      work: c.work.map((w) => ({ ...w, items: clean(w.items) })),
      packages: c.packages.map((x) => ({ ...x, price: Number(x.price) || 0, monthly: Number(x.monthly) || 0, includes: clean(x.includes) })),
      payment: { ...c.payment, value: Number(c.payment.value) || 0 },
    };
    const r = await fetch(`/api/admin/proposals/${params.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: p.title, division: p.division, client_name: p.client_name, client_company: p.client_company, client_email: p.client_email, client_phone: p.client_phone, expires_at: p.expires_at, content }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) { setMsg({ ok: false, text: j.error || "Could not save." }); return false; }
    setMsg({ ok: true, text: "Saved." });
    await load();
    return true;
  }

  async function send(email: boolean) {
    if (dirty && !(await save())) return;
    setBusy(email ? "email" : "copy"); setMsg(null);
    const r = await fetch(`/api/admin/proposals/${params.id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setMsg({ ok: false, text: j.error || "Could not send." });
    if (email) setMsg({ ok: true, text: `Sent to ${p.client_email}.` });
    else {
      try { await navigator.clipboard.writeText(j.url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
      catch { setMsg({ ok: true, text: `Link is on: ${j.url}` }); }
    }
    await load();
  }

  async function toggleLink() {
    setBusy("link");
    await fetch(`/api/admin/proposals/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link_enabled: !p.link_enabled }) });
    setBusy("");
    await load();
  }

  async function del() {
    const r = await fetch(`/api/admin/proposals/${params.id}`, { method: "DELETE" });
    if (r.ok) router.push("/admin/proposals");
    else setMsg({ ok: false, text: (await r.json().catch(() => ({}))).error || "Could not delete." });
  }

  if (!p || !c) return <AppShell title="Proposal" showBack><div className="max-w-3xl mx-auto text-nv-text-muted">{msg?.text || "Loading"}</div></AppShell>;

  const previewPkg = defaultPackage(c);
  const due = dueAtSigning(c, previewPkg);
  const catalog = WORK_CATALOG[p.division as string] || WORK_CATALOG.Other;
  const hasArea = (a: string) => c.work.some((w) => w.area === a);

  return (
    <AppShell title={p.client_company || p.title} showBack>
      <div className="max-w-3xl mx-auto grid gap-4 pb-24">
        <section className="nv-glass rounded-nv-lg p-4 sm:p-5 grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={statusOf(p)} />
            <span className="text-sm text-nv-text-muted">{p.number}</span>
            {p.view_count > 0 && <span className="text-sm text-nv-text-muted">Opened {p.view_count} {p.view_count === 1 ? "time" : "times"}, {Math.round((p.seconds_viewed || 0) / 60)} min total</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {!locked && <button onClick={() => send(true)} disabled={!!busy || !p.client_email} className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md bg-nv-teal text-nv-deep font-semibold disabled:opacity-50">{busy === "email" ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} aria-hidden />}{p.sent_at ? "Email again" : "Email to customer"}</button>}
            <button onClick={() => send(false)} disabled={!!busy} className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md border border-white/15 text-nv-text-primary">{copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}{copied ? "Copied" : "Copy link"}</button>
            <a href={`/admin/proposals/${p.id}/preview`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md border border-white/15 text-nv-text-primary"><Eye size={18} aria-hidden />Preview</a>
            {p.preview_url && (
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(p.preview_url); setSharedCopied(true); setTimeout(() => setSharedCopied(false), 2000); } catch { setMsg({ ok: true, text: `Share preview: ${p.preview_url}` }); } }} className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md border border-white/15 text-nv-text-primary" title="A read-only preview anyone can open without logging in. Signing is off and views aren't counted.">
                {sharedCopied ? <Check size={18} aria-hidden /> : <ExternalLink size={18} aria-hidden />}{sharedCopied ? "Copied" : "Share preview"}
              </button>
            )}
            {p.sent_at && <button onClick={toggleLink} disabled={!!busy} className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md border border-white/15 text-nv-text-primary">{p.link_enabled ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}{p.link_enabled ? "Pause link" : "Turn link on"}</button>}
          </div>
          {!p.client_email && !locked && <p className="text-sm text-amber-300">Add the customer&apos;s email below to send it by email, or use Copy link and text it.</p>}
          {msg && <p role="status" className={msg.ok ? "text-nv-teal" : "text-red-400"}>{msg.text}</p>}
        </section>

        {locked && (
          <Section title="Signed">
            <div className="grid gap-2 text-nv-text-secondary">
              <p className="flex items-center gap-2 text-nv-text-primary"><Lock size={16} aria-hidden /><b>{p.signed_name}{p.signed_title ? `, ${p.signed_title}` : ""}</b>, {when(p.signed_at)}</p>
              <p className="text-sm break-all">IP {p.signer_ip}. Fingerprint {p.signed_hash}</p>
              {Number(p.due_amount) > 0 && <p>{money(Number(p.due_amount))} due at signing. {p.paid_at ? `Paid ${when(p.paid_at)}.` : "Not paid yet."}{p.invoice_number ? ` Invoice ${p.invoice_number}.` : ""}</p>}
              <div className="flex flex-wrap gap-2 mt-1">
                <a href={`/api/project/${p.token}/pdf`} className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md border border-white/15 text-nv-text-primary"><Download size={18} aria-hidden />Signed PDF</a>
                <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md border border-white/15 text-nv-text-primary"><ExternalLink size={18} aria-hidden />Customer page</a>
              </div>
            </div>
          </Section>
        )}

        {locked && <BillingPanel id={p.id} />}

        <fieldset disabled={locked} className="grid gap-4 disabled:opacity-70">
          <Section title="Customer">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className={label}>Proposal title</span><input className={field} value={p.title || ""} onChange={(e) => patchP("title", e.target.value)} /></label>
              <label><span className={label}>Contact name</span><input className={field} value={p.client_name || ""} onChange={(e) => patchP("client_name", e.target.value)} /></label>
              <label><span className={label}>Business</span><input className={field} value={p.client_company || ""} onChange={(e) => patchP("client_company", e.target.value)} /></label>
              <label><span className={label}>Email</span><input type="email" className={field} value={p.client_email || ""} onChange={(e) => patchP("client_email", e.target.value)} /></label>
              <label><span className={label}>Phone</span><input type="tel" className={field} value={p.client_phone || ""} onChange={(e) => patchP("client_phone", e.target.value)} /></label>
              <label><span className={label}>Division</span><select className={field} value={p.division || "Other"} onChange={(e) => patchP("division", e.target.value)}>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select></label>
              <label><span className={label}>Good through (optional)</span><input type="date" className={field} value={p.expires_at ? p.expires_at.slice(0, 10) : ""} onChange={(e) => patchP("expires_at", e.target.value ? `${e.target.value}T23:59:59` : null)} /></label>
            </div>
          </Section>

          <Section title="Opening message">
            <textarea rows={3} aria-label="Opening message" className={field} value={c.intro} onChange={(e) => patchC((x) => ({ ...x, intro: e.target.value }))} placeholder="A short, personal note to the owner." />
          </Section>

          <Section title="What we found" note="Images can be a full web address or a path like /p/client/shot.jpg.">
            {c.findings.map((f, i) => (
              <div key={i} className="grid gap-2 border-t border-white/10 pt-3 first:border-0 first:pt-0">
                <div className="flex gap-1"><input aria-label="Finding title" className={field} placeholder="Google hours are wrong" value={f.title} onChange={(e) => patchC((x) => ({ ...x, findings: x.findings.map((v, n) => (n === i ? { ...v, title: e.target.value } : v)) }))} /><Remove what="finding" onClick={() => patchC((x) => ({ ...x, findings: x.findings.filter((_, n) => n !== i) }))} /></div>
                <textarea aria-label="Finding detail" rows={2} className={field} placeholder="What it means and what it costs them" value={f.detail} onChange={(e) => patchC((x) => ({ ...x, findings: x.findings.map((v, n) => (n === i ? { ...v, detail: e.target.value } : v)) }))} />
                <input aria-label="Finding image" className={field} placeholder="Screenshot address (optional)" value={f.image || ""} onChange={(e) => patchC((x) => ({ ...x, findings: x.findings.map((v, n) => (n === i ? { ...v, image: e.target.value } : v)) }))} />
              </div>
            ))}
            <AddBtn onClick={() => patchC((x) => ({ ...x, findings: [...x.findings, { title: "", detail: "" }] }))}>Add a finding</AddBtn>
          </Section>

          <Section title="Their goals" note="One per line.">
            <textarea rows={4} aria-label="Goals" className={field} value={c.goals.join("\n")} onChange={(e) => patchC((x) => ({ ...x, goals: lines(e.target.value) }))} />
          </Section>

          <Section title="What we'll do" note={`Tap a service to add it. These are the usual ones for ${p.division || "this division"}.`}>
            <div className="flex flex-wrap gap-2">
              {catalog.map((a) => (
                <button key={a} type="button" disabled={hasArea(a)} onClick={() => patchC((x) => ({ ...x, work: [...x.work, { area: a, items: [] }] }))} className="min-h-[40px] px-3 rounded-full border border-white/15 text-sm text-nv-text-primary disabled:opacity-40">{hasArea(a) ? "✓ " : "+ "}{a}</button>
              ))}
            </div>
            {c.work.map((w, i) => (
              <div key={i} className="grid gap-2 border-t border-white/10 pt-3">
                <div className="flex gap-1"><input aria-label="Service name" className={field} value={w.area} onChange={(e) => patchC((x) => ({ ...x, work: x.work.map((v, n) => (n === i ? { ...v, area: e.target.value } : v)) }))} /><Remove what="service" onClick={() => patchC((x) => ({ ...x, work: x.work.filter((_, n) => n !== i) }))} /></div>
                <textarea aria-label="Service items" rows={3} className={field} placeholder="What's included, one per line" value={w.items.join("\n")} onChange={(e) => patchC((x) => ({ ...x, work: x.work.map((v, n) => (n === i ? { ...v, items: lines(e.target.value) } : v)) }))} />
              </div>
            ))}
            <AddBtn onClick={() => patchC((x) => ({ ...x, work: [...x.work, { area: "", items: [] }] }))}>Add another service</AddBtn>
          </Section>

          <Section title="Timeline">
            {c.timeline.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label="Step" className={field} placeholder="Website preview" value={t.label} onChange={(e) => patchC((x) => ({ ...x, timeline: x.timeline.map((v, n) => (n === i ? { ...v, label: e.target.value } : v)) }))} />
                <input aria-label="When" className={field} placeholder="Week 2" value={t.when} onChange={(e) => patchC((x) => ({ ...x, timeline: x.timeline.map((v, n) => (n === i ? { ...v, when: e.target.value } : v)) }))} />
                <Remove what="step" onClick={() => patchC((x) => ({ ...x, timeline: x.timeline.filter((_, n) => n !== i) }))} />
              </div>
            ))}
            <AddBtn onClick={() => patchC((x) => ({ ...x, timeline: [...x.timeline, { label: "", when: "" }] }))}>Add a step</AddBtn>
          </Section>

          <Section title="Pricing" note="One package shows as the price. Two or more let the customer choose. Mark one as your recommendation.">
            {c.packages.map((x0, i) => {
              const up = (patch: Partial<typeof x0>) => patchC((x) => ({ ...x, packages: x.packages.map((v, n) => (n === i ? { ...v, ...patch } : v)) }));
              return (
                <div key={x0.id} className="grid gap-2 border-t border-white/10 pt-3 first:border-0 first:pt-0">
                  <div className="flex gap-1"><input aria-label="Package name" className={field} placeholder="Website + monthly management" value={x0.name} onChange={(e) => up({ name: e.target.value })} /><Remove what="package" onClick={() => patchC((x) => ({ ...x, packages: x.packages.filter((_, n) => n !== i) }))} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <label><span className={label}>One-time $</span><input inputMode="decimal" className={field} value={x0.price || ""} onChange={(e) => up({ price: e.target.value as unknown as number })} /></label>
                    <label><span className={label}>Monthly $</span><input inputMode="decimal" className={field} value={x0.monthly || ""} onChange={(e) => up({ monthly: e.target.value as unknown as number })} /></label>
                  </div>
                  <input aria-label="Package description" className={field} placeholder="Short description (optional)" value={x0.description || ""} onChange={(e) => up({ description: e.target.value })} />
                  <textarea aria-label="Package includes" rows={3} className={field} placeholder="What's included, one per line" value={x0.includes.join("\n")} onChange={(e) => up({ includes: lines(e.target.value) })} />
                  <label className="flex items-center gap-2 min-h-[44px] text-nv-text-primary"><input type="checkbox" className="w-5 h-5" checked={!!x0.recommended} onChange={(e) => patchC((x) => ({ ...x, packages: x.packages.map((v, n) => ({ ...v, recommended: n === i ? e.target.checked : false })) }))} />Our recommendation</label>
                </div>
              );
            })}
            <AddBtn onClick={() => patchC((x) => ({ ...x, packages: [...x.packages, { id: uid(), name: "", price: 0, monthly: 0, includes: [] }] }))}>Add a package</AddBtn>
          </Section>

          <Section title="Payment at signing" note="Optional. Leave it off and the customer just signs.">
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className={label}>Ask for money at signing?</span>
                <select className={field} value={c.payment.mode} onChange={(e) => patchC((x) => ({ ...x, payment: { ...x.payment, mode: e.target.value as ProposalContent["payment"]["mode"] } }))}>
                  <option value="none">No payment step</option><option value="percent">Percent of the package</option><option value="fixed">Fixed amount</option>
                </select>
              </label>
              {c.payment.mode !== "none" && <label><span className={label}>{c.payment.mode === "percent" ? "Percent" : "Amount $"}</span><input inputMode="decimal" className={field} value={c.payment.value || ""} onChange={(e) => patchC((x) => ({ ...x, payment: { ...x.payment, value: e.target.value as unknown as number } }))} /></label>}
            </div>
            {c.payment.mode !== "none" && (
              <>
                <label className="flex items-center gap-2 min-h-[44px] text-nv-text-primary"><input type="checkbox" className="w-5 h-5" checked={c.payment.surcharge} onChange={(e) => patchC((x) => ({ ...x, payment: { ...x.payment, surcharge: e.target.checked } }))} />Add the 4% card fee</label>
                <p className="text-nv-text-secondary">{previewPkg || c.payment.mode === "fixed" ? `${previewPkg ? `With ${previewPkg.name || "this package"}, the` : "The"} customer pays ${money(due + surchargeOn(c, due))} at signing.` : "Add a package to see the amount."}</p>
              </>
            )}
            <label><span className={label}>Note about later payments (optional)</span><textarea rows={2} className={field} value={c.payment.notes || ""} onChange={(e) => patchC((x) => ({ ...x, payment: { ...x.payment, notes: e.target.value } }))} placeholder="The rest is due at launch. Monthly services start the month after launch." /></label>
          </Section>

          <Section title="Terms" note="Standard terms are filled in. Change them for this customer if you need to.">
            {c.terms.map((t, i) => (
              <div key={i} className="grid gap-2 border-t border-white/10 pt-3 first:border-0 first:pt-0">
                <div className="flex gap-1"><input aria-label="Term title" className={field} value={t.title} onChange={(e) => patchC((x) => ({ ...x, terms: x.terms.map((v, n) => (n === i ? { ...v, title: e.target.value } : v)) }))} /><Remove what="term" onClick={() => patchC((x) => ({ ...x, terms: x.terms.filter((_, n) => n !== i) }))} /></div>
                <textarea aria-label="Term text" rows={4} className={field} value={t.text} onChange={(e) => patchC((x) => ({ ...x, terms: x.terms.map((v, n) => (n === i ? { ...v, text: e.target.value } : v)) }))} />
              </div>
            ))}
            <AddBtn onClick={() => patchC((x) => ({ ...x, terms: [...x.terms, { title: "", text: "" }] }))}>Add a term</AddBtn>
          </Section>
        </fieldset>

        <Section title="Activity">
          {events.length === 0 ? <p className="text-nv-text-muted">Nothing yet. Opens, signing and payment show up here.</p> : (
            <ul className="grid gap-2">{events.map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-x-4 text-nv-text-secondary"><span>{EVENT[e.event] || e.event}</span><span className="text-sm text-nv-text-muted">{when(e.created_at)}</span></li>
            ))}</ul>
          )}
        </Section>

        {!locked && (
          confirmDel ? (
            <div className="flex flex-wrap items-center gap-2"><span className="text-nv-text-primary">Delete this proposal? Its link stops working.</span>
              <button onClick={del} className="min-h-[44px] px-4 rounded-nv-md bg-red-500 text-white font-semibold">Delete</button>
              <button onClick={() => setConfirmDel(false)} className="inline-flex items-center gap-1 min-h-[44px] px-3 text-nv-text-secondary"><X size={16} aria-hidden />Keep it</button></div>
          ) : <button onClick={() => setConfirmDel(true)} className="justify-self-start inline-flex items-center gap-2 min-h-[44px] text-nv-text-muted hover:text-red-400"><Trash2 size={16} aria-hidden />Delete proposal</button>
        )}
      </div>

      {!locked && dirty && (
        <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
          <button onClick={save} disabled={busy === "save"} className="pointer-events-auto inline-flex items-center gap-2 min-h-[50px] px-6 rounded-full bg-nv-teal text-nv-deep font-semibold shadow-lg">{busy === "save" && <Loader2 size={18} className="animate-spin" aria-hidden />}Save changes</button>
        </div>
      )}
    </AppShell>
  );
}
