"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Mode = "everyday" | "nexa";

const EVERYDAY = [
  { title: "Low band", note: "Reaches far, moves slowly", on: true },
  { title: "Mid band", note: "Fast, but switched off to stop the bouncing", on: false },
  { title: "5G high speed", note: "Fastest, switched off with the rest", on: false },
  { title: "Tower choice", note: "Not available. The phone decides.", on: false },
];

const NEXA = [
  { title: "Tower A", note: "Close, but crowded", picked: false },
  { title: "Tower C", note: "Clear line, fastest band. Locked.", picked: true },
  { title: "Tower E", note: "Weak through the walls", picked: false },
  { title: "Every band", note: "Stays on. Nothing fast gets sacrificed.", picked: false },
];

const STEPS = [
  {
    title: "It looks at every tower",
    body: "Your Nexa Pro sees all the towers in range and what each one can really deliver, not just which is closest.",
  },
  {
    title: "You pick the best one",
    body: "Choose the tower with the fastest connection, or have your IT team set it once for the whole site.",
  },
  {
    title: "It holds on",
    body: "Through walls, crowds and rush hour, the phone stays on your tower instead of drifting to a weaker one.",
  },
];

function Meter({ mode }: { mode: Mode }) {
  const v = useMotionValue(38);
  const text = useTransform(v, (n) => Math.round(n).toString());
  const target = mode === "nexa" ? 842 : 38;
  useEffect(() => {
    const c = animate(v, target, { duration: 1.1, ease: EASE });
    return () => c.stop();
  }, [target, v]);
  return (
    <div className="np-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div className="np-meter-label">Download speed in the same spot</div>
        <div className="np-meter-value np-num">
          <motion.span>{text}</motion.span>
          <span style={{ fontSize: "0.35em", marginLeft: 8 }}>Mbps</span>
        </div>
        <div className="np-meter-track">
          <motion.div
            className="np-meter-fill"
            animate={{
              width: mode === "nexa" ? "92%" : "9%",
              background: mode === "nexa" ? "var(--lock-deep)" : "var(--weak)",
            }}
            transition={{ duration: 1.1, ease: EASE }}
          />
        </div>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
        {mode === "nexa"
          ? "Locked to the right tower, the phone keeps the fast bands that make modern networks quick."
          : "Band settings stop the phone from switching, but they leave it on the slowest band in range."}
      </p>
    </div>
  );
}

export default function SignalStory() {
  const [mode, setMode] = useState<Mode>("everyday");

  return (
    <section className="np-section np-light" id="signal">
      <div className="np-wrap">
        <h2 className="np-display np-h2" style={{ maxWidth: "11em" }}>
          Other phones turn the fast lanes off.
        </h2>
        <p className="np-lede" style={{ marginTop: 22 }}>
          When the signal at work is bad, most phones give you one fix: switch bands off in settings. That stops
          the phone from bouncing between towers, but it usually leaves you on the slow, long-range band,
          because that&apos;s the only one left. Nexa Pro fixes the real problem. It chooses the tower.
        </p>

        <div className="np-compare-toggle" role="group" aria-label="Compare">
          <motion.span
            className="np-compare-pill"
            animate={{ x: mode === "nexa" ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          />
          <button aria-pressed={mode === "everyday"} onClick={() => setMode("everyday")}>
            Everyday phone
          </button>
          <button aria-pressed={mode === "nexa"} onClick={() => setMode("nexa")}>
            Nexa Pro
          </button>
        </div>

        <div className="np-compare">
          <div className="np-panel">
            <div className="np-meter-label">
              {mode === "nexa" ? "What Nexa Pro controls" : "What band settings control"}
            </div>
            <div className="np-bands">
              {mode === "everyday"
                ? EVERYDAY.map((b, i) => (
                    <motion.div
                      key={`e-${b.title}`}
                      className="np-band"
                      data-off={!b.on}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: b.on ? 1 : 0.42, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.45, ease: EASE }}
                    >
                      <div>
                        {b.title}
                        <small>{b.note}</small>
                      </div>
                      <span className="np-switch" data-on={b.on} aria-label={b.on ? "On" : "Off"} />
                    </motion.div>
                  ))
                : NEXA.map((b, i) => (
                    <motion.div
                      key={`n-${b.title}`}
                      className="np-band"
                      data-picked={b.picked}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.45, ease: EASE }}
                    >
                      <div>
                        {b.title}
                        <small>{b.note}</small>
                      </div>
                      <span className="np-switch" data-on={b.picked || b.title === "Every band"} />
                    </motion.div>
                  ))}
            </div>
          </div>
          <Meter mode={mode} />
        </div>

        <ol className="np-steps">
          {STEPS.map((s, i) => (
            <li className="np-step" key={s.title} style={{ listStyle: "none" }}>
              <div className="np-step-n">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
        <p style={{ marginTop: 34, fontSize: 13, color: "var(--ink-soft)", maxWidth: "46em" }}>
          Speeds shown illustrate the difference and are not a guarantee. Real results depend on your carrier,
          location and plan.
        </p>
      </div>
    </section>
  );
}
