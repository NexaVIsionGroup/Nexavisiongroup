"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/admin/AppShell";
import {
  Loader2, Copy, Check, ExternalLink, AlertTriangle, Sparkles, Eye, Info, Plus, Trash2, ChevronLeft, Save,
  ChevronDown, ChevronRight, Lock, KeyRound,
} from "lucide-react";
import type { AccessField, AccessValue, Answers, ExtraQuestion, Field, MoneyValue, Section } from "@/lib/questionnaires";
import { FREQ_LABEL, fmtMoney, getTemplate, isVisible, personalize, sectionProgress, visibleSections } from "@/lib/questionnaires";
import type { Flag } from "@/lib/questionnaires/analyze";
import { STATUS, ago } from "../shared";

interface Q {
  id: string;
  token: string;
  template: string;
  title: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  status: string;
  answers: Answers;
  extra_questions: ExtraQuestion[];
  admin_notes: string | null;
  open_count: number;
  last_opened_at: string | null;
  last_saved_at: string | null;
  submitted_at: string | null;
  created_at: string;
  url: string;
}
interface Totals {
  income: number;
  expenses: number;
  gap: number;
  debt: number;
  assets: number;
  byCategory: { role: string; category: string; amount: number }[];
}

const FLAG_STYLE: Record<Flag["level"], { icon: React.ElementType; cls: string; label: string }> = {
  urgent: { icon: AlertTriangle, cls: "border-nv-error/30 bg-nv-error/5 text-nv-error", label: "Urgent" },
  opportunity: { icon: Sparkles, cls: "border-nv-teal/30 bg-nv-teal/5 text-nv-teal", label: "Opportunity" },
  review: { icon: Eye, cls: "border-nv-ember/30 bg-nv-ember/5 text-nv-ember", label: "Review" },
  info: { icon: Info, cls: "border-white/10 bg-white/[0.03] text-nv-text-secondary", label: "Info" },
};

