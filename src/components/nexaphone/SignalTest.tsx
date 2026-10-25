"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Title from "./Title";
import { t } from "./theme";

// The "lab result" card. Numbers are an illustrative example (every site's towers
// differ) and the card says so; the shape of the story is what's true: ordinary
// phones hop to whatever band looks strongest, usually a slower long-range one,
// while a Nexa Pro holds the tower and band it was locked to.

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const HOURS = 8;

// Ordinary phone: band hops over the shift. [hour, band, mbps]
const HOPS: [number, string, number][] = [
  [0, "n41", 640],
  [0.9, "B12", 24],
  [1.6, "n71", 61],
  [2.4, "n41", 610],
  [3.1, "B2", 38],
  [3.6, "n71", 55],
  [4.3, "B12", 9],
  [4.9, "n41", 590],
  [5.8, "B66", 71],
  [6.4, "n71", 48],
  [7.1, "n41", 620],
  [7.7, "B12", 18],
];
const NEXA = 842;

function ordinaryAt(h: number) {
  let v = HOPS[0][2];
  for (const [at, , mbps] of HOPS) if (h >= at) v = mbps;
  return v;
}

const RESULTS: { label: string; nexa: string; other: string; unit?: string }[] = [
  { label: "Average speed", nexa: "842", other: "203", unit: "Mbps" },
  { label: "Lowest speed, 1% low", nexa: "796", other: "9", unit: "Mbps" },
  { label: "Band hops", nexa: "0", other: "11" },
  { label: "Airplane-mode resets", nexa: "0", other: "6" },
];

function Graph() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLive(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !live) return;
    const g = el.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = el.clientWidth * dpr;
      const H = el.clientHeight * dpr;
      if (el.width !== W || el.height !== H) {
        el.width = W;
        el.height = H;
      }
      const prog = reduce ? 1 : Math.min(1, (now - t0) / 2600);
      const ease = 1 - Math.pow(1 - prog, 3);
      const tt = (now - t0) / 1000;
      const padL = 44 * dpr;
      const padR = 14 * dpr;
      const padT = 18 * dpr;
      const padB = 28 * dpr;
      const gw = W - padL - padR;
      const gh = H - padT - padB;
      const x = (h: number) => padL + (h / HOURS) * gw;
      const y = (m: number) => padT + gh - (Math.min(m, 900) / 900) * gh;

      g.clearRect(0, 0, W, H);
      // grid
      g.strokeStyle = "rgba(255,255,255,.07)";
      g.lineWidth = dpr;
      g.font = `${11 * dpr}px system-ui`;
      g.fillStyle = "rgba(207,217,223,.55)";
      g.textAlign = "right";
      [0, 300, 600, 900].forEach((m) => {
        g.beginPath();
        g.moveTo(padL, y(m));
        g.lineTo(W - padR, y(m));
        g.stroke();
        g.fillText(String(m), padL - 8 * dpr, y(m) + 4 * dpr);
      });
      g.textAlign = "center";
      for (let h = 0; h <= HOURS; h += 2) g.fillText(h === 0 ? "Shift start" : `${h}h`, x(h), H - 8 * dpr);

      const upto = HOURS * ease;
      // ordinary phone
      g.strokeStyle = "rgba(255,138,112,.9)";
      g.lineWidth = 2 * dpr;
      g.beginPath();
      let first = true;
      for (let h = 0; h <= upto; h += 0.02) {
        const v = ordinaryAt(h) * (1 + Math.sin(h * 23 + tt * 2) * 0.05);
        if (first) g.moveTo(x(h), y(v));
        else g.lineTo(x(h), y(v));
        first = false;
      }
      g.stroke();
      // hop markers
      g.font = `600 ${10 * dpr}px system-ui`;
      HOPS.forEach(([at, band], i) => {
        if (i === 0 || at > upto) return;
        const px = x(at);
        g.fillStyle = "rgba(255,138,112,.9)";
        g.beginPath();
        g.arc(px, y(ordinaryAt(at)), 3 * dpr, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(255,180,163,.9)";
        g.fillText(band, px, y(ordinaryAt(at)) - 8 * dpr);
      });
      // nexa
      g.strokeStyle = "#56e0e8";
      g.lineWidth = 2.5 * dpr;
      g.shadowColor = "rgba(86,224,232,.7)";
      g.shadowBlur = 10 * dpr;
      g.beginPath();
      first = true;
      for (let h = 0; h <= upto; h += 0.02) {
        const v = NEXA + Math.sin(h * 17 + tt * 1.6) * 9 + Math.sin(h * 5) * 6;
        if (first) g.moveTo(x(h), y(v));
        else g.lineTo(x(h), y(v));
        first = false;
      }
      g.stroke();
      g.shadowBlur = 0;
      // locked tag
      if (ease > 0.15) {
        g.fillStyle = "#56e0e8";
        g.font = `700 ${10 * dpr}px system-ui`;
        g.textAlign = "left";
        g.fillText("LOCKED  n41", padL + 6 * dpr, y(NEXA) - 10 * dpr);
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  return <canvas ref={canvas} className="np-test-graph" aria-label="Download speed over an eight-hour shift: Nexa Pro holds about 840 Mbps; an ordinary phone hops between bands and drops as low as 9 Mbps" />;
}

export default function SignalTest({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`np-section np-test ${compact ? "np-test-compact" : ""}`} id="performance">
      <div className="np-wrap">
        {!compact && (
          <>
            <p className="np-chapter">
              <span>Performance</span>
            </p>
            <Title text="Stability is performance." style={{ maxWidth: "9em" }} />
            <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
              Every Nexa Pro runs a flagship Snapdragon chip. A chip is only as fast as the connection feeding it, and an
              ordinary phone keeps trading the fast band on your tower for a slower one that looks stronger. Ours
              {t(" is out of that cycle. It", "")} holds the band you locked, so the speed you get at 7am is the speed you
              get at 3pm.
            </p>
          </>
        )}

        <motion.div
          className="np-test-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="np-test-head">
            <strong>Signal test</strong>
            <div className="np-test-tags">
              <span>Same tower</span>
              <span>Same carrier</span>
              <span>8-hour shift</span>
              <span data-ex>Example</span>
            </div>
          </div>
          <div className="np-test-legend">
            <i data-nexa /> Nexa Pro, locked <i data-other /> Ordinary phone, auto
          </div>
          <Graph />
          <div className="np-test-results">
            {RESULTS.map((r) => (
              <div key={r.label}>
                <small>{r.label}</small>
                <b>
                  <span className="np-num">{r.nexa}</span>
                  <em>|</em>
                  <span className="np-num np-test-other">{r.other}</span>
                  {r.unit && <small>{r.unit}</small>}
                </b>
              </div>
            ))}
          </div>
          <p className="np-test-note">
            Illustrative example, not a measurement. Every site&apos;s towers are different, so your numbers will differ.
            The pattern doesn&apos;t: an ordinary phone hops to whatever band looks strongest, usually a slower long-range
            band, and a Nexa Pro stays on the tower and band you chose.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
