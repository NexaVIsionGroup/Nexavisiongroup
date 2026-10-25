"use client";

import { motion } from "framer-motion";
import Chip3D from "./Chip3D";
import Title from "./Title";
import { products } from "./catalog";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const num = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;

// Best-in-lineup figures, read from the catalog so they follow the models on sale.
function lineupStats() {
  const gb6 = Math.max(...products.map((p) => p.gb6));
  const hz = Math.max(...products.map((p) => num(p.display.match(/(\d+)\s*Hz/)?.[1] ?? "0")));
  const mah = Math.max(...products.map((p) => num(p.battery)));
  const watts = Math.max(
    ...products.flatMap((p) => p.specs.flatMap((g) => g.rows).filter(([k]) => k === "Wired").map(([, v]) => num(v)))
  );
  return [
    { v: gb6.toLocaleString(), l: "Geekbench 6 multi-core, top model", up: true },
    { v: `${hz}Hz`, l: "Fastest screen in the lineup", up: true },
    { v: `${mah.toLocaleString()}`, u: "mAh", l: "Biggest battery", up: true },
    { v: `${watts}W`, l: "Fastest wired charging", up: true },
  ];
}

const CHIP_LINES: [string, string, string] = ["SNAPDRAGON", "8 SERIES", "FLAGSHIP CLASS · EVERY MODEL"];

export default function Performance() {
  const stats = lineupStats();
  return (
    <section className="np-section np-light np-perf" id="flagship">
      <div className="np-wrap">
        <p className="np-chapter">
          <span>Performance</span>
        </p>
        <Title text="Flagship class. Every one." style={{ maxWidth: "9em" }} />
        <p className="np-lede" style={{ marginTop: 22 }}>
          Every Nexa Pro is built on a flagship Snapdragon 8-series chip, the same silicon behind the fastest gaming
          phones. Some models are a generation or two back. None of them was ever a budget phone: each was designed
          around games first, and we keep that speed fed with a connection that holds. Work gets the same phone.
        </p>

        <div className="np-perf-grid">
          <motion.div
            className="np-perf-chipcard"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Chip3D lines={CHIP_LINES} />
            <div className="np-perf-chipcap">
              <b>{products.length} of {products.length} models</b> on Snapdragon 8-series silicon
            </div>
          </motion.div>
          <div className="np-perf-stats">
            {stats.map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
              >
                <b className="np-num">
                  {s.v}
                  {s.u && <small>{s.u}</small>}
                  {s.up && <i aria-hidden>↑</i>}
                </b>
                <span>{s.l}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="np-footnote">Each phone&apos;s page shows its own chip, clocks and scores. Geekbench 6 figures from published reviews.</p>
      </div>
    </section>
  );
}
