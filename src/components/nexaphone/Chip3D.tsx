"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The flagship chip tile, rendered for real with the shared studio renderer.
 * Shows a typeset fallback until three.js arrives (and forever without WebGL).
 */
export default function Chip3D({ lines, className = "" }: { lines: [string, string, string]; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let stop = () => {};
    let cancelled = false;
    const near = new IntersectionObserver(
      ([x]) => {
        if (!x.isIntersecting) return;
        near.disconnect();
        import("./three/cardStage").then(({ mountChip }) => {
          if (cancelled) return;
          stop = mountChip(el, lines, () => setReady(true));
        });
      },
      { rootMargin: "400px" }
    );
    near.observe(el);
    return () => {
      cancelled = true;
      near.disconnect();
      stop();
    };
  }, [lines]);

  return (
    <div className={`np-chip ${className}`} data-ready={ready}>
      <div className="np-chip-flat" aria-hidden>
        <small>{lines[0]}</small>
        <b>{lines[1]}</b>
        <small>{lines[2]}</small>
      </div>
      <canvas ref={canvas} aria-label={`${lines[0]} ${lines[1]}`} />
    </div>
  );
}
