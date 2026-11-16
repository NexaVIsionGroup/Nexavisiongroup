"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/admin/AppShell";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, btnGhost, field, label, post, usd } from "../../ui";

type Item = { id?: string; text: string; done_at?: string | null; done_by_name?: string | null; note?: string | null };
type Step = { id?: string; key: string | null; when_label: string | null; title: string; saves: string | null; body: string | null; say: string | null; calls: { label: string; tel: string }[]; tip: string | null; note?: string | null; items: Item[] };
type Plan = { id?: string; slug: string | null; title: string; intro: string | null; notes?: string | null; food_week_cents: number | null; steps: Step[] };
type Metrics = { foodWeek: number; foodLast4: number; feesMonth: number; borrowedMonth: number; bank: number; owed: number; owedPayments: number; debtsListed: number };
type Debt = { id: string; name: string; balance_cents: number | null; payment_cents: number | null; paid_off_at: string | null };

const KEYS = ["", "trust", "food", "fees", "dates", "debts", "power", "january", "fund", "trim", "enjoy"];
const blankStep = (): Step => ({ key: null, when_label: "", title: "", saves: "", body: "", say: "", calls: [], tip: "", items: [{ text: "" }] });

// Edit a customer's plan. Saving updates their NexaBooks right away; what they ticked and wrote stays with each item.
export default function PlanEditor({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/books?plan=${encodeURIComponent(params.id)}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || `Failed (${r.status})`); return; }
    setPlan(j.plan ?? { slug: null, title: "Money plan", intro: "", food_week_cents: null, steps: [blankStep()] });
    setMetrics(j.metrics); setDebts(j.debts || []); setDirty(false);
  }, [params.id]);
  useEffect(() => { load(); }, [load]);

  const up = (fn: (p: Plan) => Plan) => { setPlan((p) => (p ? fn(structuredClone(p)) : p)); setDirty(true); setMsg(""); };
  const setStep = (i: number, f: Partial<Step>) => up((p) => { p.steps[i] = { ...p.steps[i], ...f }; return p; });
  const move = (i: number, d: number) => up((p) => { const j = i + d; if (j < 0 || j >= p.steps.length) return p; [p.steps[i], p.steps[j]] = [p.steps[j], p.steps[i]]; return p; });

  const save = async () => {
    if (!plan) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      await post({ action: "plan-save", id: params.id, plan: { ...plan, steps: plan.steps.map((s) => ({ ...s, items: s.items.map((i) => ({ id: i.id, text: i.text })) })) } });
      setMsg("Saved. Her plan is updated."); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };

  if (!plan) return <AppShell><div className="p-6 max-w-4xl mx-auto">{err ? <p className="text-sm text-nv-error">{err}</p> : <div className="flex justify-center py-16"><Loader2 className="animate-spin text-nv-teal" /></div>}</div></AppShell>;
  const items = plan.steps.flatMap((s) => s.items);
  const done = items.filter((i) => i.done_at).length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 pb-28" data-plan-editor>
        <Link href={`/admin/books/${params.id}`} className="inline-flex items-center gap-1 text-sm text-nv-text-muted hover:text-nv-teal"><ArrowLeft size={15} /> Back to the customer</Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-display font-semibold text-nv-text-primary">Edit plan</h1>
            <p className="text-sm text-nv-text-muted">{done} of {items.length} items done. Changes show in her NexaBooks as soon as you save.</p>
          </div>
          {plan.slug && <a className={btnGhost} href={`https://books.nexavisiongroup.com/p/${plan.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> books.nexavisiongroup.com/p/{plan.slug}</a>}
        </div>

        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <Stat k="Food this week" v={usd(metrics.foodWeek)} s={`~${usd(metrics.foodLast4)}/wk lately`} />
            <Stat k="Bank fees this month" v={usd(metrics.feesMonth)} warn={metrics.feesMonth > 0} />
            <Stat k="New cash advances" v={usd(metrics.borrowedMonth)} warn={metrics.borrowedMonth > 0} />
            <Stat k="Owed (her list)" v={metrics.debtsListed ? usd(metrics.owed) : "not filled in"} s={`${usd(metrics.owedPayments)}/mo`} />
          </div>
        )}

        <section className="rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2"><label className={label}>Title</label><input className={field} value={plan.title} onChange={(e) => up((p) => ({ ...p, title: e.target.value }))} /></div>
            <div><label className={label}>Short link (books…/p/<b>this</b>)</label><input className={field} value={plan.slug ?? ""} onChange={(e) => up((p) => ({ ...p, slug: e.target.value }))} /></div>
          </div>
          <div><label className={label}>Intro (use **bold**)</label><textarea className={field} rows={3} value={plan.intro ?? ""} onChange={(e) => up((p) => ({ ...p, intro: e.target.value }))} /></div>
          <div className="w-48"><label className={label}>Food goal, $ a week</label><input className={field} inputMode="decimal" value={plan.food_week_cents == null ? "" : plan.food_week_cents / 100} onChange={(e) => up((p) => ({ ...p, food_week_cents: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) || 0 }))} data-food-goal /></div>
          {plan.notes && <div className="rounded-nv-md border border-nv-teal/30 bg-nv-teal/5 p-3 text-sm"><p className={label}>Her notes</p><p className="whitespace-pre-wrap text-nv-text-secondary">{plan.notes}</p></div>}
          {debts.length > 0 && <div className="text-sm"><p className={label}>Her debt list</p>{debts.map((d) => <p key={d.id} className={cn("text-nv-text-secondary", d.paid_off_at && "line-through opacity-60")}>{d.name}: {d.balance_cents == null ? "balance not filled in" : `${usd(d.balance_cents)} owed`}{d.payment_cents != null ? `, ${usd(d.payment_cents)}/mo` : ""}</p>)}</div>}
        </section>

        {plan.steps.map((s, i) => (
          <section key={s.id ?? `new-${i}`} className="rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4 space-y-3" data-edit-step={i + 1}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-semibold text-nv-text-primary">Step {i + 1}</span>
              <div className="flex gap-1">
                <button className={btnGhost + " !px-2"} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={14} /></button>
                <button className={btnGhost + " !px-2"} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={14} /></button>
                <button className={btnGhost + " !px-2"} onClick={() => { if (confirm("Remove this step and its checklist (and her ticks on it)?")) up((p) => { p.steps.splice(i, 1); return p; }); }} aria-label="Remove step"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2"><label className={label}>Title</label><input className={field} value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} data-step-title /></div>
              <div><label className={label}>When</label><input className={field} value={s.when_label ?? ""} onChange={(e) => setStep(i, { when_label: e.target.value })} placeholder="This week" /></div>
              <div className="sm:col-span-2"><label className={label}>Green tag (what it saves)</label><input className={field} value={s.saves ?? ""} onChange={(e) => setStep(i, { saves: e.target.value })} /></div>
              <div><label className={label}>Live numbers</label>
                <select className={field} value={s.key ?? ""} onChange={(e) => setStep(i, { key: e.target.value || null })}>
                  {KEYS.map((k) => <option key={k} value={k}>{k ? { trust: "none (who to listen to)", food: "food this week", fees: "bank fees", dates: "none (payment dates)", debts: "debts + her list", power: "none (electric)", january: "none (January)", fund: "repairs fund", trim: "none (trim)", enjoy: "none (enjoy)" }[k] : "none"}</option>)}
                </select></div>
            </div>
            <div><label className={label}>What to know (blank line = new paragraph, **bold**)</label><textarea className={field} rows={4} value={s.body ?? ""} onChange={(e) => setStep(i, { body: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={label}>What to say on the phone</label><textarea className={field} rows={2} value={s.say ?? ""} onChange={(e) => setStep(i, { say: e.target.value })} /></div>
              <div><label className={label}>Highlighted tip</label><textarea className={field} rows={2} value={s.tip ?? ""} onChange={(e) => setStep(i, { tip: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <p className={label}>Call buttons</p>
              {s.calls.map((c, ci) => (
                <div key={ci} className="flex gap-2">
                  <input className={field} value={c.label} placeholder="Button text" onChange={(e) => up((p) => { p.steps[i].calls[ci].label = e.target.value; return p; })} />
                  <input className={field + " !w-44"} value={c.tel} placeholder="+14072775045" onChange={(e) => up((p) => { p.steps[i].calls[ci].tel = e.target.value; return p; })} />
                  <button className={btnGhost + " !px-2"} onClick={() => up((p) => { p.steps[i].calls.splice(ci, 1); return p; })} aria-label="Remove call"><Trash2 size={14} /></button>
                </div>
              ))}
              <button className="text-xs text-nv-teal" onClick={() => up((p) => { p.steps[i].calls.push({ label: "", tel: "" }); return p; })}>+ Call button</button>
            </div>
            <div className="space-y-2">
              <p className={label}>Checklist</p>
              {s.items.map((it, ii) => (
                <div key={it.id ?? `n${ii}`} className="flex items-start gap-2">
                  <span className={cn("mt-2.5 shrink-0 w-5 h-5 rounded border grid place-items-center", it.done_at ? "bg-nv-teal/20 border-nv-teal text-nv-teal" : "border-white/20")}>{it.done_at && <Check size={12} />}</span>
                  <div className="flex-1 space-y-1">
                    <input className={field} value={it.text} onChange={(e) => up((p) => { p.steps[i].items[ii].text = e.target.value; return p; })} data-item-text />
                    {(it.done_at || it.note) && <p className="text-xs text-nv-text-muted">{it.done_at ? `Done ${new Date(it.done_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${it.done_by_name ? ` by ${it.done_by_name}` : ""}` : ""}{it.note ? ` · note: ${it.note}` : ""}</p>}
                  </div>
                  <button className={btnGhost + " !px-2 mt-0.5"} onClick={() => up((p) => { p.steps[i].items.splice(ii, 1); return p; })} aria-label="Remove item"><Trash2 size={14} /></button>
                </div>
              ))}
              <button className="text-xs text-nv-teal" onClick={() => up((p) => { p.steps[i].items.push({ text: "" }); return p; })} data-add-item>+ Checklist item</button>
            </div>
            {s.note && <div className="rounded-nv-md border border-nv-teal/30 bg-nv-teal/5 p-3 text-sm"><p className={label}>Her note on this step</p><p className="whitespace-pre-wrap text-nv-text-secondary">{s.note}</p></div>}
          </section>
        ))}
        <button className={btnGhost} onClick={() => up((p) => { p.steps.push(blankStep()); return p; })} data-add-step><Plus size={14} /> Add a step</button>

        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-nv-void/95 backdrop-blur p-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <span className={cn("text-sm", err ? "text-nv-error" : msg ? "text-nv-teal" : "text-nv-text-muted")}>{err || msg || (dirty ? "Unsaved changes" : "No changes")}</span>
            <button className={btn} disabled={busy || !dirty} onClick={save} data-plan-save>{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save plan</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ k, v, s, warn }: { k: string; v: string; s?: string; warn?: boolean }) {
  return <div className="rounded-nv-md border border-white/10 p-2"><p className="text-[11px] uppercase tracking-wide text-nv-text-muted">{k}</p><p className={cn("font-semibold", warn ? "text-amber-300" : "text-nv-text-primary")}>{v}</p>{s && <p className="text-[11px] text-nv-text-muted">{s}</p>}</div>;
}
