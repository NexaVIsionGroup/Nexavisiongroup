"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Minus, Plus, Lock } from "lucide-react";
import { ADDONS, CONDITION, EDITIONS, fromPrice, money, products, type Product } from "./catalog";
import { useCart } from "./cart";
import SignalField from "./SignalField";
import Scramble from "./Scramble";
import Title from "./Title";
import PhoneRender from "./PhoneRender";
import { versus } from "./versus";
import type { AnchorName, AnchorPos } from "./three/Viewer3D";

const Viewer3D = dynamic(() => import("./three/Viewer3D"), { ssr: false });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const GALLERY: Record<string, string[]> = {
  flagship: ["g-oneplus", "g-circuit-lens", "g-bokeh", "g-rugged"],
  fold: ["g-bokeh", "g-tunnel", "g-circuit-lens", "g-board"],
  turbo: ["g-tunnel", "g-board", "g-rugged", "g-welder"],
};

const buzz = (ms: number | number[]) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no haptics */
  }
};

/* ── HUD callouts that track points on the 3D model ── */
const HUD_SIDE: Record<AnchorName, "left" | "right"> = { camera: "right", chip: "left", battery: "right", signal: "left" };
const HUD_Y: Record<AnchorName, number> = { camera: 0.16, signal: 0.3, chip: 0.52, battery: 0.7 };
const HUD_LABEL: Record<AnchorName, string> = { camera: "Camera", chip: "Chip", battery: "Battery", signal: "Signal" };

