"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Bike, Check, ChevronLeft, ChevronRight, Eye, Gift, MapPin, ShieldCheck,
  ShoppingBag, Smartphone, Sparkles, TrendingUp, AlertCircle,
} from "lucide-react";
import type { Answers, Brief, BriefFinding } from "@/lib/questionnaires";
import { useCoverflow } from "@/components/nexaphone/useCoverflow";
import RailProgress from "@/components/nexaphone/RailProgress";
import { CountUp, EASE, Money, Rise, Words, useSeen } from "./motion";
import { useViewTracking, type TrackFn } from "./track";

const ICONS: Record<string, React.ElementType> = { ShoppingBag, Bike, MapPin, Gift, Smartphone, TrendingUp };

export default function Briefing({ brief, answers, progress, onStart, track }: {
  brief: Brief;
  answers: Answers;
  /** answered sections / total, for the "continue" button */
  progress: { done: number; total: number };
  onStart: () => void;
  track: TrackFn;
}) {
  useViewTracking(track, true);
  const name = String(answers.owner_first || "").trim();
  const started = progress.done > 0;
  const startLabel = started ? `Continue setup · ${progress.done} of ${progress.total} done` : "Let's get started";

  return (
    <>
      <Hero brief={brief} hello={name ? `Hi ${name}` : brief.hello} startLabel={startLabel} started={started} onStart={onStart} />

      <div className="pr-wrap">
        <div className="pr-facts" data-track="facts">
          {brief.facts.map((f, i) => (
            <Rise key={f.label} delay={i * 0.08} className="pr-fact">
              <b><CountUp value={f.value} /></b>
              <span>{f.label}</span>
            </Rise>
          ))}
        </div>
      </div>

      {brief.doors && <Doors doors={brief.doors} />}

      <section className="pr-section" id="found" data-track="found">
        <div className="pr-wrap">
          <div className="pr-section-head">
            <p className="pr-chapter"><b>01</b> What we found</p>
            <Words text="What a customer sees before they order." className="pr-h2" />
            <Rise delay={0.15}>
              <p className="pr-lede">
                All of this came from public information: your Google listing, your websites and the ordering pages your customers use. No logins, nothing touched.
              </p>
            </Rise>
          </div>
          {brief.findings.map((f) => <Finding key={f.id} f={f} />)}
        </div>
      </section>

      {brief.seamImage && (
        <div className="pr-junction" aria-hidden>
          <Image src={brief.seamImage} alt="" fill sizes="100vw" />
          <span className="pr-junction-streak" />
        </div>
      )}

      <Calculator brief={brief} track={track} />

      <Build brief={brief} track={track} />

      <section className="pr-section" style={{ paddingTop: 0 }}>
        <div className="pr-wrap">
          <Rise>
            <div className="pr-promise" data-track="promise">
              <Eye className="pr-promise-eye" strokeWidth={1} />
              <p className="pr-chapter"><b>04</b> Our promise</p>
              <Words text={brief.promise.title} className="pr-h2" />
              <ul className="pr-points">
                {brief.promise.points.map((p, i) => (
                  <motion.li key={p} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: EASE }}>
                    <ShieldCheck size={22} />
                    <span>{p}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Rise>

          <Steps steps={brief.steps} />

          <div className="pr-final" data-track="final">
            {brief.heroImage && <div className="pr-final-bg"><Image src={brief.heroImage} alt="" fill sizes="100vw" /></div>}
            <Words text="Ready when you are." className="pr-h2" />
            <Rise delay={0.1}>
              <p className="pr-lede">About 10 minutes. Everything saves as you go, so you can stop and come back to this same link any time.</p>
              <button type="button" className="pr-btn pr-btn-gold" onClick={onStart}>
                {startLabel} <ArrowRight size={20} />
              </button>
            </Rise>
          </div>
        </div>
      </section>

      <footer className="pr-foot">
        Prepared for {brief.business} by {brief.contact.name} from public information ·{" "}
        <a href={`mailto:${brief.contact.email}`}>{brief.contact.email}</a>
      </footer>
    </>
  );
}

// ── hero ────────────────────────────────────────────────────
function Hero({ brief, hello, startLabel, started, onStart }: { brief: Brief; hello: string; startLabel: string; started: boolean; onStart: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const fade = useTransform(scrollYProgress, [0.45, 0.95], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);

  return (
    <header className="pr-hero" ref={ref} data-track="hero">
      {brief.heroImage && (
        <motion.div className="pr-hero-bg" style={{ y: bgY }}>
          <Image src={brief.heroImage} alt="" fill priority sizes="100vw" />
        </motion.div>
      )}
      <div className="pr-hero-glow" />
      <div className="pr-mark">
        <span><strong>NexaVision</strong> Group</span>
        <span className="hidden sm:inline">{brief.business}<i>·</i>{brief.place}</span>
      </div>

      <motion.div className="pr-wrap" style={{ y, opacity: fade }}>
        <motion.p className="pr-kicker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <span className="pr-live" /> {hello}. This page was made for {brief.business}.
        </motion.p>
        <h1 className="pr-h1" aria-label={`${brief.headline} ${brief.headlineAccent || ""}`}>
          <Words text={brief.headline} as="span" onMount delay={0.2} />
          {brief.headlineAccent && (
            <>
              <br />
              <Words text={brief.headlineAccent} as="span" className="pr-accent" onMount delay={0.6} />
            </>
          )}
        </h1>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.1, ease: EASE }}>
          <p className="pr-lede">{brief.lead}</p>
          <div className="pr-ctas">
            <a href="#found" className="pr-btn pr-btn-gold">See what we found <ArrowDown size={20} /></a>
            <button type="button" className="pr-btn pr-btn-ghost" onClick={onStart}>{started ? startLabel : "Skip to setup"} <ArrowRight size={20} /></button>
          </div>
        </motion.div>
      </motion.div>
      <span className="pr-cue" aria-hidden />
    </header>
  );
}

