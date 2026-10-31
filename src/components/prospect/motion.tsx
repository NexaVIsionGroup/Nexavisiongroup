"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Headline whose words rise out of their own masks as it scrolls in. */
export function Words({ text, className, as = "h2", delay = 0, onMount = false }: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span";
  delay?: number;
  /** animate immediately instead of on scroll (hero) */
  onMount?: boolean;
}) {
  const Tag = motion[as] as typeof motion.h2;
  const words = text.split(" ");
  const trigger = onMount ? { animate: "shown" } : { whileInView: "shown", viewport: { once: true, margin: "0px 0px -10% 0px" } };
  return (
    <Tag className={className} aria-label={text} initial="hidden" {...trigger} transition={{ staggerChildren: 0.06, delayChildren: delay }}>
      {words.map((w, i) => (
        // the space sits outside the inline-block mask, or it collapses
        <Fragment key={i}>
          <span aria-hidden className="pr-word">
            <motion.span
              className="pr-word-in"
              variants={{ hidden: { y: "112%", rotate: 5 }, shown: { y: "0%", rotate: 0, transition: { duration: 1, ease: EASE } } }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Fade + rise on scroll. */
export function Rise({ children, delay = 0, className, y = 28 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** "4.7★", "599", "7%" → counts up from 0 when scrolled into view. */
export function CountUp({ value, duration = 1.6 }: { value: string; duration?: number }) {
  const m = value.match(/^([^0-9]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const target = m ? Number(m[2].replace(/,/g, "")) : 0;
  const decimals = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => (m ? `${m[1]}${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${m[3]}` : value));
  const ok = !!m;
  useEffect(() => {
    if (!inView || !ok) return;
    const c = animate(mv, target, { duration, ease: EASE });
    return () => c.stop();
  }, [inView, ok, mv, target, duration]);
  if (!m) return <span>{value}</span>;
  return <motion.span ref={ref} aria-label={value}>{text}</motion.span>;
}

/** Dollar figure that glides to each new value (calculator). */
export function Money({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => "$" + Math.round(v).toLocaleString("en-US"));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.8, ease: EASE });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/** data-in="true" once the element is on screen (for CSS clip-path reveals). */
export function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}
