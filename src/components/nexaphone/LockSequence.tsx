"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import SignalField from "./SignalField";

const STEPS = [
  {
    title: "We survey your site",
    body: "Your Nexa Pro sweeps every tower and channel in range and measures what each one really delivers where you work, not just which is closest.",
  },
  {
    title: "We lock the best one",
    body: "The fastest clear tower and channel rise to the top. We lock the phone to exactly that pair, or your IT team sets it once for the whole site.",
  },
  {
    title: "It holds on",
    body: "Through walls, crowds and rush hour it stays on your tower. It won't hop to a weaker tower, a dead one, or a fake one. No airplane mode, ever.",
  },
];

const buzz = (ms: number) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no haptics */
  }
};

export default function LockSequence() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Soften the scrub so fast flicks still read as a smooth sequence.
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const [step, setStep] = useState(0);

  useMotionValueEvent(progress, "change", (p) => {
    const s = p < 0.36 ? 0 : p < 0.6 ? 1 : 2;
    if (s !== step) {
      setStep(s);
      if (s === 2) buzz(18);
    }
  });

  const bar = useTransform(progress, [0, 0.85], ["0%", "100%"]);

  return (
    <section className="np-seq" ref={ref} aria-label="How Nexa Pro locks on">
      <div className="np-seq-sticky">
        <SignalField className="np-seq-canvas" mode="scrub" progress={progress} phoneY={0.9} />
        <div className="np-seq-top np-wrap">
          <div className="np-seq-steps" role="list">
            {STEPS.map((s, i) => (
              <span key={s.title} role="listitem" data-on={i <= step} />
            ))}
          </div>
          <motion.div className="np-seq-bar" style={{ width: bar }} />
        </div>
        <div className="np-seq-copy np-wrap">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <div className="np-seq-n np-display">{step + 1}</div>
            <h2 className="np-display np-h3">{STEPS[step].title}</h2>
            <p>{STEPS[step].body}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
