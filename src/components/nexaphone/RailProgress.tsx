"use client";

import { useEffect, useState, type RefObject } from "react";

/** Thin progress bar under a horizontal rail: how far along the swipe you are. */
export default function RailProgress({ rail }: { rail: RefObject<HTMLElement> }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const on = () => setP(el.scrollWidth > el.clientWidth ? Math.min(1, (el.scrollLeft + el.clientWidth) / el.scrollWidth) : 1);
    on();
    el.addEventListener("scroll", on, { passive: true });
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", on);
      ro.disconnect();
    };
  }, [rail]);
  return (
    <div className="np-railbar" aria-hidden>
      <span style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
