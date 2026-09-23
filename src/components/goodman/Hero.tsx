"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { GOODMAN } from "./data";

const rise = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const img = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      if (!img.current) return;
      gsap.to(img.current, {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Background image + brand wash */}
      <div ref={img} className="absolute inset-x-0 -top-[12%] -z-10 h-[124%]">
        <Image src="/goodman/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,7,13,.55) 0%, rgba(5,7,13,.30) 38%, rgba(5,7,13,.94) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(900px 520px at 80% 10%, rgba(47,123,255,.22), transparent 62%)" }} />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-32 md:pt-28">
        <motion.div custom={0} variants={rise} initial="hidden" animate="show">
          <span className="gd-chip"><span className="gd-chip-dot" />{GOODMAN.hero.eyebrow}</span>
        </motion.div>

        <h1 className="gd-shine mt-6 max-w-4xl text-[13vw] font-extrabold leading-[0.92] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          <motion.span className="block" custom={1} variants={rise} initial="hidden" animate="show">
            {GOODMAN.hero.title[0]}
          </motion.span>
          <motion.span
            className="block bg-gradient-to-r from-[var(--gd-cyan)] to-[var(--gd-blue)] bg-clip-text text-transparent"
            custom={2}
            variants={rise}
            initial="hidden"
            animate="show"
          >
            {GOODMAN.hero.title[1]}
          </motion.span>
        </h1>

        <motion.p custom={3} variants={rise} initial="hidden" animate="show" className="gd-muted mt-7 max-w-xl text-base leading-relaxed sm:text-lg">
          {GOODMAN.hero.sub}
        </motion.p>

        <motion.div custom={4} variants={rise} initial="hidden" animate="show" className="mt-9 flex flex-wrap gap-3">
          <a href="#contact" className="gd-cta">
            Book a Detail
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <a href="#paths" className="gd-cta-ghost">Request a Fleet Quote</a>
        </motion.div>

        <motion.div custom={5} variants={rise} initial="hidden" animate="show" className="mt-14 flex flex-wrap gap-x-10 gap-y-6">
          {GOODMAN.hero.stats.map((s) => (
            <div key={s.label}>
              <div className="gd-stat-value text-3xl sm:text-4xl">{s.value}</div>
              <div className="gd-stat-label mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* scroll cue */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
        <div className="flex h-10 w-6 justify-center rounded-full border border-[var(--gd-line-strong)] pt-2">
          <span className="h-2 w-1 rounded-full bg-[var(--gd-cyan)]" style={{ animation: "gd-scrollcue 1.8s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}
