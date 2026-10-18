"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Home, Wallet, HandCoins, House, Zap, ShoppingCart, Truck, HeartPulse, Pill, ShieldCheck, CreditCard,
  Repeat, Receipt, PiggyBank, BadgeCheck, Target, FolderOpen, MessageCircleQuestion, Check, ChevronLeft,
  ChevronRight, CloudOff, Loader2, Send, ListChecks, Type, PartyPopper, Menu, X,
} from "lucide-react";
import type { Answers, ExtraQuestion, Section } from "@/lib/questionnaires";
import { fmtMoney, getTemplate, isVisible, personalize, sectionProgress, totals, visibleSections } from "@/lib/questionnaires";
import { FieldView, fieldWidthClass } from "./fields";

const ICONS: Record<string, React.ElementType> = {
  Home, Wallet, HandCoins, House, Zap, ShoppingCart, Truck, HeartPulse, Pill, ShieldCheck, CreditCard,
  Repeat, Receipt, PiggyBank, BadgeCheck, Target, FolderOpen, MessageCircleQuestion,
};

const SCALES = [1, 1.15, 1.3];
type SaveState = "idle" | "saving" | "saved" | "error";

interface Loaded {
  token: string;
  template: string;
  title: string;
  client_name: string | null;
  status: string;
  answers: Answers;
  extra_questions: ExtraQuestion[];
  current_section: number;
  submitted_at: string | null;
}

const lsKey = (t: string) => `nvq:${t}`;
const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

