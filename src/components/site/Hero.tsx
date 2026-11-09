"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ShoppingBag, FileSignature, FolderOpen, CreditCard, Star, Inbox, Package, Check } from "lucide-react";
import Scramble from "@/components/nexaphone/Scramble";
import { Rise } from "./Rise";
import { Phone } from "./Screens";
import { heroAlerts, marquee, CHECKUP_HREF, MOTTO, ONE_LINER } from "./content";

const ICONS: Record<string, typeof Inbox> = { Orders: ShoppingBag, Quotes: FileSignature, Drive: FolderOpen, Payments: CreditCard, Reviews: Star, Inbox, Store: Package };
const TONE: Record<string, React.CSSProperties> = {
  sun: { background: "#f4b740", color: "#0d1d1b" },
  pine: { background: "#0f5c55", color: "#fff" },
  ink: { background: "#0d1d1b", color: "#fff" },
};
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function LiveFeed() {
  const reduce = useReducedMotion();
  const [start, setStart] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStart((s) => (s + 1) % heroAlerts.length), 2400);
    return () => clearInterval(id);
  }, [reduce]);
  const shown = Array.from({ length: 4 }, (_, i) => {
    const idx = (start - i + heroAlerts.length * 2) % heroAlerts.length;
    return { ...heroAlerts[idx], key: `${idx}` };
  });
  const total = 1962 + start * 137;
  return (
    <>
      <div className="nxs-app-head">
        <small>Good evening</small>
        <h4>Your Business</h4>
        <div className="nxs-stats">
          <div><b className="nxs-num">${total.toLocaleString()}</b><small>Today</small></div>
          <div><b>{7 + start}</b><small>New leads</small></div>
          <div><b>2</b><small>To reply</small></div>
        </div>
      </div>
      <div className="nxs-app-body" style={{ height: 330, overflow: "hidden" }}>
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((a) => {
            const Icon = ICONS[a.app] ?? Inbox;
            return (
              <motion.div
                key={a.key}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: -26, scale: 0.94, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                className="nxs-row"
              >
                <span className="nxs-row-ico" style={TONE[a.tone]}><Icon size={16} /></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <strong>{a.title}</strong>
                  <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.detail}</span>
                </span>
                {a.amount && <span className="nxs-amt">{a.amount}</span>}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 });
  const chipX = useSpring(useTransform(px, [-0.5, 0.5], [-26, 26]), { stiffness: 90, damping: 20 });
  const chipY = useSpring(useTransform(py, [-0.5, 0.5], [-18, 18]), { stiffness: 90, damping: 20 });

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || reduce || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    px.set(x - 0.5);
    py.set(y - 0.5);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }

  return (
    <section ref={ref} className="nxs-hero nxs-dark" onPointerMove={onMove} onPointerLeave={() => { px.set(0); py.set(0); }}>
      <div className="nxs-aurora" aria-hidden><i /><i /><i /></div>
      <div className="nxs-gridlines" aria-hidden />
      <div className="nxs-spot" aria-hidden />
      <div className="nxs-grain" aria-hidden />

      <div className="nxs-wrap nxs-hero-grid">
        <div>
          <motion.p className="nxs-kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <span className="nxs-live" />
            <Scramble text={MOTTO} speed={34} />
          </motion.p>
          <h1 className="nxs-display nxs-h1">
            <Rise as="span" immediate text="We build it." className="nxs-line" delay={0.15} />
            <Rise as="span" immediate text="We run it." className="nxs-line" delay={0.3} />
            <Rise as="span" immediate text="You run your business." className="nxs-line nxs-grad-glow" delay={0.45} />
          </h1>
          <motion.p className="nxs-hero-sub" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.9, ease: EASE }}>
            {ONE_LINER} Your website and your own business app, plus Google, ads, email, DoorDash, Uber, logos and design, all handled by one team.
          </motion.p>
          <motion.div className="nxs-hero-ctas" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.05, ease: EASE }}>
            <Link href={CHECKUP_HREF} className="nxs-btn nxs-btn-glow">Get a free check-up</Link>
            <Link href="#work" className="nxs-btn nxs-btn-ghost">See our work</Link>
          </motion.div>
        </div>

        <motion.div
          className="nxs-scene"
          initial={{ opacity: 0, y: 60, rotateX: 18 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
          aria-label="Example business app showing live orders, quotes and payments"
          role="img"
        >
          <motion.div className="nxs-tilt" style={{ rotateX: rx, rotateY: ry }}>
            <Phone><LiveFeed /></Phone>
            <motion.div className="nxs-chip" style={{ x: chipX, y: chipY, top: 70, left: -110, translateZ: 80 }}>
              <span className="nxs-chip-ico" style={TONE.pine}><Check size={17} /></span>
              <span>Invoice paid<br /><b className="nxs-num">+$3,500</b></span>
            </motion.div>
            <motion.div className="nxs-chip" style={{ x: chipX, y: chipY, bottom: 120, right: -120, translateZ: 120 }}>
              <span className="nxs-chip-ico" style={TONE.sun}><Star size={17} fill="#0d1d1b" /></span>
              <span>New review<br /><b>5 stars</b></span>
            </motion.div>
            <motion.div className="nxs-chip" style={{ x: chipX, y: chipY, bottom: 10, left: -90, translateZ: 60 }}>
              <span className="nxs-chip-ico" style={TONE.ink}><FolderOpen size={17} /></span>
              <span>Drive<br /><b>12 photos added</b></span>
            </motion.div>
          </motion.div>
          <div className="nxs-floor" aria-hidden />
        </motion.div>
      </div>

      <div className="nxs-marquee" aria-hidden>
        <div className="nxs-marquee-track">
          {[...marquee, ...marquee].map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>
    </section>
  );
}