// ── doors marquee ───────────────────────────────────────────
function Doors({ doors }: { doors: NonNullable<Brief["doors"]> }) {
  const list = [...doors.names, ...doors.names];
  return (
    <div className="pr-marquee-wrap">
      <div className="pr-marquee" aria-label={doors.names.join(", ")}>
        <div className="pr-marquee-track" aria-hidden>
          {list.map((n, i) => <span key={i} data-own={n === doors.own}>{n}</span>)}
        </div>
      </div>
      <p className="pr-marquee-cap pr-wrap">{doors.caption} <span style={{ color: "var(--gold)" }}>Gold</span> is the one you set up.</p>
    </div>
  );
}

// ── one finding ─────────────────────────────────────────────
function Finding({ f }: { f: BriefFinding }) {
  return (
    <article className="pr-finding" data-tone={f.tone || "info"} data-track={`finding:${f.id}`}>
      <div>
        <Rise>
          <div className="pr-stat">
            <b><CountUp value={f.stat} /></b>
            <span>{f.statLabel}</span>
          </div>
        </Rise>
        <Words text={f.title} as="h3" className="pr-h3" />
        <Rise delay={0.1}>
          {f.body.map((p, i) => <p key={i}>{p}</p>)}
          <div className="pr-fix">
            <Sparkles size={22} />
            <small>What we'd do</small>
            {f.fix}
          </div>
        </Rise>
      </div>
      <div className="pr-finding-media">
        {f.image ? <PhoneShot src={f.image.src} alt={f.image.alt} caption={f.image.caption} /> : f.compare ? <Compare rows={f.compare} /> : null}
      </div>
    </article>
  );
}

function PhoneShot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const screen = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const [fit, setFit] = useState<number | null>(null);
  const measure = (img: HTMLImageElement) => {
    const box = screen.current;
    if (!box) return;
    const ih = img.getBoundingClientRect().height;
    const extra = ih - box.getBoundingClientRect().height;
    // tall screenshot: scroll it slowly; short one: shrink the phone to fit
    setTravel(extra > 20 ? -extra : 0);
    setFit(extra < -20 ? ih : null);
  };
  return (
    <figure style={{ margin: 0 }}>
      <div ref={ref} className="pr-phone pr-reveal" data-in={seen} style={fit ? { aspectRatio: "auto", height: fit + 22 } : undefined}>
        <div className="pr-phone-screen" ref={screen}>
          <div className={travel ? "pr-phone-scroll" : undefined} style={{ ["--travel" as any]: `${travel}px` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} loading="lazy" onLoad={(e) => measure(e.currentTarget)} />
          </div>
        </div>
        <span className="pr-phone-glare" />
      </div>
      {caption && <figcaption className="pr-caption">{caption}</figcaption>}
    </figure>
  );
}