function Hud({ p, anchors }: { p: Product; anchors: React.MutableRefObject<AnchorPos | null> }) {
  const svg = useRef<SVGSVGElement>(null);
  const boxes = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const a = anchors.current;
      const s = svg.current;
      if (!a || !s) return;
      const W = s.clientWidth;
      const H = s.clientHeight;
      (Object.keys(HUD_Y) as AnchorName[]).forEach((k) => {
        const box = boxes.current[k];
        const line = s.querySelector<SVGPolylineElement>(`[data-k="${k}"]`);
        const dot = s.querySelector<SVGCircleElement>(`[data-d="${k}"]`);
        if (!box || !line || !dot || !a[k]) return;
        const side = HUD_SIDE[k];
        const bx = side === "left" ? 12 + box.offsetWidth : W - 12 - box.offsetWidth;
        const by = H * HUD_Y[k] + 14;
        const elbow = side === "left" ? bx + 18 : bx - 18;
        line.setAttribute("points", `${bx},${by} ${elbow},${by} ${a[k].x},${a[k].y}`);
        dot.setAttribute("cx", String(a[k].x));
        dot.setAttribute("cy", String(a[k].y));
        const o = String(Math.max(0, Math.min(1, a[k].visible)));
        line.style.opacity = o;
        dot.style.opacity = o;
        box.style.opacity = String(0.35 + 0.65 * Number(o));
      });
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [anchors]);

  return (
    <div className="np-hud" aria-hidden>
      <svg ref={svg} className="np-hud-lines">
        {(Object.keys(HUD_Y) as AnchorName[]).map((k) => (
          <g key={k}>
            <polyline data-k={k} fill="none" stroke="var(--lock)" strokeWidth="1" strokeOpacity=".75" />
            <circle data-d={k} r="3.5" fill="var(--lock)" />
          </g>
        ))}
      </svg>
      {(Object.keys(HUD_Y) as AnchorName[]).map((k, i) => (
        <motion.div
          key={k}
          ref={(el) => {
            boxes.current[k] = el;
          }}
          className="np-hud-box"
          data-side={HUD_SIDE[k]}
          style={{ top: `${HUD_Y[k] * 100}%` }}
          initial={{ opacity: 0, x: HUD_SIDE[k] === "left" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 + i * 0.15, duration: 0.6, ease: EASE }}
        >
          <small>{HUD_LABEL[k]}</small>
          <span>{p.hud[k]}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Count-up stat ── */
function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => (value >= 1000 ? Math.round(v).toLocaleString() : v.toFixed(value % 1 ? 2 : 0)));
  useEffect(() => {
    if (inView) animate(mv, value, { duration: 1.6, ease: EASE });
  }, [inView, mv, value]);
  return (
    <div className="np-stat" ref={ref}>
      <div className="np-stat-v np-num">
        <motion.span>{text}</motion.span>
        <small>{suffix}</small>
      </div>
      <div className="np-stat-l">{label}</div>
    </div>
  );
}

function parseNum(s: string) {
  const m = s.replace(/,/g, "").match(/[\d.]+/);
  return m ? Number(m[0]) : 0;
}

/* ── Spec accordion ── */
function Specs({ p }: { p: Product }) {
  const [open, setOpen] = useState<string | null>(p.specs[0]?.title ?? null);
  return (
    <div className="np-acc">
      {p.specs.map((g) => {
        const on = open === g.title;
        return (
          <div key={g.title} className="np-acc-item" data-on={on}>
            <button className="np-acc-head" aria-expanded={on} onClick={() => setOpen(on ? null : g.title)}>
              <span>{g.title}</span>
              <ChevronDown size={20} />
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.dl
                  className="np-acc-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {g.rows.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </motion.dl>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function DevicePage({ slug }: { slug: string }) {
  const p = products.find((x) => x.slug === slug)!;
  const { add } = useCart();
  const [color, setColor] = useState(p.colors[0]);
  const [cfg, setCfg] = useState(p.configs[0]);
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [folded, setFolded] = useState(true);
  const anchors = useRef<AnchorPos | null>(null);
  const buyRef = useRef<HTMLElement>(null);
  const buyInView = useInView(buyRef, { margin: "0px 0px -30% 0px" });
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const on = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const unit = cfg.price + addons.reduce((s, id) => s + (ADDONS.find((a) => a.id === id)?.price ?? 0), 0);
  const total = unit * qty;
  const others = useMemo(() => products.filter((x) => x.slug !== slug), [slug]);
  const vs = useMemo(() => versus(p), [p]);
  const code = ({ n10: "NX-10", n11: "NX-11", n12: "NX-12", n13: "NX-13", n15: "NX-15", nfold: "NX-F1", nrm10: "NX-T10", nrm11: "NX-T11" } as Record<string, string>)[p.id];

  const addToCart = () =>
    add({ slug: p.slug, ram: cfg.ram, storage: cfg.storage, color: color.name, addons, qty });

  const pickColor = (c: typeof color) => {
    setColor(c);
    buzz(8);
  };

  return (
    <div className="np-device">
      {/* ── 3D hero ── */}
      <section className="np-dhero">
        <div className="np-dhero-bg" aria-hidden />
        <div className="np-wrap np-dhero-top">
          <Link href="/nexaphone#lineup" className="np-back">
            <ArrowLeft size={18} /> Lineup
          </Link>
          <span className="np-code np-num">{code}</span>
        </div>

        <div className="np-dhero-stage">
          <Viewer3D
            className="np-viewer"
            modelKey={p.id}
            island={p.render.island}
            fold={p.family === "fold"}
            folded={folded}
            swatch={color}
            label={p.name}
            onAnchors={(a) => (anchors.current = a)}
          />
          <Hud p={p} anchors={anchors} />
          <div className="np-drag-hint" aria-hidden>
            <span /> Drag to spin
          </div>
        </div>

        <div className="np-wrap np-dhero-copy">
          <p className="np-dhero-base">Built on {p.base} hardware</p>
          <h1 className="np-display np-dhero-title">
            <Scramble text={p.name} speed={34} />
          </h1>
          <p className="np-dhero-head">{p.headline}</p>

          <div className="np-swatches" role="radiogroup" aria-label="Color">
            {p.colors.map((c) => (
              <button
                key={c.name}
                role="radio"
                aria-checked={c.name === color.name}
                aria-label={c.name}
                className="np-swatch"
                data-finish={c.finish}
                style={{ "--sw": c.hex } as React.CSSProperties}
                onClick={() => pickColor(c)}
              />
            ))}
            <AnimatePresence mode="wait">
              <motion.span key={color.name} className="np-swatch-name" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                {color.name}
              </motion.span>
            </AnimatePresence>
          </div>

          {p.family === "fold" && (
            <button className="np-btn np-btn-ghost np-fold-btn" onClick={() => { setFolded((f) => !f); buzz(12); }}>
              {folded ? "Unfold it" : "Fold it"}
            </button>
          )}

          <div className="np-dhero-price">
            <span>From</span>
            <b className="np-num">{money(fromPrice(p))}</b>
            <a href="#buy" className="np-btn np-btn-lock np-shine">Configure yours</a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="np-dsec">
        <div className="np-wrap">
          <div className="np-stats">
            <Stat value={parseNum(p.perf.antutu)} suffix="M" label="AnTuTu score" />
            <Stat value={parseNum(p.battery)} suffix="mAh" label="Battery" />
            <Stat value={parseNum(p.display.match(/(\d+)Hz/)?.[1] ?? "120")} suffix="Hz" label="Refresh rate" />
            <Stat value={parseNum(p.perf.process)} suffix="nm" label="Chip process" />
          </div>
          <p className="np-lede np-dpitch">{p.pitch}</p>
        </div>
      </section>

      {/* ── Nexa vs Galaxy scoreboard ── */}
      <section className="np-dsec">
        <div className="np-wrap">
          <Title text={`What the ${vs.galaxy} can't do.`} className="np-display np-h2" style={{ maxWidth: "11em" }} />
          <p className="np-lede np-dpitch">
            Same flagship class as the {vs.galaxy}. The difference is control: Samsung locks its phones, so none of
            this is possible on a Galaxy.
          </p>
          <div className="np-score" role="table" aria-label={`${p.name} versus ${vs.galaxy}`}>
            <div className="np-score-head" role="row">
              <span role="columnheader" />
              <span role="columnheader" className="np-score-us">{p.name}</span>
              <span role="columnheader">{vs.galaxy}</span>
            </div>
            {vs.rows.map((r, i) => (
              <motion.div
                key={r.label}
                role="row"
                className="np-score-row"
                data-result={r.result}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.05, ease: EASE }}
              >
                <span role="rowheader">{r.label}</span>
                <span className="np-score-us">
                  {r.result === "win" ? <Check size={16} /> : <span className="np-score-tie">=</span>} {r.nexa}
                </span>
                <span className="np-score-them">{r.galaxy}</span>
              </motion.div>
            ))}
          </div>
          <p className="np-duel-note">
            Galaxy figures are US launch specs. Speed compared with Geekbench 6 multi-core scores from
            GSMArena reviews ({p.gb6.toLocaleString()} vs {p.galaxy.gb6.toLocaleString()}). {p.perf.cpu}, {p.perf.gpu}.
          </p>
        </div>
      </section>

      {/* ── Tower lock ── */}
      <section className="np-dsec np-dlock">
        <SignalField className="np-dlock-canvas" phoneY={0.82} />
        <div className="np-wrap np-dlock-copy">
          <Title text={p.bands.title} className="np-display np-h2" style={{ maxWidth: "10em" }} />
          <p className="np-lede">{p.bands.body}</p>
          <p className="np-lede">
            It runs the Nexa Signal Engine: we lock it to the exact tower and frequency that perform best at your
            location, and it stays there. No hopping onto dead towers, no full bars with no internet, no
            airplane-mode resets, and no connecting to towers you haven&apos;t approved.
          </p>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="np-dsec">
        <div className="np-wrap">
          <Title text="Up close." />
        </div>
        <div className="np-dgal">
          {GALLERY[p.family].map((g, i) => (
            <motion.figure
              key={g}
              className="np-dgal-item"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
            >
              <Image src={`/nexaphone/v2/${g}.jpg`} alt="" fill sizes="80vw" />
            </motion.figure>
          ))}
        </div>
        <div className="np-wrap">
          <p className="np-footnote">Shop photos of this model are on the way. Images shown are representative.</p>
        </div>
      </section>

      {/* ── Specs ── */}
      <section className="np-dsec">
        <div className="np-wrap">
          <Title text="Every spec." />
          <Specs p={p} />
        </div>
      </section>

      {/* ── Configurator ── */}
      <section className="np-dsec np-buy" id="buy" ref={buyRef}>
        <div className="np-wrap">
          <Title text={`Build your ${p.name}.`} style={{ maxWidth: "10em" }} />

          <div className="np-step-block">
            <h3>Memory and storage</h3>
            <div className="np-opts">
              {p.configs.map((c) => {
                const on = c === cfg;
                return (
                  <button key={c.storage} className="np-opt" aria-pressed={on} onClick={() => { setCfg(c); buzz(8); }}>
                    <span>
                      {c.ram}GB / {c.storage}
                    </span>
                    <b className="np-num">{money(c.price)}</b>
                    {on && <motion.span layoutId="opt-ring" className="np-opt-ring" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="np-step-block">
            <h3>Color</h3>
            <div className="np-opts np-opts-color">
              {p.colors.map((c) => (
                <button key={c.name} className="np-opt" aria-pressed={c.name === color.name} onClick={() => pickColor(c)}>
                  <span className="np-opt-sw" style={{ background: c.hex }} />
                  <span>{c.name}</span>
                  {c.name === color.name && <motion.span layoutId="color-ring" className="np-opt-ring" />}
                </button>
              ))}
            </div>
          </div>

          <div className="np-step-block">
            <h3>Condition</h3>
            <div className="np-opt np-opt-static" aria-pressed="true">
              <span>
                <Check size={16} /> {CONDITION.name}
              </span>
              <small>{CONDITION.body}</small>
            </div>
          </div>

          <div className="np-step-block">
            <h3>Edition</h3>
            <div className="np-opts">
              {EDITIONS.map((e) => (
                <div key={e.id} className="np-opt np-opt-static" aria-pressed={e.id === "pro"} data-disabled={!e.available}>
                  <span>
                    {e.available ? <Check size={16} /> : <Lock size={16} />} {e.name}
                    {!e.available && <em>Coming soon</em>}
                  </span>
                  <small>{e.body}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="np-step-block">
            <h3>Add-ons</h3>
            <div className="np-opts">
              {ADDONS.map((a) => {
                const on = addons.includes(a.id);
                return (
                  <button
                    key={a.id}
                    className="np-opt np-opt-addon"
                    aria-pressed={on}
                    onClick={() => {
                      setAddons((cur) => (on ? cur.filter((x) => x !== a.id) : [...cur, a.id]));
                      buzz(8);
                    }}
                  >
                    <span className="np-check" data-on={on}>
                      {on && <Check size={14} />}
                    </span>
                    <span>
                      {a.name}
                      <small>{a.body}</small>
                    </span>
                    <b className="np-num">+{money(a.price)}</b>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="np-step-block np-qty-block">
            <h3>Quantity</h3>
            <div className="np-qty np-qty-lg">
              <button aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={18} />
              </button>
              <span className="np-num">{qty}</span>
              <button aria-label="More" onClick={() => setQty((q) => Math.min(99, q + 1))}>
                <Plus size={18} />
              </button>
            </div>
            {qty >= 5 && <p className="np-fleet-note">Ordering 5 or more? We&apos;ll add fleet pricing and setup to your quote.</p>}
          </div>

          <div className="np-buy-total">
            <div>
              <span>Total</span>
              <AnimatePresence mode="popLayout">
                <motion.b key={total} className="np-num" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
                  {money(total)}
                </motion.b>
              </AnimatePresence>
            </div>
            <button className="np-btn np-btn-lock np-shine" onClick={addToCart}>
              Add to cart
            </button>
          </div>
          <p className="np-footnote">Free insured shipping. Like-new condition, tested in our shop. Prices shown are preview pricing.</p>
        </div>
      </section>

      {/* ── Compare ── */}
      <section className="np-dsec">
        <div className="np-wrap">
          <Title text="The rest of the lineup." />
          <div className="np-mini-rail">
            {others.map((o) => (
              <Link key={o.slug} href={`/nexaphone/phones/${o.slug}`} className="np-mini">
                <div className="np-mini-stage">
                  <PhoneRender d={o} />
                </div>
                <strong className="np-display">{o.name}</strong>
                <span>From {money(fromPrice(o))}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sticky buy bar ── */}
      <AnimatePresence>
        {pastHero && !buyInView && (
          <motion.div
            className="np-buybar"
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <div>
              <small>
                {cfg.ram}GB / {cfg.storage}, {color.name}
              </small>
              <b className="np-num">{money(total)}</b>
            </div>
            <button className="np-btn np-btn-lock" onClick={addToCart}>
              Add to cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
