"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "./catalog";
import type { Layer } from "./three/buildExploded";
import { t } from "./theme";

/**
 * "Inside" section: a sticky 3D stage whose phone pulls apart as the numbered
 * layer list scrolls past it. Progress and focus come from scroll position, so
 * it works with a thumb, not a timer.
 */
export default function Exploded3D({ p }: { p: Product }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const progress = useRef(0);
  const focus = useRef(-1);
  const [ready, setReady] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [active, setActive] = useState(-1);

  const spec = {
    display: p.display,
    glass: p.specs.find((g) => g.title === "Build")?.rows.find(([k]) => /glass|front/i.test(k))?.[1] ?? "Toughened glass",
    chip: p.chip,
    modem: (p.specs.find((g) => g.title === "Connectivity")?.rows.find(([k]) => k === "Modem")?.[1] ?? p.hud.signal).replace(/\s*modem$/i, ""),
    battery: p.battery,
    fan: p.family === "turbo",
    swatch: p.colors[0],
    island: p.render.island,
  };

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let stop = () => {};
    let cancelled = false;
    const near = new IntersectionObserver(
      ([x]) => {
        if (!x.isIntersecting) return;
        near.disconnect();
        import("./three/cardStage").then(({ mountExploded }) => {
          if (cancelled) return;
          stop = mountExploded(
            el,
            spec,
            () => progress.current,
            () => focus.current,
            (ls) => {
              setLayers(ls);
              setReady(true);
            }
          );
        });
      },
      { rootMargin: "500px" }
    );
    near.observe(el);
    return () => {
      cancelled = true;
      near.disconnect();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  // Scroll → explode progress + focused layer.
  useEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const onScroll = () => {
      const r = ol.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the list top reaches the lower half of the screen, 1 when its bottom passes the middle
      const pr = (vh * 0.78 - r.top) / (r.height + vh * 0.3);
      progress.current = Math.max(0, Math.min(1, pr));
      const items = [...ol.children] as HTMLElement[];
      let f = -1;
      items.forEach((li, i) => {
        const b = li.getBoundingClientRect();
        if (b.top < vh * 0.72 && b.bottom > vh * 0.28) f = i;
      });
      if (f !== focus.current) {
        focus.current = f;
        setActive(f);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [layers.length]);

  return (
    <div className="np-inside">
      <div className="np-inside-stage" data-ready={ready}>
        <canvas ref={canvas} aria-label={`${p.name} exploded view`} />
        <span className="np-inside-hint">Scroll to open it up</span>
      </div>
      <ol className="np-inside-list" ref={list}>
        {(layers.length ? layers : FALLBACK).map((l, i) => (
          <li key={l.id} data-active={i === active} data-hot={!!l.hot}>
            <span className="np-inside-n np-num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong>{l.title}</strong>
              <p>{l.id === "engine" ? t(`${l.body} This is the part that gets a phone out.`, l.body) : l.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Keeps the list (and the scroll height) stable before three.js arrives.
const FALLBACK: Layer[] = [
  { id: "glass", title: "Front glass", body: "" },
  { id: "display", title: "Display", body: "" },
  { id: "frame", title: "Frame", body: "" },
  { id: "engine", title: "Nexa Signal Engine", body: "", hot: true },
  { id: "chip", title: "Chip", body: "" },
  { id: "battery", title: "Battery", body: "" },
  { id: "back", title: "Back panel", body: "" },
];
