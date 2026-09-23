"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { devices, families, QUOTE_MAIL, type Family } from "./data";
import PhoneRender from "./PhoneRender";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const TOP = Math.max(...devices.flatMap((d) => [d.gb6, d.galaxy.gb6]));
const FAMILY_TAG: Record<Family, string> = { flagship: "Flagship", fold: "Foldable", turbo: "Turbo, fan-cooled" };

export default function Lineup() {
  const [family, setFamily] = useState<Family | "all">("all");
  const shown = devices.filter((d) => family === "all" || d.family === family);

  return (
    <section className="np-section np-light" id="lineup">
      <div className="np-wrap">
        <h2 className="np-display np-h2" style={{ maxWidth: "10em" }}>
          Seven phones. All flagship fast.
        </h2>
        <p className="np-lede" style={{ marginTop: 22 }}>
          Each Nexa Pro starts as a top-tier phone and is rebuilt, tested and tuned in our shop. Here is how
          each one stacks up against the Galaxy it matches.
        </p>

        <div className="np-filter" role="group" aria-label="Filter phones">
          {families.map((f) => (
            <button key={f.id} aria-pressed={family === f.id} onClick={() => setFamily(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <p className="np-lineup-count">
          {shown.length} {shown.length === 1 ? "phone" : "phones"}. Swipe to compare.
        </p>
        <motion.div className="np-lineup" layout>
          <AnimatePresence mode="popLayout">
            {shown.map((d) => (
              <motion.article
                className="np-card"
                key={d.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className="np-card-stage">
                  <span className="np-card-tag">{FAMILY_TAG[d.family]}</span>
                  <PhoneRender d={d} />
                </div>
                <div className="np-card-body">
                  <div>
                    <h3 className="np-display np-h3">{d.name}</h3>
                    <div className="np-card-base">Built on {d.base} hardware</div>
                  </div>
                  <p>{d.tagline}</p>
                  <div className="np-vs" aria-label={`Benchmark versus ${d.galaxy.model}`}>
                    {[
                      { label: d.name, v: d.gb6, color: "var(--lock-deep)" },
                      { label: d.galaxy.model, v: d.galaxy.gb6, color: "#9aa8b0" },
                    ].map((r) => (
                      <div className="np-vs-row" key={r.label}>
                        <span>{r.label}</span>
                        <div className="np-vs-bar">
                          <motion.span
                            style={{ background: r.color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(r.v / TOP) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.1, ease: EASE }}
                          />
                        </div>
                        <span className="np-num">{r.v.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <dl className="np-specs">
                    <div><dt>Chip</dt><dd>{d.chip}</dd></div>
                    <div><dt>Screen</dt><dd>{d.display}</dd></div>
                    <div><dt>Battery</dt><dd>{d.battery}</dd></div>
                    <div><dt>Memory</dt><dd>{d.memory}</dd></div>
                    <div><dt>Toughness</dt><dd>{d.toughness}</dd></div>
                    <div><dt>Carriers</dt><dd>{d.carriers}</dd></div>
                  </dl>
                  <div className="np-card-foot">
                    <span>Pricing soon</span>
                    <a
                      href={`${QUOTE_MAIL}${encodeURIComponent(`: ${d.name}`)}`}
                      className="np-btn np-btn-ghost"
                      style={{ minHeight: 44, padding: "0 18px", fontSize: 15 }}
                    >
                      Ask about this phone
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
        <p style={{ marginTop: 26, fontSize: 13, color: "var(--ink-soft)", maxWidth: "52em" }}>
          Performance compared using Geekbench 6 multi-core scores from GSMArena reviews. OnePlus, REDMAGIC
          and Galaxy are trademarks of their owners. Nexa Pro phones are independently rebuilt and are not
          made or endorsed by those companies.
        </p>
      </div>
    </section>
  );
}
