"use client";

import { useEffect, type RefObject } from "react";

/**
 * 3D coverflow for a horizontal scroll-snap rail: cards tilt, shrink and
 * dim as they move away from the center. Writes transforms directly (no
 * React renders per frame). Only active while the rail actually scrolls
 * horizontally, so desktop grids are untouched.
 */
export function useCoverflow(rail: RefObject<HTMLElement>, selector: string, depth = 1) {
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;

    const apply = () => {
      raf = 0;
      const cards = el.querySelectorAll<HTMLElement>(selector);
      const scrollable = el.scrollWidth > el.clientWidth + 4 && getComputedStyle(el).overflowX !== "visible";
      const box = el.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      cards.forEach((c) => {
        if (!scrollable) {
          c.style.transform = "";
          c.style.opacity = "";
          return;
        }
        const r = c.getBoundingClientRect();
        const d = (r.left + r.width / 2 - mid) / box.width; // -1..1
        const a = Math.max(-1, Math.min(1, d));
        c.style.transform = `perspective(1000px) rotateY(${-a * 28 * depth}deg) scale(${1 - Math.abs(a) * 0.12 * depth}) translateZ(${-Math.abs(a) * 60 * depth}px)`;
        c.style.opacity = String(1 - Math.abs(a) * 0.45);
        const img = c.querySelector<HTMLElement>("[data-parallax]");
        if (img) img.style.transform = `translateX(${a * -14}%) scale(1.25)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const mo = new MutationObserver(onScroll);
    mo.observe(el, { childList: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mo.disconnect();
    };
  }, [rail, selector, depth]);
}
