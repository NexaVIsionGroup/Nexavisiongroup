"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { QUOTE_MAIL } from "./data";
import SignalField, { SCENES, type FieldState } from "./SignalField";
import Scramble from "./Scramble";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const LABELS = ["A", "B", "C", "D", "E"];

function Readout({ state }: { state: FieldState }) {
  const speed = useMotionValue(0);
  const text = useTransform(speed, (v) => Math.round(v).toString());
  const scene = SCENES[state.scene];

  useEffect(() => {
    if (state.phase === "lock") {
      const c = animate(speed, scene.mbps, { duration: 1.4, ease: EASE });
      return () => c.stop();
    }
    speed.set(0);
  }, [state.phase, scene.mbps, speed]);

  const title =
    state.phase === "scan" ? "Scanning 5 towers" : state.phase === "rank" ? "Ranking every tower" : `Locked on Tower ${LABELS[state.best]}`;
  const sub =
    state.phase === "scan" ? "Strength, band and load" : state.phase === "rank" ? "Finding the fastest clear path" : scene.note;

  return (
    <div className="np-readout" aria-live="polite">
      <span className="np-readout-dot" data-phase={state.phase} />
      <div className="np-readout-text">
        <motion.strong key={title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          {title}
        </motion.strong>
        <span>{sub}</span>
      </div>
      <div className="np-readout-speed np-num">
        <motion.b>{text}</motion.b>
        <small>Mbps</small>
      </div>
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<FieldState>({ phase: "scan", best: 2, scene: 0 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.25]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const fade = useTransform(scrollYProgress, [0.5, 0.95], [1, 0]);

  return (
    <section className="np-hero" id="top" ref={ref}>
      <motion.div className="np-hero-photo" style={{ y: photoY, scale: photoScale }}>
        <Image src="/nexaphone/v2/hero.jpg" alt="" fill priority sizes="100vw" />
      </motion.div>

      <motion.div className="np-wrap np-hero-grid" style={{ y: copyY, opacity: fade }}>
        <div className="np-hero-copy">
          <motion.p
            className="np-hero-kicker"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="np-live-dot" />
            Flagship phones, rebuilt for work
          </motion.p>
          <h1 className="np-display np-h1">
            <span className="np-line">
              <Scramble text="Pick the tower." delay={0.15} />
            </span>
            <span className="np-line">
              <Scramble text="Keep the speed." delay={0.55} />
            </span>
          </h1>
        </div>

        <motion.div
          className="np-scene"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.35, ease: EASE }}
        >
          <SignalField className="np-scene-canvas" onState={setState} phoneY={0.68} />
          <Readout state={state} />
        </motion.div>

        <motion.div
          className="np-hero-foot"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
        >
          <p className="np-lede">
            No more full bars and no internet. No more airplane-mode roulette. Nexa Pro locks to the exact tower
            and frequency that perform best where you work, and never hops away.
          </p>
          <div className="np-hero-ctas">
            <a href="#lineup" className="np-btn np-btn-lock np-shine">See the lineup</a>
            <a href={QUOTE_MAIL} className="np-btn np-btn-ghost">Quote a fleet</a>
          </div>
        </motion.div>
      </motion.div>

      <motion.a
        href="#signal"
        className="np-scroll-cue"
        aria-label="Scroll to how it connects"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <span />
      </motion.a>
    </section>
  );
}
