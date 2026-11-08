"use client";

// Chaptered, animated proposal: the same warm look as the prospect check-up
// (.pr styles) so the customer recognises it as the next page of that story.
// Used when the proposal content carries the optional rich sections (isRich).

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown, ArrowRight, BadgeDollarSign, Bike, CalendarCheck, Check, Clock, Download, Gift, Loader2, Lock, MapPin,
  Search, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Star, Target, TrendingUp, TriangleAlert, Utensils, Wallet,
} from "lucide-react";
import { CountUp, EASE, Money, Rise, Words } from "@/components/prospect/motion";
import { Compare, PhoneShot } from "@/components/prospect/Briefing";
import {
  BUSINESS_NAME, CATEGORY, money, type BarRow, type Feature, type Finding, type ProposalPackage, type PublicProposal,
} from "@/lib/proposals/types";
import { SignaturePad, useOpenTracking, useSigning } from "./signing";

const ICONS: Record<string, React.ElementType> = {
  ShoppingBag, Bike, MapPin, Gift, Smartphone, TrendingUp, Sparkles, Search, BadgeDollarSign, Utensils, Clock, Star, ShieldCheck, Target,
};
const longDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const stamp = (d: string) => new Date(d).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

export function RichProposal({ proposal: p, token, preview = false, share = false, payError = false, from }: {
  proposal: PublicProposal; token: string; preview?: boolean; share?: boolean; payError?: boolean; from?: string;
}) {
  const c = p.content;
  const s = useSigning(p, token, preview);
  useOpenTracking(preview, token, from);
  const business = p.client_company || p.client_name || "you";
  const first = (p.client_name || "").trim().split(/\s+/)[0] || "";
  const kind = s.signed ? "Signed agreement" : "Proposal";
  const hero = c.hero || {};

  // chapters number themselves, whatever sections this proposal has
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <>
      <Hero hero={hero} business={business} kind={kind} number={p.number} />

      <div className="pr-wrap">
        {preview && (
          <p className="pr-preview-note"><TriangleAlert size={18} aria-hidden /> {share ? "This is a preview copy for review. Signing is turned off here; the link to sign arrives by email." : "You're previewing this as the customer will see it. Views here aren't counted, and signing is off."}</p>
        )}
        {s.signed && (
          <section className="pr-done" aria-label="Signing status">
            <h2><Check size={26} aria-hidden /> You&apos;re signed</h2>
            <p>{p.signed_name} signed this on {stamp(p.signed_at!)}. A signed copy went to {p.client_email || "your email"}.</p>
            {payError && <p className="pr-error" role="alert">We couldn&apos;t open the payment page just now. Try again in a minute, or reply to your signed-copy email.</p>}
            <div className="pr-ctas">
              {s.due > 0 && !p.paid_at && !preview && <a className="pr-btn pr-btn-gold" href={`/project/${token}/pay`}>Pay {money(s.due + s.fee)} <ArrowRight size={20} /></a>}
              <a className="pr-btn pr-btn-ghost" href={`/api/project/${token}/pdf`}><Download size={18} aria-hidden /> Download signed copy</a>
            </div>
            {s.due > 0 && p.paid_at && <p className="pr-paid"><Check size={18} aria-hidden /> Payment received on {longDate(p.paid_at)}. Thank you.</p>}
          </section>
        )}

        {!!c.facts?.length && (
          <div className="pr-facts">
            {c.facts.map((f, i) => (
              <Rise key={f.label} delay={i * 0.08} className="pr-fact">
                <b><CountUp value={f.value} /></b>
                <span>{f.label}</span>
              </Rise>
            ))}
          </div>
        )}

        {!!c.intro && (
          <Rise className="pr-letter">
            <p className="pr-chapter"><b>✦</b> A note {first ? `for ${first}` : "from us"}</p>
            {c.intro.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
            <p className="pr-letter-sign">{BUSINESS_NAME} <i>·</i> {CATEGORY}</p>
          </Rise>
        )}
      </div>

      {c.findings.length > 0 && (
        <section className="pr-section" id="found">
          <div className="pr-wrap">
            <div className="pr-section-head">
              <p className="pr-chapter"><b>{num()}</b> What we found</p>
              <Words text="Where the money goes today." className="pr-h2" />
              <Rise delay={0.15}>
                <p className="pr-lede">Everything here comes from your own accounts and reports, with your permission. Where a number is our estimate, we say so.</p>
              </Rise>
            </div>
            {c.findings.map((f, i) => <FindingBlock key={i} f={f} />)}
          </div>
        </section>
      )}

      {hero.seamImage && (
        <div className="pr-junction pr-junction-dark" aria-hidden>
          <Image src={hero.seamImage} alt="" fill sizes="100vw" />
          <span className="pr-junction-streak" />
        </div>
      )}

      {!!c.strengths?.length && (
        <section className="pr-section" id="good">
          <div className="pr-wrap">
            <div className="pr-section-head">
              <p className="pr-chapter"><b>{num()}</b> What&apos;s working</p>
              <Words text="The parts worth building on." className="pr-h2" />
            </div>
            <div className="pr-good">
              {c.strengths.map((f, i) => (
                <Rise key={i} delay={i * 0.1} className="pr-good-card">
                  {f.stat && <b><CountUp value={f.stat} /></b>}
                  {f.statLabel && <small>{f.statLabel}</small>}
                  <h3>{f.title}</h3>
                  <p>{f.detail}</p>
                </Rise>
              ))}
            </div>
          </div>
        </section>
      )}

      {c.comparison?.rows?.length ? (
        <section className="pr-section" id="vs">
          <div className="pr-wrap">
            <div className="pr-section-head">
              <p className="pr-chapter"><b>{num()}</b> Today and after</p>
              <Words text={c.comparison.heading || "One system instead of four."} className="pr-h2" />
            </div>
            <div className="pr-vs" role="table" aria-label="Today compared with after">
              <div className="pr-vs-head" role="row"><span role="columnheader" /><span role="columnheader">Today</span><span role="columnheader">With {BUSINESS_NAME}</span></div>
              {c.comparison.rows.map((r, i) => (
                <motion.div key={i} className="pr-vs-row" role="row" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }} transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}>
                  <b role="rowheader">{r.label}</b>
                  <span role="cell" className="pr-vs-today">{r.today}</span>
                  <span role="cell" className="pr-vs-after"><Check size={18} aria-hidden />{r.after}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {(c.features?.length || c.work.length || c.goals.length) ? (
        <section className="pr-section" id="build">
          <div className="pr-wrap">
            <div className="pr-section-head">
              <p className="pr-chapter"><b>{num()}</b> What we&apos;ll build and run</p>
              <Words text="Your website, your orders, your customers." className="pr-h2" />
            </div>
            {!!c.features?.length && (
              <div className="pr-grid">
                {c.features.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
              </div>
            )}
            {c.goals.length > 0 && (
              <Rise className="pr-goals">
                <p className="pr-chapter"><b>✦</b> What we&apos;re aiming for</p>
                <ul>
                  {c.goals.map((g, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: EASE }}>
                      <Target size={22} /><span>{g}</span>
                    </motion.li>
                  ))}
                </ul>
              </Rise>
            )}
            {c.work.length > 0 && (
              <div className="pr-work">
                {c.work.map((w, i) => (
                  <Rise key={i} delay={(i % 3) * 0.08} className="pr-work-card">
                    <h3>{w.area}</h3>
                    {w.detail && <p>{w.detail}</p>}
                    <ul>{w.items.map((it, k) => <li key={k}><Check size={17} aria-hidden />{it}</li>)}</ul>
                  </Rise>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {c.timeline.length > 0 && (
        <section className="pr-section" id="when" style={{ paddingTop: 0 }}>
          <div className="pr-wrap">
            <div className="pr-section-head">
              <p className="pr-chapter"><b>{num()}</b> How it goes</p>
              <Words text="Step by step, nothing all at once." className="pr-h2" />
            </div>
            <Timeline steps={c.timeline} />
          </div>
        </section>
      )}

      {/* ── paper section: price, payment, terms, signature ── */}
      <section className="pr-section pr-light pr-paper" id="price">
        <div className="pr-wrap">
          <div className="pr-section-head">
            <p className="pr-chapter"><b>{num()}</b> {s.signed ? "What you chose" : "The price"}</p>
            <Words text={s.signed ? "Your agreement." : c.packages.length > 1 ? "Choose the plan that fits." : "One plan. Everything included."} className="pr-h2" />
            {!s.signed && p.expires_at && <Rise delay={0.1}><p className="pr-lede">This price is good through {longDate(p.expires_at)}.</p></Rise>}
          </div>

          <div className="pr-plans" role={!s.signed && c.packages.length > 1 ? "radiogroup" : undefined} aria-label="Plans">
            {(s.signed && s.pkg ? [s.pkg] : c.packages).map((x) => {
              const on = x.id === s.pkgId;
              const choosable = !s.signed && c.packages.length > 1;
              const body = <PlanBody x={x} showBadge={choosable} />;
              return choosable
                ? <button key={x.id} type="button" role="radio" aria-checked={on} className={`pr-plan${on ? " is-on" : ""}`} onClick={() => s.setPkgId(x.id)}>{body}</button>
                : <div key={x.id} className="pr-plan is-on">{body}</div>;
            })}
          </div>

          {(s.due > 0 || c.payment.notes) && (
            <Rise className="pr-pay">
              <h3><Wallet size={22} aria-hidden /> Payment</h3>
              {s.due > 0 && (
                <dl>
                  <div><dt>Due at signing</dt><dd>{money(s.due)}</dd></div>
                  {s.fee > 0 && <div><dt>4% card fee</dt><dd>{money(s.fee)}</dd></div>}
                  {s.fee > 0 && <div className="is-total"><dt>Total at signing</dt><dd>{money(s.due + s.fee)}</dd></div>}
                </dl>
              )}
              {c.payment.notes && <p>{c.payment.notes}</p>}
            </Rise>
          )}

          {s.offerAutopay && (
            <Rise className="pr-autopay" delay={0.05}>
              <h3><CalendarCheck size={22} aria-hidden /> {c.payment.autopay?.title || "Automatic monthly billing"}</h3>
              <p>{c.payment.autopay?.text || "Your card is charged on the same day each month, so your service never pauses. Switch it off any time by emailing us."}</p>
              {s.signed ? (
                <p className="pr-autopay-chosen">
                  {p.autopay_opt_in ? <><Check size={18} aria-hidden /> You chose automatic monthly billing. We&apos;ll send a secure link to add your card.</> : <>You chose to pay each monthly invoice yourself.</>}
                </p>
              ) : (
                <div className="pr-choices" role="radiogroup" aria-label="Monthly billing">
                  <button type="button" role="radio" aria-checked={s.autopay === true} className="pr-choice-card" onClick={() => s.setAutopay(true)}>
                    <span className="pr-tick-ring" aria-hidden><Check size={16} /></span>
                    <span><b>Yes, bill my card automatically</b>{c.payment.autopay?.recommended && <em>Recommended</em>}<small>Secures your subscription to {BUSINESS_NAME}&apos;s services. Nothing to remember each month.</small></span>
                  </button>
                  <button type="button" role="radio" aria-checked={s.autopay === false} className="pr-choice-card" onClick={() => s.setAutopay(false)}>
                    <span className="pr-tick-ring" aria-hidden><Check size={16} /></span>
                    <span><b>I&apos;ll pay each invoice myself</b><small>We email an invoice each month and you pay it by card.</small></span>
                  </button>
                </div>
              )}
            </Rise>
          )}

          <Rise className="pr-terms">
            <h3><ShieldCheck size={22} aria-hidden /> The terms, in plain words</h3>
            <div>
              {c.terms.map((t, i) => (
                <details key={i} open={i === 0}>
                  <summary>{t.title}</summary>
                  <p>{t.text}</p>
                </details>
              ))}
            </div>
          </Rise>

          {s.signed ? (
            <Rise className="pr-signed" >
              <h3>Signature</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.signature_data && <img src={p.signature_data} alt={`Signature of ${p.signed_name}`} />}
              <p><b>{p.signed_name}</b>{p.signed_title ? `, ${p.signed_title}` : ""}</p>
              <p className="pr-fine">Signed {stamp(p.signed_at!)}. Locked version fingerprint: {p.signed_hash?.slice(0, 16)}</p>
            </Rise>
          ) : (
            <Rise className="pr-sign-wrap" delay={0.05}>
              <div className="pr-sign-head">
                <p className="pr-chapter"><b>{num()}</b> Agree and sign</p>
                <Words text={c.closing?.headline || "Ready when you are."} className="pr-h2" />
                {c.closing?.lead && <p className="pr-lede">{c.closing.lead}</p>}
              </div>
              <form className="pr-sign" onSubmit={s.sign} noValidate id="sign">
                <div className="pr-sign-fields">
                  <label>Your full name<input value={s.name} onChange={(e) => s.setName(e.target.value)} autoComplete="name" required /></label>
                  <label>Your title (optional)<input value={s.title} onChange={(e) => s.setTitle(e.target.value)} autoComplete="organization-title" placeholder="Owner" /></label>
                </div>
                <div>
                  <p className="pr-sign-label">Draw your signature</p>
                  <SignaturePad onChange={s.setSig} ink="#1d150e" className="pr-pad" clearClass="pr-clear" />
                </div>
                <label className="pr-agree">
                  <input type="checkbox" checked={s.agreed} onChange={(e) => s.setAgreed(e.target.checked)} />
                  <span>I have read this proposal and its terms, I can sign for {p.client_company || "this business"}, and I agree to sign electronically with {BUSINESS_NAME}.</span>
                </label>
                {s.err && <p className="pr-error" role="alert">{s.err}</p>}
                <button className="pr-btn pr-btn-gold pr-btn-wide" type="submit" disabled={s.busy}>
                  {s.busy ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <Lock size={18} aria-hidden />}
                  {s.busy ? "Saving your signature" : s.due > 0 ? `Sign, then pay ${money(s.due + s.fee)}` : "Sign proposal"}
                </button>
                <p className="pr-fine">Questions first? Email <a href="mailto:info@nexavisiongroup.com">info@nexavisiongroup.com</a> and we&apos;ll answer before you sign anything.</p>
              </form>
            </Rise>
          )}
        </div>
      </section>

      <footer className="pr-foot">
        <b>{BUSINESS_NAME}</b> <i>·</i> {CATEGORY} <i>·</i> {kind} {p.number} <i>·</i> <a href="mailto:info@nexavisiongroup.com">info@nexavisiongroup.com</a>
      </footer>
    </>
  );
}

// ── hero ────────────────────────────────────────────────────
function Hero({ hero, business, kind, number }: { hero: NonNullable<PublicProposal["content"]["hero"]>; business: string; kind: string; number: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const fade = useTransform(scrollYProgress, [0.45, 0.95], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const headline = hero.headline || `A plan for ${business}.`;
  return (
    <header className="pr-hero" ref={ref}>
      {hero.image && (
        <motion.div className="pr-hero-bg" style={{ y: bgY }}>
          <Image src={hero.image} alt="" fill priority sizes="100vw" />
        </motion.div>
      )}
      <div className="pr-hero-glow" />
      <div className="pr-mark">
        <span><strong>NexaVision</strong> Group<span className="pr-mark-eyebrow"><i>·</i>{hero.eyebrow || CATEGORY}</span></span>
        <span className="hidden sm:inline">{business}{hero.place && <><i>·</i>{hero.place}</>}</span>
      </div>
      <motion.div className="pr-wrap" style={{ y, opacity: fade }}>
        <motion.p className="pr-kicker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <span className="pr-live" /> {kind} {number} · prepared for {business}
        </motion.p>
        <h1 className="pr-h1" aria-label={`${headline} ${hero.accent || ""}`}>
          <Words text={headline} as="span" onMount delay={0.2} />
          {hero.accent && <><br /><Words text={hero.accent} as="span" className="pr-accent" onMount delay={0.6} /></>}
        </h1>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.1, ease: EASE }}>
          {hero.lead && <p className="pr-lede">{hero.lead}</p>}
          <div className="pr-ctas" style={hero.lead ? undefined : { marginTop: 30 }}>
            <a href="#found" className="pr-btn pr-btn-gold">Start reading <ArrowDown size={20} /></a>
            <a href="#price" className="pr-btn pr-btn-ghost">Skip to the price <ArrowRight size={20} /></a>
          </div>
        </motion.div>
      </motion.div>
      <span className="pr-cue" aria-hidden />
    </header>
  );
}

// ── one finding ─────────────────────────────────────────────
function FindingBlock({ f }: { f: Finding }) {
  const hasMedia = !!(f.image || f.compare?.length || f.bars?.length);
  return (
    <article className="pr-finding" data-tone={f.tone || "info"} data-solo={!hasMedia}>
      <div>
        {f.stat && (
          <Rise>
            <div className="pr-stat">
              <b><CountUp value={f.stat} /></b>
              {f.statLabel && <span>{f.statLabel}</span>}
            </div>
          </Rise>
        )}
        <Words text={f.title} as="h3" className="pr-h3" />
        <Rise delay={0.1}>
          {f.detail && <p>{f.detail}</p>}
          {f.body?.map((para, i) => <p key={i}>{para}</p>)}
          {f.fix && (
            <div className="pr-fix">
              <Sparkles size={22} />
              <small>What we&apos;d do</small>
              {f.fix}
            </div>
          )}
          {f.source && <p className="pr-source">{f.source}</p>}
        </Rise>
      </div>
      {hasMedia && (
        <div className="pr-finding-media">
          {f.image ? <PhoneShot src={f.image} alt={f.title} caption={f.caption} />
            : f.compare?.length ? <><Compare rows={f.compare} />{f.caption && <p className="pr-caption">{f.caption}</p>}</>
            : f.bars?.length ? <Bars rows={f.bars} caption={f.caption} /> : null}
        </div>
      )}
    </article>
  );
}

function Bars({ rows, caption }: { rows: BarRow[]; caption?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="pr-barcard">
      <div className="pr-bars">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="pr-bar-top"><span>{r.label}{r.note && <small> {r.note}</small>}</span><b><Money value={r.value} /></b></div>
            <div className="pr-bar">
              <motion.i style={{ background: "linear-gradient(90deg, var(--copper), var(--gold))" }} initial={{ scaleX: 0.02 }} whileInView={{ scaleX: Math.max(0.02, r.value / max) }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }} />
            </div>
          </div>
        ))}
      </div>
      {caption && <p className="pr-caption">{caption}</p>}
    </div>
  );
}

// ── feature card (static grid, no coverflow) ────────────────
function FeatureCard({ f, i }: { f: Feature; i: number }) {
  const Icon = ICONS[f.icon || ""] || Sparkles;
  return (
    <Rise delay={(i % 3) * 0.1} className="pr-card pr-card-static">
      {f.image && <div className="pr-card-img"><Image src={f.image} alt="" fill sizes="(max-width: 700px) 92vw, 380px" /></div>}
      <div className="pr-card-copy">
        <span className="pr-card-icon"><Icon size={22} /></span>
        <h3>{f.title}</h3>
        <p>{f.body}</p>
      </div>
    </Rise>
  );
}

// ── vertical timeline, line draws as you scroll ─────────────
function Timeline({ steps }: { steps: PublicProposal["content"]["timeline"] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  return (
    <ol className="pr-time" ref={ref}>
      <span className="pr-time-line" aria-hidden><motion.i style={{ scaleY: scrollYProgress }} /></span>
      {steps.map((t, i) => (
        <Rise key={i} delay={i * 0.08} className="pr-time-step">
          <span className="pr-step-n">{i + 1}</span>
          <div>
            <small>{t.when}</small>
            <h3>{t.label}</h3>
            {t.note && <p>{t.note}</p>}
          </div>
        </Rise>
      ))}
    </ol>
  );
}

// ── plan card ───────────────────────────────────────────────
function PlanBody({ x, showBadge }: { x: ProposalPackage; showBadge: boolean }) {
  const setup = Number(x.price) || 0;
  const steady = Number(x.monthly) || 0;
  const ramp = x.ramp?.filter((r) => Number(r.monthly) > 0) || [];
  return (
    <>
      <span className="pr-plan-head">
        <b>{x.name}</b>
        {x.recommended && showBadge && <em>Our recommendation</em>}
      </span>
      {x.description && <span className="pr-plan-text">{x.description}</span>}
      <span className="pr-plan-prices">
        {setup > 0 && <span className="pr-plan-price"><small>{x.setupLabel || "Setup"} · once</small><strong>{money(setup)}</strong></span>}
        {ramp.map((r) => <span key={r.label} className="pr-plan-price"><small>{r.label}</small><strong>{money(r.monthly)}<i>/mo</i></strong></span>)}
        {steady > 0 && <span className="pr-plan-price"><small>{ramp.length ? "After that" : "Monthly"}</small><strong>{money(steady)}<i>/mo</i></strong></span>}
        {x.percent && Number(x.percent.rate) > 0 && <span className="pr-plan-price pr-plan-pct"><small>Plus</small><strong>{x.percent.rate}%</strong><span>of {x.percent.of}</span></span>}
      </span>
      {x.includes.length > 0 && <span className="pr-plan-inc">{x.includes.map((it, k) => <span key={k}><Check size={17} aria-hidden />{it}</span>)}</span>}
    </>
  );
}
