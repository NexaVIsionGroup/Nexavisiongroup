"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "./catalog";
import PhoneRender from "./PhoneRender";

/**
 * A shop card's phone: the flat illustration first (instant, and the fallback
 * without WebGL), swapped for a spinning 3D model once the card nears the
 * viewport. three.js only loads at that point, so the first screen stays light.
 */
export default function Card3D({ p }: { p: Product }) {
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
        import("./three/cardStage").then(({ mountCard }) => {
          if (cancelled) return;
          stop = mountCard(
            el,
            { id: p.id, island: p.render.island, fold: p.family === "fold", swatch: p.colors[0], label: p.name },
            () => setReady(true)
          );
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
  }, [p]);

  return (
    <span className="np-card3d" data-ready={ready}>
      <PhoneRender d={p} />
      <canvas ref={canvas} aria-hidden />
    </span>
  );
}