export default function QuestionnaireDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [q, setQ] = useState<Q | null>(null);
  const [tot, setTot] = useState<Totals | null>(null);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [kind, setKind] = useState<"household" | "prospect">("household");
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [extra, setExtra] = useState<ExtraQuestion[]>([]);
  const [extraDirty, setExtraDirty] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showEmpty, setShowEmpty] = useState(false);

  const load = useCallback(() =>
    fetch(`/api/admin/questionnaires/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.questionnaire) return;
        setQ(d.questionnaire);
        setTot(d.totals);
        setFlags(d.flags || []);
        setKind(d.kind || "household");
        setNotes(d.questionnaire.admin_notes || "");
        setExtra(d.questionnaire.extra_questions || []);
        setExtraDirty(false);
      }), [id]);

  useEffect(() => { load(); }, [load]);
  // live-ish: refresh every 30s while the client may be typing
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible" && notesSaved && !extraDirty) load(); }, 30000);
    return () => clearInterval(t);
  }, [load, notesSaved, extraDirty]);

  const patch = (body: any) =>
    fetch(`/api/admin/questionnaires/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const template = useMemo(() => getTemplate(q?.template), [q?.template]);
  const sections = useMemo(() => (q ? visibleSections(template, q.answers || {}, q.extra_questions) : []), [q, template]);

  if (!q || !tot) {
    return (
      <AppShell title="Questionnaire">
        <div className="flex justify-center py-16"><Loader2 className="text-nv-teal animate-spin" /></div>
      </AppShell>
    );
  }

  const a = q.answers || {};
  const s = STATUS[q.status] || STATUS.pending;
  const expenseCats = tot.byCategory.filter((c) => c.role === "expense");
  const incomeCats = tot.byCategory.filter((c) => c.role === "income");
  const maxExp = Math.max(1, ...expenseCats.map((c) => c.amount));

  return (
    <AppShell title={q.client_name || "Questionnaire"}>
      <div className="max-w-6xl mx-auto space-y-4 pb-16">
        <button onClick={() => router.push("/admin/questionnaires")} className="text-xs text-nv-text-muted hover:text-nv-teal flex items-center gap-1">
          <ChevronLeft size={14} /> All questionnaires
        </button>

        {/* header */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-lg text-nv-text-primary">{q.client_name || personalize(q.title, a)}</h1>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
              </div>
              <p className="text-xs text-nv-text-muted mt-1">
                {q.title} · opened {q.open_count}× (last {ago(q.last_opened_at)}) · saved {ago(q.last_saved_at)}
                {q.submitted_at ? ` · submitted ${ago(q.submitted_at)}` : ""}
              </p>
              <div className="mt-3 flex items-center gap-2 min-w-0">
                <code className="text-[11px] font-mono text-nv-teal bg-nv-deep border border-white/10 rounded-md px-2 py-1 truncate">{q.url}</code>
                <button onClick={async () => { try { await navigator.clipboard.writeText(q.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }} className="p-1.5 rounded-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5" title="Copy link">
                  {copied ? <Check size={15} className="text-nv-success" /> : <Copy size={15} />}
                </button>
                <a href={q.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5" title="Open as client"><ExternalLink size={15} /></a>
              </div>
            </div>
            <select
              value={q.status}
              onChange={async (e) => { await patch({ status: e.target.value }); load(); }}
              className="nv-input !w-auto text-xs"
            >
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* stats */}
        {kind !== "prospect" && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Income / mo" value={fmtMoney(tot.income)} cls="text-nv-teal" />
          <Stat label="Spending / mo" value={fmtMoney(tot.expenses)} cls="text-nv-ember" />
          <Stat label={tot.gap < 0 ? "Shortfall / mo" : "Left over / mo"} value={fmtMoney(Math.abs(tot.gap))} cls={tot.gap < 0 ? "text-nv-error" : "text-nv-success"} />
          <Stat label="Total debt" value={fmtMoney(tot.debt)} cls="text-nv-violet-300" />
        </div>}

        <div className={kind === "prospect" ? "grid gap-4" : "grid lg:grid-cols-[1.3fr_1fr] gap-4"}>
          {/* flags */}
          <div className="nv-glass rounded-nv-lg p-5">
            <p className="nv-section-label mb-3">Opportunities &amp; flags ({flags.length})</p>
            {flags.length === 0 ? (
              <p className="text-sm text-nv-text-muted">Nothing flagged yet. These appear as answers come in.</p>
            ) : (
              <ul className="space-y-2">
                {flags.map((f, i) => {
                  const st = FLAG_STYLE[f.level];
                  return (
                    <li key={i} className={`rounded-nv-md border p-3 ${st.cls}`}>
                      <div className="flex items-center gap-2">
                        <st.icon size={14} className="shrink-0" />
                        <span className="text-[10px] uppercase tracking-wider opacity-80">{st.label} · {f.area}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-nv-text-primary">{f.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-nv-text-secondary">{f.detail}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-nv-text-muted">{kind === "prospect" ? "Where each account stands. Everything is read-only until a proposal is approved." : "Leads to verify, not eligibility decisions."}</p>
          </div>

          {/* breakdown */}
          {kind !== "prospect" && <div className="space-y-4">
            <div className="nv-glass rounded-nv-lg p-5">
              <p className="nv-section-label mb-3">Spending by category</p>
              {expenseCats.length === 0 ? <p className="text-sm text-nv-text-muted">No spending entered yet.</p> : (
                <ul className="space-y-2">
                  {expenseCats.map((c) => (
                    <li key={c.category}>
                      <div className="flex justify-between text-xs"><span className="text-nv-text-secondary">{c.category}</span><span className="font-mono text-nv-text-primary">{fmtMoney(c.amount)}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-nv-ember/70" style={{ width: `${(c.amount / maxExp) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="nv-glass rounded-nv-lg p-5">
              <p className="nv-section-label mb-3">Income sources</p>
              {incomeCats.length === 0 ? <p className="text-sm text-nv-text-muted">No income entered yet.</p> : (
                <ul className="space-y-1.5">
                  {incomeCats.map((c) => (
                    <li key={c.category} className="flex justify-between text-xs"><span className="text-nv-text-secondary">{c.category}</span><span className="font-mono text-nv-teal">{fmtMoney(c.amount)}</span></li>
                  ))}
                </ul>
              )}
              {tot.assets > 0 && <p className="mt-3 text-xs text-nv-text-muted">Assets entered: {fmtMoney(tot.assets)}</p>}
            </div>
          </div>}
        </div>

        {/* follow-up questions */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <p className="nv-section-label">Follow-up questions for this client</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setExtra([...extra, { id: Math.random().toString(36).slice(2, 9), label: "", type: "textarea", created_at: new Date().toISOString() }]); setExtraDirty(true); }}
                className="nv-btn-ghost py-2 px-3 text-xs flex items-center gap-1"
              ><Plus size={13} /> Add question</button>
              {extraDirty && (
                <button onClick={async () => { await patch({ extra_questions: extra }); load(); }} className="nv-btn-primary py-2 px-3 text-xs flex items-center gap-1"><Save size={13} /> Save &amp; publish</button>
              )}
            </div>
          </div>
          <p className="text-xs text-nv-text-muted mb-3">These show at the top of their link under &ldquo;A few more questions&rdquo;. Answers appear in the section list below.</p>
          {extra.length === 0 ? <p className="text-sm text-nv-text-muted">None yet.</p> : (
            <ul className="space-y-2">
              {extra.map((x, i) => (
                <li key={x.id} className="flex flex-wrap gap-2 items-start">
                  <input className="nv-input flex-1 min-w-[220px]" placeholder="Question" value={x.label} onChange={(e) => { const n = [...extra]; n[i] = { ...x, label: e.target.value }; setExtra(n); setExtraDirty(true); }} />
                  <select className="nv-input !w-auto" value={x.type} onChange={(e) => { const n = [...extra]; n[i] = { ...x, type: e.target.value as ExtraQuestion["type"] }; setExtra(n); setExtraDirty(true); }}>
                    <option value="textarea">Long answer</option>
                    <option value="text">Short answer</option>
                    <option value="money">Dollar amount</option>
                    <option value="yesno">Yes / No</option>
                  </select>
                  <button onClick={() => { setExtra(extra.filter((_, j) => j !== i)); setExtraDirty(true); }} className="p-2.5 rounded-md text-nv-text-muted hover:text-nv-error hover:bg-white/5"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* notes */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="nv-section-label">Private notes</p>
            <span className="text-[11px] text-nv-text-muted">{notesSaved ? "Saved" : "Unsaved"}</span>
          </div>
          <textarea
            className="nv-input min-h-[110px]"
            value={notes}
            placeholder="Calls, findings, next steps… (never shown to the client)"
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
            onBlur={async () => { if (!notesSaved) { await patch({ admin_notes: notes }); setNotesSaved(true); } }}
          />
        </div>

        {/* answers */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <p className="nv-section-label">Answers</p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-nv-text-muted flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} /> Show unanswered
              </label>
              <button onClick={() => { const all: Record<string, boolean> = {}; sections.forEach((s) => (all[s.id] = true)); setOpen(all); }} className="text-xs text-nv-text-muted hover:text-nv-teal">Expand all</button>
            </div>
          </div>
          <div className="space-y-2">
            {sections.map((sec) => (
              <SectionAnswers key={sec.id} qid={q.id} section={sec} answers={a} open={!!open[sec.id]} toggle={() => setOpen({ ...open, [sec.id]: !open[sec.id] })} showEmpty={showEmpty} />
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .nv-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 9px 12px; font-size: 14px; color: #E8EDF5; outline: none; }
        .nv-input:focus { border-color: rgba(0,229,204,0.5); }
        .nv-input option { background: #0F1D32; }
      `}</style>
    </AppShell>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="nv-glass rounded-nv-lg p-4">
      <p className="text-[11px] uppercase tracking-wider text-nv-text-muted">{label}</p>
      <p className={`mt-1 font-display font-bold text-2xl tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}

function fmtValue(f: Field, v: any, answers: Answers): string | null {
  if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return null;
  switch (f.type) {
    case "money": {
      const m = v as MoneyValue;
      if (m.a == null) return null;
      return f.recurring === false ? fmtMoney(Number(m.a), true) : `${fmtMoney(Number(m.a), true)} ${FREQ_LABEL[m.f || f.freq || "monthly"]}`;
    }
    case "choice": {
      const o = f.options.find((x) => x.value === v);
      return o ? personalize(o.label, answers) : String(v);
    }
    case "multi":
      return (v as string[]).map((x) => personalize(f.options.find((o) => o.value === x)?.label || x, answers)).join(", ");
    case "yesno":
      return v === "yes" ? "Yes" : v === "no" ? "No" : "Not sure";
    case "list":
      return `${(v as any[]).length} item${(v as any[]).length === 1 ? "" : "s"}`;
    case "access": {
      const x = v as AccessValue;
      if (!x.via) return null;
      return { invite: x.done ? "Invite sent" : "Will invite (not done yet)", login: "Shared login", call: "Call me to set it up", unknown: "Not sure / doesn't have it", none: "Doesn't use it" }[x.via] || x.via;
    }
    default:
      return String(v);
  }
}

function AccessAnswer({ qid, field, v }: { qid: string; field: AccessField; v: AccessValue }) {
  const [pass, setPass] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const reveal = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/questionnaires/${qid}/reveal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field: field.id }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setPass(j.pass);
    } catch (e: any) { setErr(e.message || "Failed"); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-1">
      <span className="text-nv-text-primary">{fmtValue(field, v, {}) || "—"}</span>
      {v.via === "login" && (
        <div className="rounded-md bg-nv-deep/60 border border-white/5 px-2 py-1.5 space-y-1">
          <div><span className="text-nv-text-muted">User:</span> <span className="font-mono text-nv-text-primary select-all">{v.user || "—"}</span></div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-nv-text-muted">Password:</span>
            {pass != null ? <span className="font-mono text-nv-teal select-all">{pass}</span> : v.pass_saved ? (
              <button onClick={reveal} disabled={busy} className="flex items-center gap-1 text-nv-ember hover:text-nv-teal"><Lock size={11} /> {busy ? "…" : "Reveal (logged)"}</button>
            ) : <span className="text-nv-text-muted/60 italic">not entered</span>}
            {err && <span className="text-nv-error">{err}</span>}
          </div>
          {field.loginUrl && <a href={field.loginUrl} target="_blank" rel="noreferrer" className="text-nv-teal hover:underline flex items-center gap-1"><KeyRound size={11} /> {field.loginUrl}</a>}
        </div>
      )}
      {v.note && <div className="text-nv-text-secondary whitespace-pre-wrap">“{v.note}”</div>}
    </div>
  );
}

function SectionAnswers({ qid, section, answers, open, toggle, showEmpty }: { qid: string; section: Section; answers: Answers; open: boolean; toggle: () => void; showEmpty: boolean }) {
  const p = sectionProgress(section, answers);
  return (
    <div className="rounded-nv-md border border-white/5 bg-white/[0.02]">
      <button onClick={toggle} className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
        {open ? <ChevronDown size={14} className="text-nv-text-muted" /> : <ChevronRight size={14} className="text-nv-text-muted" />}
        <span className="flex-1 text-sm font-medium text-nv-text-primary">{personalize(section.title, answers)}</span>
        <span className={`text-[11px] ${p.answered ? "text-nv-teal" : "text-nv-text-muted"}`}>{p.answered}/{p.total}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {section.fields.filter((f) => f.type !== "info" && isVisible(f.showIf, answers)).map((f) => {
            const v = answers[f.id];
            const shown = fmtValue(f, v, answers);
            if (!shown && !showEmpty) return null;
            return (
              <div key={f.id} className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 gap-y-0.5 text-xs border-t border-white/5 pt-2">
                <span className="text-nv-text-muted">{personalize(f.label, answers)}</span>
                {f.type === "access" && shown ? (
                  <AccessAnswer qid={qid} field={f} v={v} />
                ) : f.type === "list" && Array.isArray(v) && v.length ? (
                  <div className="space-y-1.5">
                    {v.map((row: any, i: number) => (
                      <div key={i} className="rounded-md bg-nv-deep/60 border border-white/5 px-2 py-1.5">
                        {f.columns.map((c) => {
                          const cv = fmtValue(c, row[c.id], answers);
                          return cv ? <div key={c.id}><span className="text-nv-text-muted">{personalize(c.label, answers)}:</span> <span className="text-nv-text-primary">{cv}</span></div> : null;
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className={shown ? "text-nv-text-primary whitespace-pre-wrap" : "text-nv-text-muted/50 italic"}>{shown || "—"}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