function Compare({ rows }: { rows: NonNullable<BriefFinding["compare"]> }) {
  return (
    <div className="pr-compare">
      {rows.map((r, i) => (
        <motion.div key={r.source} className="pr-compare-row" data-odd={!!r.odd}
          initial={{ opacity: 0, x: 40, rotate: 2 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: i * 0.15, ease: EASE }}>
          <div><small>{r.source}</small><b>{r.value}</b></div>
          {r.odd ? <AlertCircle size={24} color="#ffb59c" /> : <Check size={24} color="var(--leaf)" />}
        </motion.div>
      ))}
    </div>
  );
}

// ── savings calculator ─────────────────────────────────────
function Calculator({ brief, track }: { brief: Brief; track: TrackFn }) {
  const { resellerPct, appPct, note } = brief.calculator;
  const [site, setSite] = useState(2500);
  const [apps, setApps] = useState(1500);
  const [shift, setShift] = useState(30);
  const fee = site * (resellerPct / 100) * 52;
  const appSave = apps * (shift / 100) * (appPct / 100) * 52;
  const total = fee + appSave;
  // one "calc" event per pause in slider play, with the values they landed on
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) return;
    const t = setTimeout(() => track("calc", undefined, { site, apps, shift, total: Math.round(total) }), 1200);
    return () => clearTimeout(t);
  }, [site, apps, shift, total, track]);
  const mark = (set: (n: number) => void) => (n: number) => { touched.current = true; set(n); };
  const max = Math.max(1, fee, appSave);

  return (
    <section className="pr-section pr-light" id="money" data-track="money">
      <div className="pr-wrap">
        <div className="pr-section-head">
          <p className="pr-chapter"><b>02</b> What it costs you</p>
          <Words text="Slide in your numbers." className="pr-h2" />
          <Rise delay={0.1}><p className="pr-lede">Rough guesses are fine. Move the sliders and watch what stays in your pocket each year.</p></Rise>
        </div>
        <div className="pr-calc">
          <Rise className="pr-sliders">
            <Slider label="Weekly sales through “Order Online” on your website" value={site} set={mark(setSite)} min={0} max={10000} step={100} fmt={(v) => "$" + v.toLocaleString()} hint={`The ${resellerPct}% is charged on these.`} />
            <Slider label="Weekly sales on DoorDash, Uber Eats & Grubhub" value={apps} set={mark(setApps)} min={0} max={10000} step={100} fmt={(v) => "$" + v.toLocaleString()} hint={`Apps usually keep 15–30%. We use ${appPct}%.`} />
            <Slider label="App customers who'd order from you directly" value={shift} set={mark(setShift)} min={0} max={60} step={5} fmt={(v) => v + "%"} hint="Regulars who'd happily skip the app if your own site were easier." />
          </Rise>
          <Rise delay={0.1} className="pr-result">
            <small>You could keep about</small>
            <b className="pr-result-big"><Money value={total} /></b>
            <span className="pr-result-sub">a year · about <Money value={total / 12} /> a month</span>
            <div className="pr-bars">
              <Bar label={`${resellerPct}% reseller fee you'd stop paying`} value={fee} pct={fee / max} color="linear-gradient(90deg, var(--copper), var(--gold))" />
              <Bar label="App commission you'd keep" value={appSave} pct={appSave / max} color="linear-gradient(90deg, #b8361b, var(--chili))" />
            </div>
            <p className="pr-note">{note}</p>
          </Rise>
        </div>
      </div>
      <div className="pr-light-end" />
    </section>
  );
}

function Slider({ label, value, set, min, max, step, fmt, hint }: {
  label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; fmt: (n: number) => string; hint?: string;
}) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <div className="pr-slider">
      <label>
        <span>{label}</span>
        <output>{fmt(value)}</output>
      </label>
      {hint && <small>{hint}</small>}
      <input type="range" className="pr-range" aria-label={label} min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))} style={{ ["--p" as any]: `${p}%` }} />
    </div>
  );
}

