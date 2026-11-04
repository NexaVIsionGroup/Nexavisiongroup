"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, animate } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { Rise } from "./Rise";
import { Phone, SCREENS } from "./Screens";
import { juggling, appStory, extras, work, audiences, steps, pricing, carePlans, appWall, CHECKUP_HREF } from "./content";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ─────────── Front door: items get struck through as you scroll ─────────── */
function StrikeItem({ text, progress, i, n }: { text: string; progress: MotionValue<number>; i: number; n: number }) {
  const start = 0.15 + (i / n) * 0.45;
  const scaleX = useTransform(progress, [start, start + 0.08], [0, 1]);
  const opacity = useTransform(progress, [start, start + 0.08], [1, 0.45]);
  return (
    <motion.li style={{ opacity }}>
      {text}
      <motion.span className="nxs-strike" style={{ scaleX }} aria-hidden />
    </motion.li>
  );
}

export function FrontDoor() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const oneScale = useTransform(scrollYProgress, [0.55, 0.68], [0.85, 1]);
  const oneOpacity = useTransform(scrollYProgress, [0.55, 0.68], [0, 1]);
  return (
    <section className="nxs-section nxs-light">
      <div ref={ref} className="nxs-wrap nxs-door">
        <div>
          <Rise text="Most websites stop at the front door." className="nxs-display nxs-h2 nxs-grad" />
          <p className="nxs-lede" style={{ marginTop: 24 }}>
            Most web designers hand you a nice-looking page and walk away. You&rsquo;re left juggling everything behind it.
          </p>
          <p className="nxs-lede" style={{ marginTop: 16, color: "var(--ink)" }}>
            We build the website and everything behind it: one app that runs your business, made just for you.
          </p>
        </div>
        <div>
          <ul className="nxs-juggle" aria-label="What owners usually juggle">
            {juggling.map((j, i) => <StrikeItem key={j} text={j} progress={scrollYProgress} i={i} n={juggling.length} />)}
          </ul>
          <motion.p className="nxs-display nxs-one" style={{ scale: oneScale, opacity: oneOpacity, transformOrigin: "left center", color: "var(--pine)", display: "flex", alignItems: "center", gap: 14 }}>
            <Check size={44} strokeWidth={3} aria-hidden /> One app, all yours.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

/* ─────────── App story: the phone stays pinned, its screen changes per step ─────────── */
function StoryStep({ i, onActive, active, children }: { i: number; onActive: (i: number) => void; active: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => { if (inView) onActive(i); }, [inView, i, onActive]);
  return <div ref={ref} className="nxs-story-step" data-active={active}>{children}</div>;
}

export function AppStory() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const Screen = SCREENS[appStory[active].screen];
  return (
    <section id="app" className="nxs-section nxs-dark" style={{ scrollMarginTop: 60 }}>
      <div className="nxs-wrap">
        <Rise text="Everything behind the front door." className="nxs-display nxs-h2 nxs-grad" />
        <p className="nxs-lede" style={{ marginTop: 22 }}>
          Your business app is made for you and only you. Pick the features you need. Every one of these is already running for a real client.
        </p>

        <div ref={ref} className="nxs-story" style={{ marginTop: 30 }}>
          <div style={{ position: "relative" }}>
            <div className="nxs-progress" aria-hidden style={{ display: "none" }} />
            {appStory.map((s, i) => {
              const S = SCREENS[s.screen];
              return (
                <StoryStep key={s.screen} i={i} active={active === i} onActive={setActive}>
                  <span className="nxs-kicker"><span className="nxs-live" />{String(i + 1).padStart(2, "0")} of {appStory.length}</span>
                  <h3 className="nxs-display">{s.title}</h3>
                  <p>{s.text}</p>
                  <p className="nxs-story-who">Running for <b>{s.who}</b></p>
                  <div className="nxs-story-mobile" aria-hidden><Phone><S /></Phone></div>
                </StoryStep>
              );
            })}
          </div>
          <div className="nxs-story-sticky" aria-hidden>
            <div style={{ position: "relative", perspective: 1400 }}>
              <motion.div style={{ position: "absolute", left: -40, top: 0, bottom: 0, width: 2, background: "var(--hair)" }}>
                <motion.i style={{ position: "absolute", inset: 0, scaleY: bar, transformOrigin: "top", background: "linear-gradient(var(--glow), var(--sun))", boxShadow: "0 0 14px var(--glow)" }} />
              </motion.div>
              <Phone>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(8px)", scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: -18, filter: "blur(8px)" }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <Screen />
                  </motion.div>
                </AnimatePresence>
              </Phone>
              <div className="nxs-floor" />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <Link href="/business-app" className="nxs-btn nxs-btn-glow">Take the full tour</Link>
        </div>
        <div className="nxs-extras">
          {extras.map((e) => (
            <div key={e.title}>
              <Plus size={22} aria-hidden />
              <span><h4>{e.title}</h4><p>{e.text}</p></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Work: pinned horizontal gallery with tilt + shine ─────────── */
function TiltCard({ w, i }: { w: (typeof work)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 8}deg) translateZ(10px)`;
    el.style.setProperty("--sx", `${x * 100}%`);
    el.style.setProperty("--sy", `${y * 100}%`);
  }
  function leave() { if (ref.current) ref.current.style.transform = ""; }
  const host = w.url.replace(/^https?:\/\//, "");
  return (
    <article className="nxs-card">
      <a href={w.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${w.name} (opens in a new tab)`}>
        <div ref={ref} className="nxs-card-inner" onPointerMove={move} onPointerLeave={leave}>
          <div className="nxs-browser">
            <div className="nxs-browser-bar"><i /><i /><i /><span className="nxs-browser-url">{host}</span></div>
            <Image src={w.img} alt={`${w.name} website`} width={1440} height={900} sizes="(min-width: 1024px) 720px, 86vw" style={{ width: "100%", height: "auto", display: "block" }} priority={i < 2} />
          </div>
          <span className="nxs-card-shine" />
        </div>
      </a>
      <div className="nxs-card-meta">
        <small>{w.kind}</small>
        <h3 className="nxs-display">{w.name}</h3>
        <p>{w.text}</p>
      </div>
    </article>
  );
}

export function Work() {
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const measure = () => {
      const d = window.innerWidth >= 1024;
      setDesktop(d);
      if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const { scrollYProgress } = useScroll({ target: pin, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (p) => -p * dist);
  const [n, setN] = useState(1);
  useEffect(() => scrollYProgress.on("change", (p) => setN(Math.min(work.length, 1 + Math.floor(p * work.length)))), [scrollYProgress]);

  return (
    <section id="work" className="nxs-light" style={{ scrollMarginTop: 0 }}>
      <div className="nxs-wrap" style={{ paddingTop: "clamp(80px, 10vw, 130px)" }}>
        <Rise text="Real businesses, running on what we built." className="nxs-display nxs-h2 nxs-grad" />
        <p className="nxs-lede" style={{ marginTop: 22 }}>From a restaurant&rsquo;s online ordering to a construction company&rsquo;s entire operation.</p>
      </div>
      <div ref={pin} className="nxs-work-pin" style={{ height: desktop ? `calc(100vh + ${dist}px)` : "auto" }}>
        <div className="nxs-work-sticky">
          <motion.div ref={track} className="nxs-work-track" style={{ x: desktop ? x : 0 }}>
            {work.map((w, i) => <TiltCard key={w.name} w={w} i={i} />)}
          </motion.div>
          <div className="nxs-work-bar" aria-hidden><motion.i style={{ scaleX: scrollYProgress }} /></div>
          <span className="nxs-work-count" aria-hidden>{String(n).padStart(2, "0")} / {String(work.length).padStart(2, "0")}</span>
        </div>
      </div>
      <div style={{ height: "clamp(60px, 8vw, 110px)" }} />
    </section>
  );
}

/* ─────────── Who we help + how it works (scroll-drawn line) ─────────── */
export function WhoAndHow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 100, damping: 22 });
  return (
    <section id="who" className="nxs-section nxs-dark" style={{ scrollMarginTop: 60 }}>
      <div className="nxs-wrap">
        <Rise text="Built for the way you work." className="nxs-display nxs-h2 nxs-grad" />
        <p className="nxs-lede" style={{ marginTop: 22 }}>If you serve customers, we can build what runs behind it.</p>
        <div className="nxs-who">
          {audiences.map((a, i) => (
            <motion.div
              key={a.title}
              className="nxs-who-row"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
            >
              <h3 className="nxs-display">{a.title}</h3>
              <p>{a.text}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: "clamp(90px, 12vw, 150px)" }}>
          <Rise text="Three steps. We handle the hard part." className="nxs-display nxs-h2 nxs-grad" />
          <div ref={ref} className="nxs-steps">
            <div className="nxs-steps-line" aria-hidden><motion.i style={{ scaleY: line }} /></div>
            {steps.map((s, i) => (
              <motion.div key={s.title} className="nxs-step" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15% 0px" }} transition={{ duration: 0.8, ease: EASE }}>
                <span className="nxs-step-dot">{i + 1}</span>
                <h3 className="nxs-display">{s.title}</h3>
                <p>{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Pricing with counting numbers ─────────── */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const target = Number(value.replace(/[^0-9]/g, ""));
  const mv = useMotionValue(0);
  const [out, setOut] = useState(value);
  useEffect(() => {
    if (!target || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = animate(mv, target, { duration: 1.4, ease: EASE, onUpdate: (v) => setOut(`$${Math.round(v).toLocaleString()}`) });
    return () => c.stop();
  }, [inView, target, mv]);
  return <span ref={ref}>{out}</span>;
}

export function Pricing({ heading = true }: { heading?: boolean }) {
  return (
    <section id="pricing" className="nxs-section nxs-light" style={{ scrollMarginTop: 60 }}>
      <div className="nxs-wrap">
        {heading && (
          <>
            <Rise text="Simple starting prices." className="nxs-display nxs-h2 nxs-grad" />
            <p className="nxs-lede" style={{ marginTop: 22 }}>Every business is different, so you get your exact price in writing before we start. No surprises.</p>
          </>
        )}
        <div className="nxs-prices">
          {pricing.map((p, i) => (
            <motion.div
              key={p.name}
              className="nxs-price"
              data-featured={!!p.featured}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
            >
              <h3>{p.name}</h3>
              <small>{p.note || " "}</small>
              <span className="nxs-big nxs-num">{p.price.startsWith("$") ? <CountUp value={p.price} /> : p.price}</span>
              <p>{p.text}</p>
              <Link href={`${CHECKUP_HREF}?plan=${encodeURIComponent(p.name)}`} className={`nxs-btn ${p.featured ? "nxs-btn-glow" : "nxs-btn-ink"}`}>
                {p.price === "Let's talk" ? "Talk to us" : "Free check-up"}
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="nxs-care">
          {carePlans.map((c) => (
            <div key={c.name}>
              <b>{c.name}</b>
              <span className="nxs-num">{c.price}<small style={{ fontSize: 15, color: "var(--soft)", fontWeight: 400 }}>/month</small></span>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Closer with a magnetic button ─────────── */
export function Closer() {
  const btn = useRef<HTMLAnchorElement>(null);
  const mx = useSpring(0, { stiffness: 200, damping: 15 });
  const my = useSpring(0, { stiffness: 200, damping: 15 });
  function move(e: React.PointerEvent) {
    const el = btn.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 220) { mx.set(dx * 0.3); my.set(dy * 0.3); } else { mx.set(0); my.set(0); }
  }
  return (
    <section className="nxs-closer nxs-dark" onPointerMove={move} onPointerLeave={() => { mx.set(0); my.set(0); }}>
      <div className="nxs-aurora" aria-hidden><i /><i /><i /></div>
      <div className="nxs-grain" aria-hidden />
      <div className="nxs-wrap" style={{ position: "relative", zIndex: 1 }}>
        <Rise text="Let's see what your business is missing." className="nxs-display nxs-grad-glow" as="h2" />
        <p>Get a free check-up of your website and online presence. We&rsquo;ll show you exactly what we&rsquo;d fix, with no cost and no obligation.</p>
        <motion.span style={{ display: "inline-block", x: mx, y: my }}>
          <Link ref={btn} href={CHECKUP_HREF} className="nxs-btn nxs-btn-glow">Get my free check-up</Link>
        </motion.span>
      </div>
    </section>
  );
}

/* ─────────── App wall: real (blurred) admin apps on tilted columns that drift with scroll ─────────── */
function WallColumn({ items, y }: { items: (typeof appWall)[number]; y: MotionValue<string> }) {
  return (
    <motion.div className="nxs-wall-col" style={{ y }}>
      {[...items, ...items].map((it, i) => (
        <figure key={i} className="nxs-wall-item">
          <Image src={it.src} alt={i < items.length ? `${it.label} (customer details blurred)` : ""} width={1200} height={750} sizes="(min-width: 1024px) 420px, 45vw" />
          <figcaption>{it.label}</figcaption>
        </figure>
      ))}
    </motion.div>
  );
}

export function AppWall() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const up = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const down = useTransform(scrollYProgress, [0, 1], ["-38%", "0%"]);
  const up2 = useTransform(scrollYProgress, [0, 1], ["-8%", "-46%"]);
  return (
    <section ref={ref} className="nxs-dark nxs-wall" aria-labelledby="wall-h">
      <div className="nxs-wrap nxs-wall-copy">
        <Rise text="Not mockups. Real apps, running real businesses." className="nxs-display nxs-h2 nxs-grad" />
        <p className="nxs-lede" style={{ marginTop: 22 }} id="wall-h">
          These are live admin apps we built for our clients. Customer names, emails and numbers are blurred to protect their privacy.
        </p>
      </div>
      <div className="nxs-wall-stage" aria-hidden>
        <div className="nxs-wall-grid">
          <WallColumn items={appWall[0]} y={up} />
          <WallColumn items={appWall[1]} y={down} />
          <WallColumn items={appWall[2]} y={up2} />
        </div>
      </div>
    </section>
  );
}
