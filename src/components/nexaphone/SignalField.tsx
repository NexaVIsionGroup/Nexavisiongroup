"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

/**
 * Canvas "signal field": a phone sweeping for towers, ranking them and
 * locking onto the best one. Runs on its own clock (auto) or is scrubbed
 * by scroll progress (scrub). Pauses when offscreen or the tab is hidden.
 */

export type FieldPhase = "scan" | "rank" | "lock";
export type FieldState = { phase: FieldPhase; best: number; scene: number };

type Tower = { x: number; y: number; h: number; label: string };

const TOWERS: Tower[] = [
  { x: 0.12, y: 0.4, h: 0.15, label: "A" },
  { x: 0.31, y: 0.27, h: 0.11, label: "B" },
  { x: 0.52, y: 0.33, h: 0.19, label: "C" },
  { x: 0.72, y: 0.22, h: 0.1, label: "D" },
  { x: 0.89, y: 0.43, h: 0.16, label: "E" },
];

// Strength of each tower per scene; the max wins.
export const SCENES = [
  { s: [0.55, 0.3, 0.95, 0.2, 0.6], mbps: 842, note: "Strongest tower, fastest band" },
  { s: [0.5, 0.35, 0.4, 0.25, 0.9], mbps: 611, note: "Busy tower skipped, clear one held" },
  { s: [0.92, 0.28, 0.5, 0.3, 0.45], mbps: 734, note: "Held through the walls" },
];
export const bestOf = (scene: number) => {
  const s = SCENES[scene].s;
  return s.indexOf(Math.max(...s));
};

const CYAN = "86,224,232";
const STEEL = "143,163,176";
const AMBER = "217,154,62";
const BEACON = "255,74,61";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

type Frame = {
  sweep: number; // radians, NaN = off
  rank: number; // 0..1
  lock: number; // 0..1
  scene: number;
};

