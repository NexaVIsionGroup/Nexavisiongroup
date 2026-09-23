"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { families, type Family } from "./data";
import { fromPrice, money, products as devices } from "./catalog";
import PhoneRender from "./PhoneRender";
import { useCoverflow } from "./useCoverflow";

const Viewer3D = dynamic(() => import("./three/Viewer3D"), { ssr: false });
import Title from "./Title";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const TOP = Math.max(...devices.flatMap((d) => [d.gb6, d.galaxy.gb6]));
const FAMILY_TAG: Record<Family, string> = { flagship: "Flagship", fold: "Foldable", turbo: "Turbo, fan-cooled" };

export default function Lineup() {
  const [family, setFamily] = useState<Family | "all">("all");
  const rail = useRef<HTMLDivElement>(null);
  useCoverflow(rail, ".np-card", 0.7);
  const shown = devices.filter((d) => family === "all" || d.family === family);
  const [active, setActive] = useState(0);
  const cur = shown[Math.min(active, shown.length - 1)] ?? shown[0];

  // The phone nearest the middle of the rail drives the 3D stage.
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const pick = () => {
      const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      el.querySelectorAll<HTMLElement>(".np-card-slot").forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    el.addEventListener("scroll", pick, { passive: true });
    return () => el.removeEventListener("scroll", pick);
  }, [shown.length]);

  return (
    <section className="np-section np-light" id="lineup">
      <div className="np-wrap">
        <Title text="Seven phones. All flagship fast." style={{ maxWidth: "10em" }} />
        <p className="np-lede" style={{ marginTop: 22 }}>
          Each Nexa Pro starts as a top-tier phone and is rebuilt, tested and tuned in our shop. Here is how
          each one stacks up against the Galaxy it matches.
        </p>

        <div className="np-filter" role="group" aria-label="Filter phones">
          {families.map((f) => (
            <button key={f.id} aria-pressed={family === f.id} onClick={() => {
                setFamily(f.id);
                setActive(0);
                try { navigator.vibrate?.(8); } catch {}
                rail.current?.scrollTo({ left: 0, behavior: "smooth" });
              }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="np-stage3d">
          <Viewer3D
            className="np-viewer"
            modelKey={cur.id}
            island={cur.render.island}
            fold={cur.family === "fold"}
            folded
            swatch={cur.colors[0]}
            label={cur.name}
          />
          <div className="np-stage3d-cap">
            <AnimatePresence mode="wait">
              <motion.div key={cur.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <strong className="np-display">{cur.name}</strong>
                <span>Drag to spin. Swipe below to switch phones.</span>
              </motion.div>
            </AnimatePresence>
            <Link href={`/nexaphone/phones/${cur.slug}`} className="np-btn np-btn-lock np-shine">
              Explore
            </Link>
          </div>
        </div>

        <p className="np-lineup-count">
          {shown.length} {shown.length === 1 ? "phone" : "phones"}. Swipe to compare.
        </p>
        <motion.div className="np-lineup" layout ref={rail}>
          <AnimatePresence mode="popLayout">
            {shown.map((d) => (
              <motion.article
                className="np-card-slot"
                key={d.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className="np-card">
                <Link href={`/nexaphone/phones/${d.slug}`} className="np-card-stage" aria-label={`Explore ${d.name}`}>
                  <span className="np-card-tag">{FAMILY_TAG[d.family]}</span>
                  <PhoneRender d={d} />
                </Link>
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
                    <span>
                      From <b className="np-num">{money(fromPrice(d))}</b>
                    </span>
                    <Link
                      href={`/nexaphone/phones/${d.slug}`}
                      className="np-btn np-btn-ghost"
                      style={{ minHeight: 44, padding: "0 18px", fontSize: 15 }}
                    >
                      Explore
                    </Link>
                  </div>
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
