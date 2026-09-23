"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "framer-motion";
import { Mark } from "./Nav";

const WORDS = ["Plant floors", "Warehouses", "Job sites", "Field service", "Venues", "Fleets", "Basements", "Rooftops"];

/** A band of words that drifts on its own and surges with scroll speed. */
function Row({ base, reverse = false }: { base: number; reverse?: boolean }) {
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(vel, [-2000, 0, 2000], [-6, 0, 6], { clamp: false });
  const dir = useRef(reverse ? -1 : 1);
  const tx = useTransform(x, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    const b = boost.get();
    if (b < 0) dir.current = reverse ? 1 : -1;
    else if (b > 0) dir.current = reverse ? -1 : 1;
    const move = dir.current * base * (delta / 1000) * (1 + Math.abs(b));
    x.set(x.get() - move);
  });

  return (
    <div className="np-marquee-row">
      <motion.div className="np-marquee-track" style={{ x: tx }}>
        {[0, 1].map((k) => (
          <span key={k} className="np-marquee-set" aria-hidden={k === 1}>
            {WORDS.map((w) => (
              <span key={w} className="np-marquee-item">
                {w}
                <Mark className="np-marquee-mark" />
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="np-marquee np-display" aria-label="Where Nexa Pro works">
      <Row base={3} />
      <Row base={2.2} reverse />
    </section>
  );
}