export default function SignalField({
  mode = "auto",
  progress,
  onState,
  className,
  phoneY = 0.86,
}: {
  mode?: "auto" | "scrub";
  progress?: MotionValue<number>;
  onState?: (s: FieldState) => void;
  className?: string;
  phoneY?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef(onState);
  cb.current = onState;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    const start = performance.now();
    const pings = new Map<number, number>(); // tower -> ping start (s)
    let lastSweep = NaN;
    let lastKey = "";

    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.55,
      r: Math.random() * 1.2 + 0.2,
      p: Math.random() * Math.PI * 2,
    }));
    // packets along the locked beam
    const packets = Array.from({ length: 16 }, (_, i) => ({ o: i / 16, v: 0.35 + Math.random() * 0.3 }));

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);

    const P = () => ({ x: W * 0.5, y: H * phoneY });
    const towerTip = (t: Tower) => ({ x: t.x * W, y: t.y * H - t.h * H * 0.7 });
    const angleTo = (t: Tower) => {
      const p = P();
      const tip = towerTip(t);
      return Math.atan2(tip.y - p.y, tip.x - p.x);
    };

    const frameAt = (sec: number): Frame => {
      if (mode === "scrub") {
        const p = clamp(progress?.get() ?? 0);
        const scan = clamp(p / 0.36);
        return {
          sweep: p < 0.4 ? Math.PI + scan * Math.PI * 1.02 : NaN,
          rank: ease((p - 0.36) / 0.24),
          lock: ease((p - 0.6) / 0.25),
          scene: 0,
        };
      }
      if (reduce) return { sweep: NaN, rank: 1, lock: 1, scene: 0 };
      const CYCLE = 9.5;
      const scene = Math.floor(sec / CYCLE) % SCENES.length;
      const t = sec % CYCLE;
      return {
        sweep: t < 3 ? Math.PI + ((t / 1.5) % 1) * Math.PI * 1.02 : NaN,
        rank: ease((t - 3) / 0.9),
        lock: ease((t - 4) / 0.9),
        scene,
      };
    };

    function drawTower(t: Tower, i: number, win: boolean, dim: number, sec: number) {
      const x = t.x * W;
      const y = t.y * H;
      const h = t.h * H;
      const w = h * 0.36;
      const col = win ? CYAN : STEEL;
      ctx.save();
      ctx.globalAlpha = dim;
      ctx.strokeStyle = `rgba(${col},${win ? 1 : 0.8})`;
      ctx.lineWidth = win ? 1.8 : 1.3;
      ctx.lineCap = "round";
      if (win) {
        ctx.shadowColor = `rgba(${CYAN},.9)`;
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x - w / 2, y);
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + w / 2, y);
      // lattice
      for (let k = 1; k <= 4; k++) {
        const yy = y - h + (h * k) / 5;
        const half = (w / 2) * (k / 5);
        ctx.moveTo(x - half, yy);
        ctx.lineTo(x + half, yy);
        if (k < 4) {
          const yn = y - h + (h * (k + 1)) / 5;
          const hn = (w / 2) * ((k + 1) / 5);
          ctx.moveTo(x - half, yy);
          ctx.lineTo(x + hn, yn);
        }
      }
      ctx.stroke();
      // antennas
      ctx.beginPath();
      ctx.moveTo(x - w * 0.18, y - h * 0.86);
      ctx.lineTo(x - w * 0.18, y - h * 0.7);
      ctx.moveTo(x + w * 0.18, y - h * 0.86);
      ctx.lineTo(x + w * 0.18, y - h * 0.7);
      ctx.stroke();
      ctx.restore();
      // beacon
      const blink = Math.sin(sec * 3.2 + i * 1.7) > -0.2 ? 1 : 0.2;
      ctx.fillStyle = `rgba(${BEACON},${blink * dim})`;
      ctx.shadowColor = `rgba(${BEACON},.9)`;
      ctx.shadowBlur = 10 * blink;
      ctx.beginPath();
      ctx.arc(x, y - h - 4, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function tick(now: number) {
      raf = 0;
      if (!visible || document.hidden) return;
      const sec = Math.max(0, (now - start) / 1000);
      const f = frameAt(sec);
      const best = bestOf(f.scene);
      const strengths = SCENES[f.scene].s;
      const p = P();

      const phase: FieldPhase = f.lock > 0.02 ? "lock" : f.rank > 0.02 ? "rank" : "scan";
      const key = `${phase}-${f.scene}`;
      if (key !== lastKey) {
        lastKey = key;
        cb.current?.({ phase, best, scene: f.scene });
        if (phase === "scan") pings.clear();
      }

      ctx.clearRect(0, 0, W, H);

      // stars
      for (const s of stars) {
        const a = 0.25 + 0.35 * Math.sin(sec * 1.3 + s.p);
        ctx.fillStyle = `rgba(207,217,223,${a})`;
        ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
      }

      // radar rings
      const R = Math.hypot(W, H);
      ctx.lineWidth = 1;
      for (let k = 1; k <= 6; k++) {
        const r = (k / 6) * R * 0.75;
        ctx.strokeStyle = `rgba(255,255,255,${0.05 - k * 0.005})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      // outgoing pulse rings from the phone
      if (phase !== "lock" || mode === "auto") {
        for (let k = 0; k < 3; k++) {
          const q = ((sec * 0.45 + k / 3) % 1);
          ctx.strokeStyle = `rgba(${CYAN},${(1 - q) * (phase === "lock" ? 0.08 : 0.22)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, q * R * 0.7, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
      }

      // sweep wedge
      if (!Number.isNaN(f.sweep)) {
        const a = f.sweep;
        const wedge = 0.6;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 0.8);
        g.addColorStop(0, `rgba(${CYAN},.22)`);
        g.addColorStop(1, `rgba(${CYAN},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, R * 0.8, a - wedge, a);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(${CYAN},.75)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R);
        ctx.stroke();
        // pings as the sweep crosses a tower
        TOWERS.forEach((t, i) => {
          let ta = angleTo(t);
          if (ta < 0) ta += Math.PI * 2;
          const prev = Number.isNaN(lastSweep) ? a - 0.01 : lastSweep;
          if (prev <= ta && ta <= a) pings.set(i, sec);
        });
      }
      lastSweep = f.sweep;

      // scan lines
      TOWERS.forEach((t, i) => {
        const tip = towerTip(t);
        const win = i === best;
        const fade = win ? 1 : 1 - f.lock * 0.85;
        if (f.lock < 1 || !win) {
          const flick = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(sec * 7 + i * 1.3));
          ctx.setLineDash([2, 6]);
          ctx.lineDashOffset = -sec * 20;
          ctx.strokeStyle = `rgba(${STEEL},${flick * fade * (win ? 1 - f.lock : 1)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 28);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // towers + pings + rank bars
      TOWERS.forEach((t, i) => {
        const win = i === best && f.lock > 0.05;
        const dim = i === best ? 1 : 1 - f.lock * 0.62;
        drawTower(t, i, win, dim, sec);

        const ps = pings.get(i);
        if (ps !== undefined) {
          const q = (sec - ps) / 1.1;
          if (q < 1 || mode === "scrub") {
            const qq = mode === "scrub" ? 0.35 : q;
            ctx.strokeStyle = `rgba(${CYAN},${(1 - qq) * 0.8})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(t.x * W, t.y * H - t.h * H * 0.6, 6 + qq * 26, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        if (f.rank > 0) {
          const bw = Math.max(26, W * 0.07);
          const bx = t.x * W - bw / 2;
          const by = t.y * H + 10;
          const s = strengths[i];
          const isBest = i === best;
          ctx.globalAlpha = f.rank * dim;
          ctx.fillStyle = "rgba(255,255,255,.1)";
          ctx.fillRect(bx, by, bw, 4);
          ctx.fillStyle = isBest ? `rgb(${CYAN})` : s > 0.45 ? `rgb(${AMBER})` : `rgb(${STEEL})`;
          ctx.fillRect(bx, by, bw * s * f.rank, 4);
          ctx.font = `600 ${Math.max(10, W * 0.026)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = isBest && f.lock > 0.05 ? `rgb(${CYAN})` : "rgba(207,217,223,.85)";
          ctx.fillText(`Tower ${t.label}`, t.x * W, by + 18);
          ctx.globalAlpha = 1;
        }
      });

      // locked beam
      if (f.lock > 0) {
        const t = TOWERS[best];
        const tip = towerTip(t);
        const sx = p.x;
        const sy = p.y - 28;
        const ex = sx + (tip.x - sx) * f.lock;
        const ey = sy + (tip.y - sy) * f.lock;
        ctx.save();
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(${CYAN},.25)`;
        ctx.lineWidth = 10;
        ctx.shadowColor = `rgba(${CYAN},1)`;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${CYAN},1)`;
        ctx.lineWidth = 2.2;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        // data packets streaming tower -> phone
        if (f.lock >= 0.98) {
          for (const k of packets) {
            const q = ((sec * k.v + k.o) % 1);
            const x = tip.x + (sx - tip.x) * q;
            const y = tip.y + (sy - tip.y) * q;
            ctx.fillStyle = `rgba(230,255,255,${0.9 * Math.sin(q * Math.PI)})`;
            ctx.shadowColor = `rgba(${CYAN},1)`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x, y, 1.9, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          // halo rings on the winner
          for (let k = 0; k < 2; k++) {
            const q = ((sec * 0.6 + k / 2) % 1);
            ctx.strokeStyle = `rgba(${CYAN},${(1 - q) * 0.6})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 8 + q * 40, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // phone
      const pw = Math.max(34, W * 0.085);
      const ph = pw * 1.9;
      const px = p.x - pw / 2;
      const py = p.y - 28;
      ctx.save();
      if (f.lock > 0.5) {
        ctx.shadowColor = `rgba(${CYAN},${f.lock * 0.8})`;
        ctx.shadowBlur = 30 * f.lock;
      }
      ctx.fillStyle = "#0d1419";
      ctx.strokeStyle = "#cfd9df";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, pw * 0.2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = `rgba(${CYAN},${0.06 + f.lock * 0.16})`;
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 5, pw - 8, ph - 10, pw * 0.13);
      ctx.fill();
      for (let k = 0; k < 4; k++) {
        const on = f.lock > 0.5 ? true : (Math.floor(sec * 4) % 5) > k;
        const bh = (ph * 0.1) + k * ph * 0.06;
        ctx.fillStyle = on ? `rgb(${CYAN})` : "rgba(255,255,255,.2)";
        ctx.fillRect(px + pw * 0.22 + k * pw * 0.16, py + ph * 0.72 - bh, pw * 0.1, bh);
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    const onVis = () => {
      if (!document.hidden && !raf) raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mode, progress, phoneY]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
