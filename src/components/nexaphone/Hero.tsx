"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { QUOTE_MAIL } from "./data";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tower = { id: string; x: number; y: number; s: number };
const TOWERS: Tower[] = [
  { id: "A", x: 58, y: 92, s: 0.8 },
  { id: "B", x: 132, y: 54, s: 0.62 },
  { id: "C", x: 214, y: 70, s: 1 },
  { id: "D", x: 292, y: 44, s: 0.55 },
  { id: "E", x: 350, y: 104, s: 0.86 },
];
const PHONE = { x: 200, y: 300 };

// Each cycle: which tower wins and what it delivers once held.
const SCENES = [
  { best: "C", mbps: 842, note: "Strongest tower, fastest band" },
  { best: "E", mbps: 611, note: "Busy tower skipped, clear one held" },
  { best: "A", mbps: 734, note: "Held through the walls" },
];

function TowerGlyph({ t, state }: { t: Tower; state: "idle" | "win" | "lose" }) {
  const h = 70 * t.s;
  const w = 26 * t.s;
  const color = state === "win" ? "var(--lock)" : "#8fa3b0";
  return (
    <g
      transform={`translate(${t.x} ${t.y})`}
      style={{ opacity: state === "lose" ? 0.35 : 1, transition: "opacity .6s" }}
    >
      <path
        d={`M0 ${-h} L${-w / 2} 0 M0 ${-h} L${w / 2} 0 M${-w * 0.32} ${-h * 0.35} H${w * 0.32} M${-w * 0.2} ${-h * 0.62} H${w * 0.2}`}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        style={{ transition: "stroke .6s" }}
      />
      <circle cy={-h - 3} r={2.6} fill="var(--beacon)" className="np-beacon-blink" />
      {state === "win" && (
        <>
          <motion.circle
            cy={-h * 0.7}
            r={10}
            fill="none"
            stroke="var(--lock)"
            strokeWidth={1.2}
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <text y={18} textAnchor="middle" fill="var(--lock)" fontSize={11} fontWeight={600}>
            Tower {t.id}
          </text>
        </>
      )}
    </g>
  );
}

function TowerLock() {
  const reduce = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [phase, setPhase] = useState<"scan" | "lock">(reduce ? "lock" : "scan");
  const speed = useMotionValue(0);
  const speedText = useTransform(speed, (v) => Math.round(v).toString());
  const cur = SCENES[scene];

  useEffect(() => {
    if (reduce) {
      speed.set(cur.mbps);
      return;
    }
    setPhase("scan");
    speed.set(0);
    const t1 = setTimeout(() => {
      setPhase("lock");
      animate(speed, cur.mbps, { duration: 1.4, ease: EASE });
    }, 2600);
    const t2 = setTimeout(() => setScene((s) => (s + 1) % SCENES.length), 8200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scene, reduce, cur.mbps, speed]);

  return (
    <motion.div
      className="np-lock"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.55, ease: EASE }}
    >
      <svg viewBox="0 0 400 340" role="img" aria-label="A phone scanning five nearby cell towers and locking onto the best one">
        {/* horizon */}
        <path d="M0 120 H400" stroke="rgba(255,255,255,.08)" />
        {[70, 130, 190].map((r) => (
          <circle key={r} cx={PHONE.x} cy={PHONE.y} r={r} fill="none" stroke="rgba(255,255,255,.05)" />
        ))}

        {/* links */}
        {TOWERS.map((t) => {
          const win = phase === "lock" && t.id === cur.best;
          const lose = phase === "lock" && t.id !== cur.best;
          const tipY = t.y - 70 * t.s * 0.7;
          return (
            <g key={`${scene}-${t.id}`}>
              <motion.line
                x1={PHONE.x}
                y1={PHONE.y - 34}
                x2={t.x}
                y2={tipY}
                stroke={win ? "var(--lock)" : "#8fa3b0"}
                strokeWidth={win ? 2.2 : 1}
                strokeDasharray={win ? "6 7" : "2 6"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: lose ? 0.08 : win ? 1 : [0.15, 0.7, 0.25],
                  strokeDashoffset: win ? [0, -26] : 0,
                }}
                transition={{
                  pathLength: { duration: 0.9, delay: TOWERS.indexOf(t) * 0.12 },
                  opacity: win || lose ? { duration: 0.5 } : { duration: 1.1, repeat: Infinity, delay: TOWERS.indexOf(t) * 0.18 },
                  strokeDashoffset: { duration: 0.8, repeat: Infinity, ease: "linear" },
                }}
              />
            </g>
          );
        })}

        {TOWERS.map((t) => (
          <TowerGlyph
            key={t.id}
            t={t}
            state={phase === "scan" ? "idle" : t.id === cur.best ? "win" : "lose"}
          />
        ))}

        {/* phone */}
        <g transform={`translate(${PHONE.x - 20} ${PHONE.y - 36})`}>
          <rect width={40} height={72} rx={8} fill="#0d1419" stroke="#cfd9df" strokeWidth={1.6} />
          <rect x={4} y={5} width={32} height={62} rx={5} fill={phase === "lock" ? "rgba(86,224,232,.18)" : "rgba(255,255,255,.05)"} style={{ transition: "fill .6s" }} />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={9 + i * 6}
              y={48 - i * 5}
              width={4}
              height={8 + i * 5}
              rx={1}
              fill={phase === "lock" || i < 2 ? "var(--lock)" : "rgba(255,255,255,.25)"}
              style={{ transition: `fill .4s ${i * 0.1}s` }}
            />
          ))}
        </g>
      </svg>

      <div className="np-lock-status" aria-live="polite">
        <div>
          <strong>{phase === "scan" ? "Scanning 5 towers" : `Locked on Tower ${cur.best}`}</strong>
          <div style={{ color: "var(--fog)", fontSize: 14 }}>
            {phase === "scan" ? "Comparing strength, band and load" : cur.note}
          </div>
        </div>
        <div className="np-lock-speed np-num">
          <motion.b>{speedText}</motion.b> Mbps
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="np-hero" id="top">
      <div className="np-hero-photo">
        <Image src="/nexaphone/stock/hero.jpg" alt="" fill priority sizes="100vw" />
      </div>
      <div className="np-wrap np-hero-grid">
        <div className="np-hero-copy">
          <motion.p
            className="np-hero-kicker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="np-live-dot" />
            Flagship phones, rebuilt for work
          </motion.p>
          <h1 className="np-display np-h1">
            {["Pick the tower.", "Keep the speed."].map((line, i) => (
              <span className="np-line" key={line}>
                <motion.span
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.14, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45, ease: EASE }}>
            <p className="np-lede">
              Nexa Pro finds the strongest cell tower around you, locks on, and holds it on the fastest
              connection that tower offers. Flagship hardware for people whose work can&apos;t drop.
            </p>
            <div className="np-hero-ctas">
              <a href="#lineup" className="np-btn np-btn-lock">See the lineup</a>
              <a href={QUOTE_MAIL} className="np-btn np-btn-ghost">Quote a fleet</a>
            </div>
          </motion.div>
        </div>
        <TowerLock />
      </div>
    </section>
  );
}
