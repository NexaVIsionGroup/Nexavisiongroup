"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ArrowLeft, Globe, Smartphone, ShoppingBag, FileSignature, Star, HelpCircle, Loader2 } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const NEEDS = [
  { id: "website", label: "A new website", icon: Globe },
  { id: "app", label: "My own business app", icon: Smartphone },
  { id: "store", label: "Online ordering or a store", icon: ShoppingBag },
  { id: "quotes", label: "Quotes, invoices and payments", icon: FileSignature },
  { id: "reviews", label: "Google reviews and listings", icon: Star },
  { id: "unsure", label: "Not sure yet", icon: HelpCircle },
];
const KINDS = ["Restaurant or café", "Contractor or home services", "Law, medical or other office", "Hotel or rental", "Shop or maker", "Something else"];
const CONTACT = ["Call", "Text", "Email"];
const STEPS = ["What you need", "Your business", "How to reach you"];

type Form = {
  needs: string[]; business: string; kind: string; website: string;
  name: string; email: string; phone: string; contactBy: string; message: string; company_site: string;
};

export function CheckupForm({ plan = "" }: { plan?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState<Form>({ needs: [], business: "", kind: "", website: "", name: "", email: "", phone: "", contactBy: "Call", message: "", company_site: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleNeed = (id: string) => set("needs", f.needs.includes(id) ? f.needs.filter((n) => n !== id) : [...f.needs, id]);

  function check(s: number) {
    if (s === 0 && f.needs.length === 0) return "Pick at least one, or choose “Not sure yet”.";
    if (s === 1 && !f.business.trim()) return "Please add your business name.";
    if (s === 2) {
      if (!f.name.trim()) return "Please add your name.";
      if (!f.email.trim() && !f.phone.trim()) return "Please add an email or phone number so we can reach you.";
      if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return "That email address doesn't look right. Please check it.";
    }
    return "";
  }
  function next() {
    const e = check(step);
    setError(e);
    if (e) return;
    setDir(1);
    setStep((s) => s + 1);
  }
  function back() { setError(""); setDir(-1); setStep((s) => s - 1); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) return next();
    const err = check(2);
    setError(err);
    if (err) return;
    setSending(true);
    try {
      const res = await fetch("/api/checkup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, needs: f.needs.map((id) => NEEDS.find((n) => n.id === id)?.label ?? id), plan }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "We couldn't send your request. Please try again, or email admin@nexavisiongroup.com.");
      setDone(true);
    } catch (x) {
      setError(x instanceof Error ? x.message : "We couldn't send your request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const variants = {
    in: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 40, filter: "blur(6px)" }),
    on: { opacity: 1, x: 0, filter: "blur(0px)" },
    out: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -40, filter: "blur(6px)" }),
  };

  if (done) {
    return (
      <motion.div className="nxs-cu-card nxs-cu-done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE }} role="status">
        <motion.span className="nxs-cu-tick" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}>
          <Check size={40} strokeWidth={3} />
        </motion.span>
        <h2 className="nxs-display">You&rsquo;re all set, {f.name.trim().split(/\s+/)[0]}.</h2>
        <p>We&rsquo;ll look at {f.business.trim() || "your business"} and reach out within one business day{f.contactBy ? ` by ${f.contactBy.toLowerCase()}` : ""} with your free check-up.</p>
        <Link href="/" className="nxs-btn nxs-btn-ghost">Back to the home page</Link>
      </motion.div>
    );
  }

  return (
    <form className="nxs-cu-card" onSubmit={submit} noValidate>
      <div className="nxs-cu-steps" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} data-state={i < step ? "done" : i === step ? "now" : "todo"}>
            <i>{i < step ? <Check size={14} strokeWidth={3} /> : i + 1}</i>{s}
          </span>
        ))}
      </div>
      <div className="nxs-cu-bar" aria-hidden><motion.i animate={{ scaleX: (step + 1) / STEPS.length }} transition={{ duration: 0.6, ease: EASE }} /></div>
      <p className="sr-only" aria-live="polite">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {/* honeypot */}
      <input type="text" name="company_site" tabIndex={-1} autoComplete="off" value={f.company_site} onChange={(e) => set("company_site", e.target.value)} className="nxs-cu-hp" aria-hidden />

      <div className="nxs-cu-body">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={step} custom={dir} variants={variants} initial="in" animate="on" exit="out" transition={{ duration: 0.4, ease: EASE }}>
            {step === 0 && (
              <fieldset>
                <legend className="nxs-display">What can we help with?</legend>
                <p className="nxs-cu-hint">Pick as many as you like.</p>
                <div className="nxs-cu-tiles">
                  {NEEDS.map(({ id, label, icon: Icon }) => (
                    <button type="button" key={id} className="nxs-cu-tile" aria-pressed={f.needs.includes(id)} onClick={() => toggleNeed(id)}>
                      <Icon size={22} aria-hidden />
                      <span>{label}</span>
                      <b aria-hidden><Check size={14} strokeWidth={3} /></b>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="nxs-display">Tell us about your business.</legend>
                <label className="nxs-cu-field">
                  <span>Business name</span>
                  <input value={f.business} onChange={(e) => set("business", e.target.value)} autoComplete="organization" placeholder="Sunrise Bakery" />
                </label>
                <p className="nxs-cu-label">What kind of business is it?</p>
                <div className="nxs-cu-chips">
                  {KINDS.map((k) => (
                    <button type="button" key={k} className="nxs-cu-chip" aria-pressed={f.kind === k} onClick={() => set("kind", f.kind === k ? "" : k)}>{k}</button>
                  ))}
                </div>
                <label className="nxs-cu-field">
                  <span>Current website <em>(optional)</em></span>
                  <input value={f.website} onChange={(e) => set("website", e.target.value)} inputMode="url" autoComplete="url" placeholder="yourbusiness.com" />
                </label>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="nxs-display">How should we reach you?</legend>
                <label className="nxs-cu-field">
                  <span>Your name</span>
                  <input value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
                </label>
                <div className="nxs-cu-two">
                  <label className="nxs-cu-field">
                    <span>Email</span>
                    <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
                  </label>
                  <label className="nxs-cu-field">
                    <span>Phone</span>
                    <input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
                  </label>
                </div>
                <p className="nxs-cu-label">Best way to reach you</p>
                <div className="nxs-cu-chips">
                  {CONTACT.map((c) => (
                    <button type="button" key={c} className="nxs-cu-chip" aria-pressed={f.contactBy === c} onClick={() => set("contactBy", c)}>{c}</button>
                  ))}
                </div>
                <label className="nxs-cu-field">
                  <span>Anything else we should know? <em>(optional)</em></span>
                  <textarea rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} />
                </label>
              </fieldset>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="nxs-cu-error" role="alert">{error}</p>}

      <div className="nxs-cu-actions">
        {step > 0 ? (
          <button type="button" className="nxs-cu-back" onClick={back}><ArrowLeft size={18} aria-hidden /> Back</button>
        ) : <span />}
        <button type="submit" className="nxs-btn nxs-btn-glow" disabled={sending}>
          {sending ? <><Loader2 size={18} className="nxs-spin" aria-hidden /> Sending</> : step < 2 ? "Continue" : "Send my check-up request"}
        </button>
      </div>
    </form>
  );
}
