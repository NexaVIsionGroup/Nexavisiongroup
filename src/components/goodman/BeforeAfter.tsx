"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { GOODMAN } from "./data";

export default function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-3xl border border-[var(--gd-line)] sm:aspect-[2/1]"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => { setDragging(true); update(e.clientX); }}
      onPointerMove={(e) => dragging && update(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      {/* AFTER (base, right side) */}
      <Image src={GOODMAN.beforeAfter.after} alt="After detailing" fill sizes="100vw" className="object-cover" priority />
      <span className="absolute bottom-3 right-3 rounded-md bg-black/50 px-2 py-1 text-[0.65rem] font-semibold tracking-widest text-[var(--gd-cyan)] backdrop-blur">AFTER</span>

      {/* BEFORE (clipped to left of handle) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={GOODMAN.beforeAfter.before} alt="Before detailing" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10" />
        <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-[0.65rem] font-semibold tracking-widest text-white/80 backdrop-blur">BEFORE</span>
      </div>

      {/* handle */}
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-px bg-white/70 shadow-[0_0_16px_rgba(58,214,255,.7)]" />
        <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/40 backdrop-blur">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 7 4 12l5 5M15 7l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
