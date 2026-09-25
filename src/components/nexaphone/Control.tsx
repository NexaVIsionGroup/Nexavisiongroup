"use client";

import { motion } from "framer-motion";
import { t } from "./theme";
import { Ban, Wrench, SlidersHorizontal, CalendarCheck, Lock, PackageCheck } from "lucide-react";
import { controls } from "./data";
import Scramble from "./Scramble";
import Title from "./Title";

const ICONS = [Ban, Wrench, SlidersHorizontal, CalendarCheck, Lock, PackageCheck];
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

// The glow follows a finger or cursor across each tile.
const track = (e: React.PointerEvent<HTMLDivElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

export default function Control() {
  return (
    <section className="np-section" id="control" style={{ paddingTop: 0 }}>
      <div className="np-wrap">
        <Title text={t("A phone that answers to you. Not its warden.", "A phone that answers to you.")} style={{ maxWidth: "10em" }} />
        <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
          {t("Every Nexa Pro walks out of our shop on our in-house build with full control opened up.", "Every Nexa Pro runs our in-house build with full control opened up.")} The same access that lets it choose a tower
          also lets you strip it down, lock it down and make it yours.
        </p>
        <div className="np-control">
          {controls.map((c, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={c.title}
                className="np-control-tile"
                onPointerMove={track}
                onPointerDown={track}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE }}
              >
                <motion.span
                  className="np-control-icon"
                  initial={{ "--draw": 90 } as Record<string, number>}
                  whileInView={{ "--draw": 0 } as Record<string, number>}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1.6, delay: 0.15 + (i % 3) * 0.1, ease: "easeInOut" }}
                >
                  <Icon size={28} strokeWidth={1.7} />
                </motion.span>
                <h3>
                  <Scramble text={c.title} delay={0.2 + (i % 3) * 0.1} speed={40} />
                </h3>
                <p>{c.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
