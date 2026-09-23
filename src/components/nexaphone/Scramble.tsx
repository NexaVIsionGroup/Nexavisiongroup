"use client";

import { Fragment, useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/<>#%";

/**
 * Text that "decodes" in like a signal locking: random glyphs resolve
 * left to right into the real string. Width is reserved by the real text
 * so layout never jumps.
 */
export default function Scramble({
  text,
  delay = 0,
  speed = 28,
  className,
}: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}) {
  const [out, setOut] = useState(text);
  const started = useRef(false);
  const host = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  // Decode when it scrolls into view, not on mount.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let raf = 0;
    const chars = [...text];
    const t0 = performance.now() + delay * 1000;
    setOut(chars.map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
    const tick = (now: number) => {
      if (now < t0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      frame++;
      const resolved = Math.floor(((now - t0) / 1000) * speed);
      setOut(
        chars
          .map((c, i) => {
            if (c === " " || i < resolved) return c;
            return frame % 2 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : undefined;
          })
          .map((c, i) => c ?? chars[i])
          .join("")
      );
      if (resolved < chars.length) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, delay, speed]);

  // Per word, so a scrambled glyph can never change where lines wrap.
  const words = text.split(" ");
  const outWords = out.split(" ");
  return (
    <span ref={host} className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <Fragment key={i}>
          <span aria-hidden style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
            <span style={{ visibility: "hidden" }}>{w}</span>
            <span style={{ position: "absolute", left: 0, top: 0 }}>{outWords[i] ?? w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