function Bar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div>
      <div className="pr-bar-top"><span>{label}</span><b><Money value={value} /></b></div>
      <div className="pr-bar"><motion.i style={{ background: color }} animate={{ scaleX: Math.max(0.02, pct) }} transition={{ duration: 0.8, ease: EASE }} /></div>
    </div>
  );
}

// ── what we'd build: delivery zone + coverflow cards ────────
function Build({ brief, track }: { brief: Brief; track: TrackFn }) {
  const rail = useRef<HTMLDivElement>(null);
  useCoverflow(rail, ".pr-card");
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector<HTMLElement>(".pr-card");
    el?.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 18), behavior: "smooth" });
  };

  return (
    <section className="pr-section" id="build" data-track="build">
      <div className="pr-wrap">
        <div className="pr-build">
          <div>
            <p className="pr-chapter"><b>03</b> What we'd build</p>
            <Words text="Your kitchen, your drivers, your customers." className="pr-h2" />
            <Rise delay={0.1}>
              <p className="pr-lede" style={{ marginTop: 22 }}>
                You already have drivers. We'd give them a delivery zone you control: customers type their address, and if they're inside your circle they get your fee and your ETA. Outside it, they're offered pickup.
              </p>
            </Rise>
          </div>
          {brief.zone && <Zone zone={brief.zone} business={brief.business} track={track} />}
        </div>
      </div>

      <div className="pr-rail" ref={rail}>
        {brief.features.map((f) => {
          const Icon = ICONS[f.icon] || Sparkles;
          return (
            <article className="pr-card" key={f.title}>
              {f.image && <div className="pr-card-img" data-parallax><Image src={f.image} alt="" fill sizes="(max-width: 700px) 80vw, 360px" /></div>}
              <div className="pr-card-copy">
                <span className="pr-card-icon"><Icon size={22} /></span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </article>
          );
        })}
      </div>
      <RailProgress rail={rail} />
      <div className="pr-wrap">
        <div className="pr-rail-nav">
          <button type="button" aria-label="Previous" onClick={() => nudge(-1)}><ChevronLeft size={22} /></button>
          <button type="button" aria-label="Next" onClick={() => nudge(1)}><ChevronRight size={22} /></button>
        </div>
        {brief.proof && (
          <Rise>
            <div className="pr-proof">
              <p>{brief.proof.text}</p>
              {brief.proof.url && <a href={brief.proof.url} target="_blank" rel="noreferrer" onClick={() => track("view", "proof-link")}>{brief.proof.label || "Take a look"} <ArrowUpRight size={18} /></a>}
            </div>
          </Rise>
        )}
      </div>
    </section>
  );
}