export default function QuestionnaireClient({ token }: { token: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(-1); // -1 welcome, 0..n-1 sections, n review
  const [save, setSave] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [scale, setScale] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [resumed, setResumed] = useState(false);

  const dirty = useRef<Record<string, any>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // ── load ───────────────────────────────────────────────────
  useEffect(() => {
    const s = Number(lsGet("nvq:scale"));
    if (SCALES.includes(s)) setScale(s);
    fetch(`/api/q/${token}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not open this form.");
        return j as Loaded;
      })
      .then((d) => {
        let a: Answers = d.answers || {};
        // recover anything typed while offline that never reached the server
        const pending = lsGet(lsKey(token));
        if (pending) {
          try {
            const p = JSON.parse(pending);
            if (p && typeof p === "object" && Object.keys(p).length) {
              a = { ...a, ...p };
              dirty.current = { ...p };
            }
          } catch {}
        }
        setData(d);
        setAnswers(a);
        setSubmittedAt(d.submitted_at);
        const answered = Object.keys(a).filter((k) => k !== "address").length > 0;
        if (answered) {
          setStep(Math.max(0, d.current_section || 0));
          setResumed(true);
        }
        if (Object.keys(dirty.current).length) scheduleSave();
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const template = useMemo(() => getTemplate(data?.template), [data?.template]);
  const sections = useMemo(() => visibleSections(template, answers, data?.extra_questions), [template, answers, data?.extra_questions]);
  const n = sections.length;
  const tot = useMemo(() => totals(template, answers, data?.extra_questions), [template, answers, data?.extra_questions]);

  // ── autosave ───────────────────────────────────────────────
  const flush = useCallback(async (extra: Record<string, any> = {}, keepalive = false) => {
    const patch = dirty.current;
    dirty.current = {};
    if (timer.current) clearTimeout(timer.current);
    if (!Object.keys(patch).length && !Object.keys(extra).length) return;
    setSave("saving");
    try {
      const r = await fetch(`/api/q/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(Object.keys(patch).length ? { answers: patch } : {}), ...extra }),
        keepalive,
      });
      if (!r.ok) throw new Error();
      lsSet(lsKey(token), JSON.stringify(dirty.current));
      setSave("saved");
      setSavedAt(new Date());
    } catch {
      dirty.current = { ...patch, ...dirty.current };
      lsSet(lsKey(token), JSON.stringify(dirty.current));
      setSave("error");
      timer.current = setTimeout(() => flush(), 8000);
    }
  }, [token]);

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 900);
  }, [flush]);

  useEffect(() => {
    const onHide = () => { if (Object.keys(dirty.current).length) flush({}, true); };
    const onVis = () => { if (document.visibilityState === "hidden") onHide(); };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flush]);

  const setAnswer = useCallback((id: string, v: any) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    dirty.current[id] = v;
    lsSet(lsKey(token), JSON.stringify(dirty.current));
    setSave("saving");
    scheduleSave();
  }, [scheduleSave, token]);

  const go = (next: number) => {
    const clamped = Math.max(-1, Math.min(n, next));
    setStep(clamped);
    setRailOpen(false);
    setJustSent(false);
    flush(clamped >= 0 && clamped < n ? { current_section: clamped } : {});
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const submit = async () => {
    setSubmitting(true);
    await flush();
    try {
      const r = await fetch(`/api/q/${token}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSubmittedAt(j.submitted_at);
      setJustSent(true);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      setSave("error");
    } finally {
      setSubmitting(false);
    }
  };

  const changeScale = () => {
    const next = SCALES[(SCALES.indexOf(scale) + 1) % SCALES.length];
    setScale(next);
    lsSet("nvq:scale", String(next));
  };

  // ── render ─────────────────────────────────────────────────
  const shell = (body: React.ReactNode) => (
    <div className="relative z-0 min-h-screen bg-[#f7f3ec] text-[#1f2328] antialiased" style={{ fontSize: `${19 * scale}px` }}>
      {body}
    </div>
  );

  if (error) {
    return shell(
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border-2 border-[#e4dccf] bg-white p-[1.5em] text-center shadow-sm">
          <CloudOff className="mx-auto mb-[0.6em] h-[2em] w-[2em] text-[#8a7f72]" />
          <p className="text-[1.2em] font-bold">{error}</p>
          <p className="mt-[0.5em] text-[0.95em] text-[#5f5850]">Please reach out to the person who sent you this link.</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return shell(
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-[2em] w-[2em] animate-spin text-[#0f766e]" />
      </div>
    );
  }

  const current: Section | null = step >= 0 && step < n ? sections[step] : null;
  const pct = n ? Math.round((Math.max(0, Math.min(step, n)) / n) * 100) : 0;

  const topBar = (
    <header className="sticky top-0 z-30 border-b border-[#e4dccf] bg-[#f7f3ec]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-[0.55em]">
        {step >= 0 && (
          <button type="button" onClick={() => setRailOpen((o) => !o)} className="rounded-lg p-[0.35em] text-[#4a443d] hover:bg-[#ece5d9] lg:hidden" aria-label="All sections">
            {railOpen ? <X className="h-[1.2em] w-[1.2em]" /> : <Menu className="h-[1.2em] w-[1.2em]" />}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95em] font-bold leading-tight">{personalize(data.title, answers)}</p>
          <p className="text-[0.72em] font-semibold uppercase tracking-[0.12em] text-[#8a7f72]">NexaVision Group</p>
        </div>
        <SaveBadge state={save} at={savedAt} />
        <button type="button" onClick={changeScale} className="flex items-center gap-1 rounded-xl border-2 border-[#d8cfc2] bg-white px-[0.6em] py-[0.3em] text-[0.8em] font-bold text-[#4a443d] hover:border-[#0f766e]" aria-label="Change text size">
          <Type className="h-[1.1em] w-[1.1em]" />
          <span className="hidden sm:inline">Text size</span>
        </button>
      </div>
      {step >= 0 && (
        <div className="h-[5px] w-full bg-[#ece5d9]">
          <div className="h-full bg-[#0f766e] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}
    </header>
  );

  // Welcome
  if (step === -1) {
    return shell(
      <>
        {topBar}
        <main className="mx-auto max-w-2xl px-4 pb-16 pt-[2em]">
          <div ref={topRef} />
          <p className="text-[0.8em] font-bold uppercase tracking-[0.14em] text-[#0f766e]">{template.name}</p>
          <h1 className="mt-[0.4em] text-[2em] font-bold leading-[1.15] tracking-tight">{template.welcome.heading}</h1>
          <div className="mt-[1em] space-y-[0.8em] text-[1.02em] leading-relaxed text-[#3d3832]">
            {template.welcome.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <ul className="mt-[1.4em] grid gap-[0.6em] sm:grid-cols-3">
            {[
              ["Saves as you go", "Nothing is lost if you close the page."],
              ["Skip anything", "Fill in what you know."],
              ["Private", "Only you and NexaVision see this."],
            ].map(([h, s]) => (
              <li key={h} className="rounded-2xl border-2 border-[#e4dccf] bg-white p-[0.9em]">
                <Check className="mb-[0.3em] h-[1.2em] w-[1.2em] text-[#0f766e]" strokeWidth={3} />
                <p className="font-bold">{h}</p>
                <p className="text-[0.88em] text-[#5f5850]">{s}</p>
              </li>
            ))}
          </ul>
          <p className="mt-[1.2em] text-[0.9em] text-[#5f5850]">
            {n} short sections, about 30–45 minutes in all. You can do a few at a time.
          </p>
          <button type="button" onClick={() => go(0)} className="mt-[1.2em] flex w-full items-center justify-center gap-[0.5em] rounded-2xl bg-[#0f766e] px-[1.2em] py-[0.85em] text-[1.15em] font-bold text-white shadow-[0_6px_0_#0a5a54] transition hover:bg-[#0d6b64] active:translate-y-[3px] active:shadow-[0_3px_0_#0a5a54] sm:w-auto">
            Let&apos;s begin <ChevronRight className="h-[1.2em] w-[1.2em]" strokeWidth={3} />
          </button>
        </main>
      </>
    );
  }

  const rail = (
    <nav aria-label="Sections" className="space-y-[0.2em]">
      {sections.map((s, i) => {
        const Icon = ICONS[s.icon] || ListChecks;
        const p = sectionProgress(s, answers);
        const active = i === step;
        const done = p.total > 0 && p.answered > 0;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => go(i)}
            className={`flex w-full items-center gap-[0.6em] rounded-xl px-[0.7em] py-[0.5em] text-left text-[0.86em] transition ${
              active ? "bg-[#0f766e] text-white" : "text-[#3d3832] hover:bg-[#ece5d9]"
            }`}
          >
            <span className={`flex h-[1.7em] w-[1.7em] shrink-0 items-center justify-center rounded-full ${active ? "bg-white/20" : done ? "bg-[#d5efe9] text-[#0f766e]" : "bg-[#ece5d9] text-[#8a7f72]"}`}>
              {done && !active ? <Check className="h-[0.95em] w-[0.95em]" strokeWidth={3} /> : <Icon className="h-[0.95em] w-[0.95em]" />}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">{personalize(s.short, answers)}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => go(n)}
        className={`flex w-full items-center gap-[0.6em] rounded-xl px-[0.7em] py-[0.5em] text-left text-[0.86em] font-semibold transition ${step === n ? "bg-[#0f766e] text-white" : "text-[#3d3832] hover:bg-[#ece5d9]"}`}
      >
        <span className={`flex h-[1.7em] w-[1.7em] items-center justify-center rounded-full ${step === n ? "bg-white/20" : "bg-[#ece5d9] text-[#8a7f72]"}`}>
          <Send className="h-[0.9em] w-[0.9em]" />
        </span>
        Review &amp; send
      </button>
    </nav>
  );

  const totalsCard = (tot.income > 0 || tot.expenses > 0) && (
    <div className="rounded-2xl border-2 border-[#e4dccf] bg-white p-[0.9em]">
      <p className="text-[0.75em] font-bold uppercase tracking-[0.12em] text-[#8a7f72]">So far, per month</p>
      <dl className="mt-[0.4em] space-y-[0.25em] text-[0.9em]">
        <div className="flex justify-between"><dt>Coming in</dt><dd className="font-bold tabular-nums text-[#0f766e]">{fmtMoney(tot.income)}</dd></div>
        <div className="flex justify-between"><dt>Going out</dt><dd className="font-bold tabular-nums text-[#b45309]">{fmtMoney(tot.expenses)}</dd></div>
      </dl>
    </div>
  );

  return shell(
    <>
      {topBar}
      <div className="mx-auto flex max-w-6xl gap-[1.5em] px-4 pb-[6em] pt-[1.4em]">
        {/* desktop rail */}
        <aside className="sticky top-[5.2em] hidden h-[calc(100vh-6.5em)] w-[15em] shrink-0 flex-col gap-[0.8em] overflow-y-auto pb-4 lg:flex">
          {rail}
          {totalsCard}
        </aside>
        {/* mobile drawer */}
        {railOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setRailOpen(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-[22em] overflow-y-auto bg-[#f7f3ec] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="mb-[0.6em] text-[0.8em] font-bold uppercase tracking-[0.12em] text-[#8a7f72]">All sections</p>
              {rail}
              <div className="mt-[0.8em]">{totalsCard}</div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div ref={topRef} className="scroll-mt-[6em]" />
          {resumed && step < n && (
            <div className="mb-[1em] flex items-start gap-[0.6em] rounded-2xl border-2 border-[#9fd6cb] bg-[#e9f6f3] px-[1em] py-[0.7em] text-[#0b4f49]">
              <Check className="mt-[0.15em] h-[1.1em] w-[1.1em] shrink-0" strokeWidth={3} />
              <p className="flex-1 text-[0.92em]">Welcome back! Your answers were saved, so you can pick up right where you left off.</p>
              <button type="button" onClick={() => setResumed(false)} className="text-[0.85em] font-bold underline">OK</button>
            </div>
          )}

          {current ? (
            <SectionView key={current.id} section={current} index={step} count={n} answers={answers} setAnswer={setAnswer} />
          ) : (
            <Review sections={sections} answers={answers} tot={tot} go={go} submit={submit} submitting={submitting} submittedAt={submittedAt} justSent={justSent} />
          )}

          {/* nav */}
          {current && (
            <div className="mt-[1.6em] flex items-center gap-[0.7em]">
              <button type="button" onClick={() => go(step - 1)} className="flex items-center gap-[0.3em] rounded-2xl border-2 border-[#d8cfc2] bg-white px-[1em] py-[0.7em] text-[1em] font-bold text-[#3d3832] hover:border-[#8a7f72]">
                <ChevronLeft className="h-[1.1em] w-[1.1em]" strokeWidth={3} /> Back
              </button>
              <button type="button" onClick={() => go(step + 1)} className="flex flex-1 items-center justify-center gap-[0.4em] rounded-2xl bg-[#0f766e] px-[1em] py-[0.75em] text-[1.05em] font-bold text-white shadow-[0_5px_0_#0a5a54] transition hover:bg-[#0d6b64] active:translate-y-[3px] active:shadow-[0_2px_0_#0a5a54] sm:flex-none sm:px-[1.6em]">
                <span className="truncate">{step + 1 < n ? `Next: ${personalize(sections[step + 1].short, answers)}` : "Review & send"}</span>
                <ChevronRight className="h-[1.1em] w-[1.1em] shrink-0" strokeWidth={3} />
              </button>
            </div>
          )}
          {current && (
            <p className="mt-[1em] text-center text-[0.82em] text-[#8a7f72] sm:text-left">
              Section {step + 1} of {n}. Your answers save automatically.
            </p>
          )}
        </main>
      </div>
    </>
  );
}

function SectionView({ section, index, count, answers, setAnswer }: {
  section: Section;
  index: number;
  count: number;
  answers: Answers;
  setAnswer: (id: string, v: any) => void;
}) {
  const Icon = ICONS[section.icon] || ListChecks;
  return (
    <section className="rounded-[1.6em] border-2 border-[#e4dccf] bg-white px-[1.1em] py-[1.3em] shadow-[0_2px_0_#e4dccf] sm:px-[1.8em] sm:py-[1.7em]">
      <div className="flex items-center gap-[0.7em]">
        <span className="flex h-[2.4em] w-[2.4em] items-center justify-center rounded-2xl bg-[#e9f6f3] text-[#0f766e]">
          <Icon className="h-[1.3em] w-[1.3em]" />
        </span>
        <p className="text-[0.8em] font-bold uppercase tracking-[0.14em] text-[#8a7f72]">
          Section {index + 1} of {count}
        </p>
      </div>
      <h2 className="mt-[0.6em] text-[1.65em] font-bold leading-tight tracking-tight">{personalize(section.title, answers)}</h2>
      {section.intro && <p className="mt-[0.4em] text-[0.98em] leading-relaxed text-[#5f5850]">{personalize(section.intro, answers)}</p>}
      <div className="mt-[1.4em] flex flex-wrap gap-x-[1em] gap-y-[1.5em]">
        {section.fields
          .filter((f) => isVisible(f.showIf, answers))
          .map((f) => (
            <div key={f.id} className={fieldWidthClass(f)}>
              <FieldView field={f} answers={answers} value={answers[f.id]} onChange={(v) => setAnswer(f.id, v)} />
            </div>
          ))}
      </div>
    </section>
  );
}

function Review({ sections, answers, tot, go, submit, submitting, submittedAt, justSent }: {
  sections: Section[];
  answers: Answers;
  tot: ReturnType<typeof totals>;
  go: (i: number) => void;
  submit: () => void;
  submitting: boolean;
  submittedAt: string | null;
  justSent: boolean;
}) {
  const expenseCats = tot.byCategory.filter((c) => c.role === "expense" && c.amount > 0);
  const maxCat = Math.max(1, ...expenseCats.map((c) => c.amount));

  if (justSent) {
    return (
      <section className="rounded-[1.6em] border-2 border-[#9fd6cb] bg-white px-[1.3em] py-[2em] text-center sm:px-[2em]">
        <PartyPopper className="mx-auto h-[2.6em] w-[2.6em] text-[#0f766e]" />
        <h2 className="mt-[0.5em] text-[1.8em] font-bold">Thank you! It&apos;s been sent.</h2>
        <p className="mx-auto mt-[0.5em] max-w-[28em] leading-relaxed text-[#3d3832]">
          We&apos;ll go through everything and get back to you with ideas. If you think of something else, come back to this same link. You can change any answer and send it again.
        </p>
        <button type="button" onClick={() => go(0)} className="mt-[1.2em] rounded-2xl border-2 border-[#d8cfc2] bg-white px-[1.2em] py-[0.6em] font-bold hover:border-[#0f766e]">
          Look over my answers
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-[1.2em]">
      <div className="rounded-[1.6em] border-2 border-[#e4dccf] bg-white px-[1.1em] py-[1.3em] sm:px-[1.8em]">
        <h2 className="text-[1.65em] font-bold leading-tight">Review &amp; send</h2>
        <p className="mt-[0.4em] leading-relaxed text-[#5f5850]">
          Here&apos;s a quick look at what you&apos;ve entered. It&apos;s fine if some parts are empty. Send what you have.
        </p>

        {(tot.income > 0 || tot.expenses > 0) && (
          <div className="mt-[1.2em] grid gap-[0.7em] sm:grid-cols-3">
            <Stat label="Coming in each month" value={fmtMoney(tot.income)} tone="teal" />
            <Stat label="Going out each month" value={fmtMoney(tot.expenses)} tone="amber" />
            <Stat label={tot.gap >= 0 ? "Left over" : "Short each month"} value={fmtMoney(Math.abs(tot.gap))} tone={tot.gap >= 0 ? "teal" : "rose"} />
          </div>
        )}

        {expenseCats.length > 0 && (
          <div className="mt-[1.3em]">
            <p className="text-[0.8em] font-bold uppercase tracking-[0.12em] text-[#8a7f72]">Where the money goes</p>
            <ul className="mt-[0.5em] space-y-[0.45em]">
              {expenseCats.map((c) => (
                <li key={c.category}>
                  <div className="flex justify-between text-[0.92em]">
                    <span className="font-semibold">{c.category}</span>
                    <span className="font-bold tabular-nums">{fmtMoney(c.amount)}</span>
                  </div>
                  <div className="mt-[0.2em] h-[0.5em] rounded-full bg-[#f1ece4]">
                    <div className="h-full rounded-full bg-[#d9a066]" style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-[0.6em] text-[0.8em] text-[#8a7f72]">Weekly and yearly amounts are converted to a monthly average.</p>
          </div>
        )}
      </div>

      <div className="rounded-[1.6em] border-2 border-[#e4dccf] bg-white px-[1.1em] py-[1.1em] sm:px-[1.8em]">
        <p className="text-[0.8em] font-bold uppercase tracking-[0.12em] text-[#8a7f72]">Sections</p>
        <ul className="mt-[0.4em] divide-y divide-[#f1ece4]">
          {sections.map((s, i) => {
            const p = sectionProgress(s, answers);
            const pct = p.total ? p.answered / p.total : 0;
            return (
              <li key={s.id}>
                <button type="button" onClick={() => go(i)} className="flex w-full items-center gap-[0.6em] py-[0.55em] text-left hover:text-[#0f766e]">
                  <span className={`flex h-[1.4em] w-[1.4em] shrink-0 items-center justify-center rounded-full ${pct > 0 ? "bg-[#0f766e] text-white" : "border-2 border-[#d8cfc2]"}`}>
                    {pct > 0 && <Check className="h-[0.85em] w-[0.85em]" strokeWidth={3.5} />}
                  </span>
                  <span className="flex-1 font-semibold">{personalize(s.short, answers)}</span>
                  <span className="text-[0.82em] text-[#8a7f72]">{p.answered ? `${p.answered} answered` : "Not started"}</span>
                  <ChevronRight className="h-[1em] w-[1em] text-[#b9ae9f]" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-[1.6em] border-2 border-[#0f766e]/30 bg-[#e9f6f3] px-[1.1em] py-[1.3em] sm:px-[1.8em]">
        <p className="leading-relaxed text-[#0b4f49]">
          {submittedAt
            ? `You sent this in on ${new Date(submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Send it again any time you add or change answers.`
            : "When you're ready, press the button below. You can still come back and change answers after you send it."}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="mt-[1em] flex w-full items-center justify-center gap-[0.5em] rounded-2xl bg-[#0f766e] px-[1.2em] py-[0.85em] text-[1.15em] font-bold text-white shadow-[0_6px_0_#0a5a54] transition hover:bg-[#0d6b64] active:translate-y-[3px] active:shadow-[0_3px_0_#0a5a54] disabled:opacity-60 sm:w-auto"
        >
          {submitting ? <Loader2 className="h-[1.2em] w-[1.2em] animate-spin" /> : <Send className="h-[1.1em] w-[1.1em]" />}
          {submittedAt ? "Send my updates" : "Send my answers"}
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "teal" | "amber" | "rose" }) {
  const c = tone === "teal" ? "text-[#0f766e]" : tone === "amber" ? "text-[#b45309]" : "text-[#b42318]";
  return (
    <div className="rounded-2xl bg-[#faf7f2] p-[0.9em]">
      <p className="text-[0.82em] font-semibold text-[#5f5850]">{label}</p>
      <p className={`mt-[0.1em] text-[1.6em] font-bold tabular-nums ${c}`}>{value}</p>
    </div>
  );
}

function SaveBadge({ state, at }: { state: SaveState; at: Date | null }) {
  if (state === "idle") return null;
  if (state === "saving")
    return (
      <span className="flex items-center gap-1 text-[0.78em] font-semibold text-[#8a7f72]">
        <Loader2 className="h-[1em] w-[1em] animate-spin" /> Saving
      </span>
    );
  if (state === "error")
    return (
      <span className="flex items-center gap-1 rounded-full bg-[#fff6e5] px-[0.6em] py-[0.15em] text-[0.78em] font-bold text-[#8a5a00]">
        <CloudOff className="h-[1em] w-[1em]" /> Will retry
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[0.78em] font-semibold text-[#0f766e]">
      <Check className="h-[1em] w-[1em]" strokeWidth={3} /> Saved{at ? ` ${at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}
    </span>
  );
}
