"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GOODMAN } from "./data";

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
      <path d="M20 6 9 17l-5-5" stroke="var(--gd-cyan)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DualPath() {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-6 md:grid-cols-2">
      {GOODMAN.paths.map((p, i) => (
        <motion.a
          key={p.key}
          href="#contact"
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          whileHover={{ y: -6 }}
          className="group gd-shine relative flex min-h-[30rem] flex-col justify-end overflow-hidden rounded-3xl border border-[var(--gd-line)] p-8"
        >
          {/* image */}
          <div className="absolute inset-0 -z-10">
            <Image
              src={p.img}
              alt={p.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-55 transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,7,13,.30) 0%, rgba(5,7,13,.72) 58%, rgba(5,7,13,.96) 100%)" }} />
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(600px 400px at 50% 100%, rgba(58,214,255,.16), transparent 70%)" }} />
          </div>

          <span className="gd-stat-label text-[var(--gd-cyan)]">{p.kicker}</span>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{p.title}</h3>
          <p className="gd-muted mt-3 max-w-md text-sm leading-relaxed sm:text-base">{p.copy}</p>

          <ul className="mt-5 space-y-2">
            {p.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-[var(--gd-ice)]">
                <Check />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <span className="mt-7 inline-flex items-center gap-2 font-semibold text-[var(--gd-cyan)]">
            {p.cta}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </motion.a>
      ))}
    </div>
  );
}