function Zone({ zone, business, track }: { zone: NonNullable<Brief["zone"]>; business: string; track: TrackFn }) {
  const [r, setR] = useState(zone.defaultRadius);
  const maxR = Math.max(...zone.radii);
  const k = 84 / maxR; // svg units per mile
  const inside = zone.towns.filter((t) => Math.hypot(t.x, t.y) <= r);
  // a few made-up "orders" scattered through the zone, steady between renders
  const pings = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180;
    const d = maxR * Math.sqrt(((i * 0.618) % 1) * 0.92 + 0.04);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.55 + 0.6, delay: (i * 0.53) % 3.2 };
  }).filter((p) => p.y > -0.4), [maxR]);

  return (
    <Rise>
      <div className="pr-zone">
        <svg viewBox="-100 -100 200 200" role="img" aria-label={`Delivery zone of ${r} miles around ${business}. Towns inside: ${inside.map((t) => t.name).join(", ") || "none"}.`}>
          <defs>
            <radialGradient id="pz-glow"><stop offset="0%" stopColor="#edc488" stopOpacity="0.35" /><stop offset="100%" stopColor="#edc488" stopOpacity="0" /></radialGradient>
            <linearGradient id="pz-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#edc488" stopOpacity="0" /><stop offset="100%" stopColor="#edc488" stopOpacity="0.45" /></linearGradient>
            <pattern id="pz-water" width="12" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 Q3 0 6 3 T12 3" fill="none" stroke="#6aa6c9" strokeOpacity="0.35" strokeWidth="0.7" /></pattern>
            <clipPath id="pz-clip"><circle r="96" /></clipPath>
          </defs>
          <g clipPath="url(#pz-clip)">
            <circle r="96" fill="#140f0a" />
            {zone.water && <rect x="-100" y={1 * k} width="200" height="100" fill="url(#pz-water)" />}
            {zone.water && <rect x="-100" y={1 * k} width="200" height="100" fill="#2b5873" fillOpacity="0.18" />}
            {zone.radii.map((rr) => <circle key={rr} r={rr * k} fill="none" stroke="#edc488" strokeOpacity="0.16" strokeDasharray="2 3" />)}
            <motion.circle fill="url(#pz-glow)" initial={{ r: r * k }} animate={{ r: r * k }} transition={{ duration: 0.9, ease: EASE }} />
            <motion.circle fill="none" stroke="#edc488" strokeWidth="1.2" initial={{ r: r * k }} animate={{ r: r * k }} transition={{ duration: 0.9, ease: EASE }} />
            <g className="pr-zone-sweep" style={{ transformOrigin: "0px 0px" }}>
              <path d={`M0 0 L${r * k} 0 A${r * k} ${r * k} 0 0 0 ${r * k * Math.cos(-0.6)} ${r * k * Math.sin(-0.6)} Z`} fill="url(#pz-sweep)" />
            </g>
            {pings.filter((p) => Math.hypot(p.x, p.y) <= r).map((p, i) => (
              <circle key={i} cx={p.x * k} cy={-p.y * k} r="1.4" fill="#6fbf8a">
                <animate attributeName="r" values="1.2;4.5;1.2" dur="3.2s" begin={`${p.delay}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.15;1" dur="3.2s" begin={`${p.delay}s`} repeatCount="indefinite" />
              </circle>
            ))}
            {zone.water && <text x="0" y={1 * k + 24} textAnchor="middle" fill="#8fbcd6" fillOpacity="0.6" fontSize="6.5" fontStyle="italic" fontFamily="Georgia, serif">{zone.water}</text>}
          </g>
          {zone.towns.map((t) => {
            const on = Math.hypot(t.x, t.y) <= r;
            return (
              <g key={t.name} style={{ transition: "opacity .5s" }} opacity={on ? 1 : 0.4}>
                <circle cx={t.x * k} cy={-t.y * k} r="1.8" fill={on ? "#edc488" : "#8a7a66"} />
                <text x={t.x * k} y={-t.y * k - 4} textAnchor="middle" fontSize="5.6" fill={on ? "#f4ecdf" : "#9c8e7c"} fontFamily="system-ui, sans-serif">{t.name}</text>
              </g>
            );
          })}
          {zone.radii.map((rr) => (
            <text key={rr} x={rr * k * 0.707 + 2} y={-rr * k * 0.707 - 2} fontSize="5" fill="#edc488" fillOpacity="0.55" fontFamily="system-ui, sans-serif">{rr} mi</text>
          ))}
          <circle r="5" fill="#e0583a" />
          <circle r="5" fill="none" stroke="#e0583a">
            <animate attributeName="r" values="5;14" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <text y="13" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#f4ecdf" fontFamily="system-ui, sans-serif">{business}</text>
        </svg>
        <div className="pr-zone-tabs" role="group" aria-label="Delivery radius">
          {zone.radii.map((rr) => (
            <button key={rr} type="button" aria-pressed={r === rr} onClick={() => { setR(rr); track("zone", undefined, { radius: rr }); }}>{rr} miles</button>
          ))}
        </div>
        <p className="pr-zone-count">{inside.length ? `Covers ${inside.map((t) => t.name).join(", ")}.` : "Just the neighborhood."} Distances approximate.</p>
      </div>
    </Rise>
  );
}

// ── three steps, line draws as you scroll ───────────────────
function Steps({ steps }: { steps: Brief["steps"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  return (
    <div className="pr-steps" ref={ref}>
      <span className="pr-steps-line"><motion.i style={{ scaleX: scrollYProgress }} /></span>
      {steps.map((s, i) => (
        <Rise key={s.title} delay={i * 0.12} className="pr-step">
          <span className="pr-step-n">{i + 1}</span>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </Rise>
      ))}
    </div>
  );
}
