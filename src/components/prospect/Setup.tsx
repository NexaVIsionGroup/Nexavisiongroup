"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, CloudOff, Copy, ExternalLink, Eye, EyeOff, Globe, HelpCircle, Info, KeyRound,
  Lightbulb, Loader2, Lock, Mail, PhoneCall, Send, ShieldCheck, ShoppingBag, Target, User, Bike, UserPlus,
} from "lucide-react";
import type { AccessField, AccessValue, Answers, Field, Option, Section } from "@/lib/questionnaires";
import { isVisible, sectionProgress } from "@/lib/questionnaires";
import type { SaveState } from "./useCheckup";
import { EASE } from "./motion";
import type { TrackFn } from "./track";

const ICONS: Record<string, React.ElementType> = { User, KeyRound, ShoppingBag, Globe, Bike, Target };

export default function Setup({ title, sections, step, go, answers, setAnswer, save, savedAt, contactEmail, onBriefing, submit, submitting, submittedAt, resumed, onDismissResumed, track }: {
  title: string;
  sections: Section[];
  /** 0..n-1 sections, n = review */
  step: number;
  go: (i: number) => void;
  answers: Answers;
  setAnswer: (id: string, v: any) => void;
  save: SaveState;
  savedAt: Date | null;
  contactEmail: string;
  onBriefing: () => void;
  submit: () => Promise<boolean>;
  submitting: boolean;
  submittedAt: string | null;
  /** they came back to a link they'd already started */
  resumed?: boolean;
  onDismissResumed?: () => void;
  track?: TrackFn;
}) {
  const n = sections.length;
  const [dir, setDir] = useState(1);
  const [sent, setSent] = useState(false);
  const move = (i: number) => { setDir(i > step ? 1 : -1); setSent(false); go(i); };
  const current = step < n ? sections[step] : null;
  const done = (s: Section) => { const p = sectionProgress(s, answers); return p.answered > 0; };

  return (
    <div className="pr-setup">
      <div className="pr-bar-top-fixed">
        <div className="pr-wrap pr-topbar">
          <button type="button" className="pr-icon-btn" onClick={onBriefing} aria-label="Back to what we found">
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Findings</span>
          </button>
          <div className="pr-topbar-title">
            <strong>{title}</strong>
            <span>NexaVision Group</span>
          </div>
          <SaveBadge state={save} at={savedAt} />
        </div>
        <div className="pr-progress"><i style={{ transform: `scaleX(${Math.min(step, n) / n})` }} /></div>
      </div>

      <div className="pr-wrap pr-setup-grid">
        <nav className="pr-rail-steps" aria-label="Steps">
          {sections.map((s, i) => (
            <button key={s.id} type="button" onClick={() => move(i)} aria-current={i === step ? "step" : undefined}>
              <span className="pr-dot" data-done={done(s) && i !== step}>{done(s) && i !== step ? <Check size={15} strokeWidth={3} /> : i + 1}</span>
              {s.short}
            </button>
          ))}
          <button type="button" onClick={() => move(n)} aria-current={step === n ? "step" : undefined}>
            <span className="pr-dot"><Send size={14} /></span> Review &amp; send
          </button>
        </nav>

        <main style={{ minWidth: 0 }}>
          <div className="pr-mobile-steps" aria-hidden style={{ marginBottom: 26 }}>
            {sections.map((s, i) => <i key={s.id} data-on={i === step} data-done={i !== step && done(s)} />)}
            <i data-on={step === n} />
          </div>

          <AnimatePresence>
            {resumed && (
              <motion.div key="wb" className="pr-welcome" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                <Check size={20} strokeWidth={3} />
                <span>Welcome back{answers.owner_first ? `, ${String(answers.owner_first).trim()}` : ""}. Everything you entered is saved, so you're right where you left off.</span>
                <button type="button" onClick={onBriefing}>See what we found</button>
                <button type="button" onClick={onDismissResumed} aria-label="Dismiss">OK</button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={current ? current.id : sent ? "sent" : "review"}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: dir * -60, filter: "blur(8px)" }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              {current ? (
                <SectionPanel section={current} index={step} count={n} answers={answers} setAnswer={setAnswer} contactEmail={contactEmail} track={track} />
              ) : sent ? (
                <Thanks onReview={() => move(0)} />
              ) : (
                <Review sections={sections} answers={answers} go={move} submittedAt={submittedAt} submitting={submitting}
                  onSend={async () => { if (await submit()) setSent(true); }} />
              )}
            </motion.div>
          </AnimatePresence>

          {current && (
            <>
              <div className="pr-nav">
                <button type="button" className="pr-btn pr-btn-ghost" onClick={() => (step === 0 ? onBriefing() : move(step - 1))} aria-label="Back">
                  <ArrowLeft size={20} />
                </button>
                <button type="button" className="pr-btn pr-btn-gold" onClick={() => move(step + 1)}>
                  {step + 1 < n ? `Next: ${sections[step + 1].short}` : "Review & send"} <ArrowRight size={20} />
                </button>
              </div>
              <p className="pr-nav-hint">Step {step + 1} of {n}. Skip anything you're not sure about. Your answers save automatically.</p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SaveBadge({ state, at }: { state: SaveState; at: Date | null }) {
  if (state === "idle") return null;
  return (
    <span className="pr-save" data-state={state} aria-live="polite">
      {state === "saving" && <><Loader2 size={15} className="animate-spin" /> Saving</>}
      {state === "error" && <><CloudOff size={15} /> Will retry</>}
      {state === "saved" && <><Check size={15} strokeWidth={3} /> Saved{at ? ` ${at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}</>}
    </span>
  );
}

function SectionPanel({ section, index, count, answers, setAnswer, contactEmail, track }: {
  section: Section; index: number; count: number; answers: Answers; setAnswer: (id: string, v: any) => void; contactEmail: string; track?: TrackFn;
}) {
  const Icon = ICONS[section.icon] || KeyRound;
  return (
    <section>
      <div className="pr-panel-head">
        <small><Icon size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 8 }} />Step {index + 1} of {count}</small>
        <h2>{section.title}</h2>
        {section.intro && <p>{section.intro}</p>}
      </div>
      <div className="pr-fields">
        {section.fields.filter((f) => isVisible(f.showIf, answers)).map((f, i) => (
          <motion.div key={f.id} className="pr-f" data-w={"width" in f && f.width ? f.width : "lg"}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 + i * 0.05, ease: EASE }}>
            <FieldView field={f} value={answers[f.id]} onChange={(v) => setAnswer(f.id, v)} contactEmail={contactEmail} track={track} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── fields ──────────────────────────────────────────────────
function FieldView({ field, value, onChange, contactEmail, track }: { field: Field; value: any; onChange: (v: any) => void; contactEmail: string; track?: TrackFn }) {
  const id = `f_${field.id}`;
  if (field.type === "info") {
    const Icon = field.tone === "privacy" ? ShieldCheck : field.tone === "tip" ? Lightbulb : Info;
    return <div className="pr-callout" data-tone={field.tone || "note"}><Icon size={22} /><span>{field.label}</span></div>;
  }
  if (field.type === "access") return <AccessCard field={field} value={value || {}} onChange={onChange} contactEmail={contactEmail} track={track} />;

  return (
    <div>
      <label htmlFor={id} className="pr-label">{field.label}</label>
      {field.help && <p className="pr-help">{field.help}</p>}
      {(() => {
        switch (field.type) {
          case "text":
          case "phone":
          case "email":
            return <input id={id} className="pr-input" type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : "text"} inputMode={field.type === "phone" ? "tel" : undefined}
              autoComplete={field.type === "phone" ? "tel" : field.type === "email" ? "email" : field.id === "owner_first" ? "given-name" : "off"}
              placeholder={field.placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
          case "textarea":
            return <textarea id={id} className="pr-input" placeholder={field.placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
          case "number":
            return <input id={id} className="pr-input" type="text" inputMode="numeric" placeholder={field.placeholder} value={value ?? ""}
              onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); onChange(raw === "" ? null : raw); }} />;
          case "yesno":
            return <Choices inline options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, ...(field.unsure === false ? [] : [{ value: "not_sure", label: "Not sure" }])]} value={value} onChange={onChange} />;
          case "choice":
            return <Choices options={field.options} value={value} onChange={onChange} />;
          case "multi":
            return <Multi options={field.options} value={value} onChange={onChange} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}

function Choices({ options, value, onChange, inline }: { options: Option[]; value: any; onChange: (v: any) => void; inline?: boolean }) {
  return (
    <div role="radiogroup" className="pr-choices" data-inline={!!inline} data-cols={options.length > 3 ? 2 : 1}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} className="pr-choice" onClick={() => onChange(on ? null : o.value)}>
            <span className="pr-tick">{on && <Check size={15} strokeWidth={3.5} />}</span>
            <span>{o.label}{o.hint && <small>{o.hint}</small>}</span>
          </button>
        );
      })}
    </div>
  );
}

function Multi({ options, value, onChange }: { options: Option[]; value: any; onChange: (v: any) => void }) {
  const sel: string[] = Array.isArray(value) ? value : [];
  const toggle = (v: string) => {
    let next = sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v];
    if (!sel.includes(v)) next = v === "not_sure" ? [v] : next.filter((x) => x !== "not_sure");
    onChange(next.length ? next : null);
  };
  return (
    <div className="pr-choices" data-cols={2}>
      {options.map((o) => {
        const on = sel.includes(o.value);
        return (
          <button key={o.value} type="button" role="checkbox" aria-checked={on} className="pr-choice" onClick={() => toggle(o.value)}>
            <span className="pr-tick" data-square="true">{on && <Check size={15} strokeWidth={3.5} />}</span>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── access card ─────────────────────────────────────────────
const VIA_STATUS: Record<string, { label: string; tone?: "wait" | "muted" }> = {
  invite: { label: "Invite", tone: "wait" },
  login: { label: "Login saved" },
  call: { label: "We'll call", tone: "wait" },
  unknown: { label: "Not sure", tone: "muted" },
};

function initials(name: string) {
  const w = name.replace(/[^A-Za-z ]/g, " ").split(" ").filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : name[0]).toUpperCase();
}

function AccessCard({ field, value, onChange, contactEmail, track }: { field: AccessField; value: AccessValue; onChange: (v: AccessValue) => void; contactEmail: string; track?: TrackFn }) {
  const v = value || {};
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<AccessValue>) => onChange({ ...v, ...patch });
  const pick = (via: AccessValue["via"]) => {
    const next = v.via === via ? undefined : via;
    track?.("access", field.platform, { via: next || "cleared" });
    onChange({ ...v, via: next });
  };

  const options: { via: NonNullable<AccessValue["via"]>; label: string; icon: React.ElementType }[] = [
    ...(field.invite ? [{ via: "invite" as const, label: "Invite us", icon: UserPlus }] : []),
    { via: "login", label: "Send the login", icon: KeyRound },
    { via: "call", label: "Call me, let's do it together", icon: PhoneCall },
    { via: "unknown", label: "Not sure / don't have it", icon: HelpCircle },
  ];

  const status = v.via === "invite" ? (v.done ? { label: "Invite sent" } : VIA_STATUS.invite)
    : v.via === "login" ? (v.pass_saved || pw ? VIA_STATUS.login : { label: "Login", tone: "wait" as const })
    : v.via ? VIA_STATUS[v.via] : null;
  const complete = (v.via === "invite" && v.done) || (v.via === "login" && (v.pass_saved || pw));

  const copy = async () => {
    try { await navigator.clipboard.writeText(contactEmail); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
  };

  return (
    <div className="pr-access" data-state={complete ? "done" : undefined} style={{ ["--brand" as any]: field.color }}>
      <div className="pr-access-head">
        <span className="pr-badge" aria-hidden>{initials(field.platform)}</span>
        <div className="pr-access-title">
          <h3>{field.platform}</h3>
          <p>{field.what}</p>
          <div className="pr-tags">
            <span className="pr-prio" data-p={field.priority || "helpful"}>{field.priority === "key" ? "Most important" : "Helpful"}</span>
            <AnimatePresence>
              {status && (
                <motion.span key={status.label} className="pr-status" data-tone={status.tone} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  {!status.tone && <Check size={14} strokeWidth={3} />} {status.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <p className="pr-why"><Eye size={18} /><span>{field.why}</span></p>

      <div className="pr-seg" role="group" aria-label={`How to share ${field.platform}`} style={{ ["--n" as any]: options.length }}>
        {options.map((o) => (
          <button key={o.via} type="button" aria-pressed={v.via === o.via} onClick={() => pick(o.via)}>
            <o.icon size={20} /> {o.label}
          </button>
        ))}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {v.via && (
          <motion.div key={v.via} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: EASE }} style={{ overflow: "hidden" }}>
            <div className="pr-access-body">
              {v.via === "invite" && field.invite && (
                <>
                  <ol className="pr-steps-list">{field.invite.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                  <div className="pr-row">
                    <button type="button" className="pr-mini" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Copied" : `Copy ${contactEmail}`}</button>
                    {field.invite.url && <a className="pr-mini" href={field.invite.url} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Open {field.platform}</a>}
                  </div>
                  <button type="button" role="checkbox" aria-checked={!!v.done} className="pr-done-toggle" onClick={() => { track?.("access", field.platform, { via: "invite", done: !v.done }); set({ done: !v.done }); }}>
                    <span className="pr-tick" data-square="true">{v.done && <Check size={15} strokeWidth={3.5} color="#0d1a12" />}</span>
                    I sent the invite
                  </button>
                </>
              )}

              {v.via === "login" && (
                <>
                  <label className="pr-label" htmlFor={`${field.id}_u`}>{field.userLabel || "Email or username"}</label>
                  <input id={`${field.id}_u`} className="pr-input" autoComplete="off" autoCapitalize="none" spellCheck={false} value={v.user ?? ""} onChange={(e) => set({ user: e.target.value })} />
                  <label className="pr-label" htmlFor={`${field.id}_p`} style={{ marginTop: 18 }}>Password</label>
                  {v.pass_saved && !pw ? (
                    <div className="pr-saved-pw">
                      <Lock size={18} /> Saved and encrypted
                      <button type="button" onClick={() => { setPw(""); set({ pass_saved: false, pass_clear: true }); }}>Replace</button>
                    </div>
                  ) : (
                    <div className="pr-pw">
                      <input id={`${field.id}_p`} className="pr-input" type={show ? "text" : "password"} autoComplete="new-password" autoCapitalize="none" spellCheck={false}
                        value={pw} onChange={(e) => { setPw(e.target.value); const { pass_clear, ...rest } = v; onChange({ ...rest, pass: e.target.value }); }} />
                      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                  )}
                  {field.loginUrl && <div className="pr-row"><a className="pr-mini" href={field.loginUrl} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Where you sign in</a></div>}
                  <p className="pr-lock-note"><ShieldCheck size={17} /> Encrypted the moment it saves. Only NexaVision can see it, and you can change the password any time.</p>
                </>
              )}

              {(v.via === "call" || v.via === "unknown") && (
                <>
                  <label className="pr-label" htmlFor={`${field.id}_n`}>{v.via === "call" ? "Anything we should know before we call? (optional)" : "Who might have it? (optional)"}</label>
                  <textarea id={`${field.id}_n`} className="pr-input" value={v.note ?? ""} placeholder={v.via === "call" ? "e.g. call the restaurant line after 3 PM" : "e.g. the guy who built our website"} onChange={(e) => set({ note: e.target.value })} />
                  {v.via === "call" && <p className="pr-lock-note"><PhoneCall size={17} /> We'll reach you at the time you picked in step 1.</p>}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── review / send / thanks ──────────────────────────────────
function Review({ sections, answers, go, onSend, submitting, submittedAt }: {
  sections: Section[]; answers: Answers; go: (i: number) => void; onSend: () => void; submitting: boolean; submittedAt: string | null;
}) {
  const access = sections.flatMap((s) => s.fields.filter((f): f is AccessField => f.type === "access"));
  return (
    <section>
      <div className="pr-panel-head">
        <small>Last step</small>
        <h2>Review &amp; send</h2>
        <p>It's fine if some parts are empty. Send what you have, and you can add more later on this same link.</p>
      </div>
      <div className="pr-chips">
        {access.map((f) => {
          const v: AccessValue = answers[f.id] || {};
          const tone = (v.via === "invite" && v.done) || (v.via === "login" && v.pass_saved) ? "ok" : v.via === "call" ? "call" : undefined;
          const txt = v.via === "invite" ? (v.done ? "invited" : "will invite") : v.via === "login" ? "login" : v.via === "call" ? "call me" : v.via === "unknown" ? "not sure" : "skipped";
          return <span key={f.id} className="pr-chip" data-tone={tone}>{tone === "ok" && <Check size={14} />}{f.platform} · {txt}</span>;
        })}
      </div>
      <div className="pr-review-list">
        {sections.map((s, i) => {
          const p = sectionProgress(s, answers);
          return (
            <button key={s.id} type="button" className="pr-review-item" onClick={() => go(i)}>
              <span className="pr-dot" data-done={p.answered > 0}>{p.answered > 0 ? <Check size={15} strokeWidth={3} /> : i + 1}</span>
              <span>{s.title}</span>
              <small>{p.answered ? `${p.answered} of ${p.total}` : "Not started"}</small>
            </button>
          );
        })}
      </div>
      <div className="pr-send">
        <p>
          {submittedAt
            ? `You sent this on ${new Date(submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Send again any time you add something.`
            : "When you press send, we get a notice and start looking (read-only). We'll reach out within a day or two."}
        </p>
        <button type="button" className="pr-btn pr-btn-gold" onClick={onSend} disabled={submitting}>
          {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} {submittedAt ? "Send my updates" : "Send it to NexaVision"}
        </button>
      </div>
    </section>
  );
}

function Thanks({ onReview }: { onReview: () => void }) {
  const bits = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2;
    return { x: Math.cos(a) * (140 + (i % 5) * 30), y: Math.sin(a) * (110 + (i % 4) * 30) - 40, r: (i * 47) % 360, c: ["#edc488", "#c98a47", "#6fbf8a", "#e0583a", "#f4ecdf"][i % 5] };
  });
  return (
    <section className="pr-thanks">
      <div className="pr-burst" aria-hidden>
        {bits.map((b, i) => (
          <motion.i key={i} style={{ background: b.c }} initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }} animate={{ x: b.x, y: [0, b.y, b.y + 160], opacity: [1, 1, 0], rotate: b.r * 3 }} transition={{ duration: 2.2, ease: "easeOut", times: [0, 0.4, 1] }} />
        ))}
      </div>
      <motion.span className="pr-seal" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
        <Check size={54} strokeWidth={3} />
      </motion.span>
      <h2>Thank you. It's on its way.</h2>
      <p>We'll look everything over (read-only) and get back to you with a clear proposal. Think of something else? Come back to this same link and send again.</p>
      <div className="pr-row" style={{ justifyContent: "center", marginTop: 28 }}>
        <button type="button" className="pr-btn pr-btn-ghost" onClick={onReview}>Look over my answers</button>
        <a className="pr-btn pr-btn-ghost" href="mailto:admin@nexavisiongroup.com"><Mail size={18} /> Email us</a>
      </div>
    </section>
  );
}
