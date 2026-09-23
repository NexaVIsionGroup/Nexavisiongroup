"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";

type Kind = "quote" | "guide" | "question";
type Lead = { open: (kind: Kind, device?: string) => void };

const LeadCtx = createContext<Lead | null>(null);

const COPY: Record<Kind, { title: string; body: string; cta: string }> = {
  quote: {
    title: "Quote a fleet",
    body: "Tell us how many phones and where they'll work. We'll come back with pricing and a setup plan for your site.",
    cta: "Send quote request",
  },
  guide: {
    title: "Technical guide",
    body: "The detailed guide covers tower and frequency locking, network controls and fleet setup. We'll email it to you.",
    cta: "Send me the guide",
  },
  question: {
    title: "Ask about a phone",
    body: "Ask anything about this model, stock, colors or setup. A real person replies.",
    cta: "Send question",
  },
};

function Field({ label, name, type = "text", required = false, half = false, auto }: { label: string; name: string; type?: string; required?: boolean; half?: boolean; auto?: string }) {
  return (
    <label className="np-field" data-half={half}>
      <input name={name} type={type} required={required} autoComplete={auto} placeholder=" " inputMode={type === "number" ? "numeric" : undefined} />
      <span>
        {label}
        {!required && <em> (optional)</em>}
      </span>
    </label>
  );
}

function LeadSheet({ kind, device, onClose }: { kind: Kind; device?: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const c = COPY[kind];

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/nexaphone/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          device,
          name: g("name"),
          email: g("email"),
          phone: g("phone"),
          company: g("company"),
          units: g("units"),
          location: g("location"),
          message: g("message"),
          website: g("website"),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      try {
        navigator.vibrate?.([15, 50, 30]);
      } catch {
        /* no haptics */
      }
      setDone(true);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.div className="np-sheet-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="np-sheet np-lead"
        role="dialog"
        aria-modal="true"
        aria-label={c.title}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
      >
        <div className="np-sheet-grip" />
        <header className="np-sheet-head">
          <h2 className="np-display">{done ? "Sent." : c.title}</h2>
          <button className="np-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {done ? (
          <div className="np-lead-done">
            <motion.div className="np-done-ring" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 15 }}>
              <Check size={36} />
            </motion.div>
            <p>
              {kind === "guide"
                ? "Check your inbox. The guide is on its way within one business day."
                : "We have it. A real person will reply within one business day."}
            </p>
            <button className="np-btn np-btn-ghost" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="np-form np-lead-form" onSubmit={submit}>
            <p className="np-lead-intro">
              {c.body}
              {device ? ` Model: ${device.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}.` : ""}
            </p>
            <fieldset>
              <Field label="Full name" name="name" required auto="name" />
              <Field label="Email" name="email" type="email" required auto="email" />
              <Field label="Phone" name="phone" type="tel" half auto="tel" />
              <Field label="Company" name="company" half auto="organization" />
              {kind === "quote" && (
                <>
                  <Field label="How many phones" name="units" type="number" half />
                  <Field label="Site city and state" name="location" half />
                </>
              )}
              <label className="np-field">
                <textarea name="message" rows={3} placeholder=" " />
                <span>
                  {kind === "question" ? "Your question" : "Anything else"} {kind !== "question" && <em>(optional)</em>}
                </span>
              </label>
            </fieldset>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="np-hp" aria-hidden />
            {err && (
              <p className="np-err" role="alert">
                {err}
              </p>
            )}
            <button className="np-btn np-btn-lock np-shine np-submit" disabled={busy}>
              {busy ? "Sending…" : c.cta}
            </button>
          </form>
        )}
      </motion.aside>
    </>
  );
}

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ kind: Kind; device?: string } | null>(null);
  const open = useCallback((kind: Kind, device?: string) => setState({ kind, device }), []);
  const close = useCallback(() => setState(null), []);
  return (
    <LeadCtx.Provider value={{ open }}>
      {children}
      <AnimatePresence>{state && <LeadSheet key={state.kind} kind={state.kind} device={state.device} onClose={close} />}</AnimatePresence>
    </LeadCtx.Provider>
  );
}

export function useLead() {
  const c = useContext(LeadCtx);
  if (!c) throw new Error("useLead outside LeadProvider");
  return c;
}

/** A button that opens the lead sheet. Drop-in for the old mailto links. */
export function LeadButton({ kind, device, className, children }: { kind: Kind; device?: string; className?: string; children: React.ReactNode }) {
  const { open } = useLead();
  return (
    <button type="button" className={className} onClick={() => open(kind, device)}>
      {children}
    </button>
  );
}
