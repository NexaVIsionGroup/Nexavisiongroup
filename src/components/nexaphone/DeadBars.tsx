"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "./theme";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Plane, Loader2, Check } from "lucide-react";
import Title from "./Title";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/**
 * "Full bars. No internet." The everyday failure every phone has, acted out
 * on two mock status bars: an ordinary phone stuck on 4G with full bars and
 * nothing loading while someone flips airplane mode, next to a Nexa Pro
 * holding 5G with data moving.
 */

function Bars({ on, color }: { on: number; color: string }) {
  return (
    <span className="np-db-bars" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} style={{ height: 5 + i * 4, background: i < on ? color : "rgba(255,255,255,.18)" }} />
      ))}
    </span>
  );
}

function Everyday({ active }: { active: boolean }) {
  // Loop: stuck -> airplane on -> searching -> back to 4G stuck
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    const d = [2600, 1100, 1500, 900];
    const t = setTimeout(() => setStep((s) => (s + 1) % 4), d[step]);
    return () => clearTimeout(t);
  }, [step, active]);
  const plane = step === 1 || step === 2;
  return (
    <div className="np-db-phone" data-bad>
      <div className="np-db-status">
        <span>9:41</span>
        <span className="np-db-net">
          {plane ? <Plane size={14} /> : step === 3 ? "..." : "4G"}
          <Bars on={plane ? 0 : step === 3 ? 1 : 4} color="#eef2f8" />
        </span>
      </div>
      <div className="np-db-screen">
        <AnimatePresence mode="wait">
          <motion.div key={plane ? "p" : "s"} className="np-db-msg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {plane ? (
              <>
                <Plane size={30} />
                <b>Airplane mode on…</b>
                <span>and off again. Maybe it finds 5G this time.</span>
              </>
            ) : (
              <>
                <Loader2 size={30} className="np-db-spin" />
                <b>Full bars. Nothing loads.</b>
                <span>{t("Doing time on a tower that stopped delivering.", "Stuck on a tower that has stopped delivering.")}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="np-db-toggle" data-on={plane}>
          <Plane size={16} />
          <span className="np-db-knob" />
        </div>
      </div>
      <p className="np-db-cap">{t("Every other phone. Locked up.", "Every other phone")}</p>
    </div>
  );
}

function Nexa({ active }: { active: boolean }) {
  const [mbps, setMbps] = useState(812);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setMbps(780 + Math.round(Math.random() * 90)), 900);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div className="np-db-phone" data-good>
      <div className="np-db-status">
        <span>9:41</span>
        <span className="np-db-net np-db-net-good">
          5G UW
          <Bars on={4} color="var(--lock)" />
        </span>
      </div>
      <div className="np-db-screen">
        <div className="np-db-msg">
          <Check size={30} />
          <b className="np-num">{mbps} Mbps, steady</b>
          <span>Locked to the one tower and channel that perform best right here.</span>
        </div>
        <div className="np-db-flow" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      </div>
      <p className="np-db-cap np-db-cap-good">{t("Nexa Pro. Locked on.", "Nexa Pro")}</p>
    </div>
  );
}

export default function DeadBars() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  return (
    <section className="np-section np-deadbars" id="stuck">
      <div className="np-wrap">
        <p className="np-chapter">
          <span>Signal</span>
        </p>
        <Title text="Full bars. No internet." />
        <motion.p
          className="np-lede"
          style={{ marginTop: 22, color: "#cfd9df" }}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          Full bars, nothing loads, so you toggle airplane mode and hope. Ordinary phones pick their own tower, hop
          whenever they like, and park on one that has stopped delivering. That hop is the lag spike that costs
          you the round.{t(" They call it a cell for a reason.", "")} A Nexa Pro doesn&apos;t pick. You do.
        </motion.p>

        <div className="np-db-grid" ref={ref}>
          <Everyday active={inView} />
          <Nexa active={inView} />
        </div>

        <div className="np-engine">
          <h3 className="np-display">The Nexa Signal Engine</h3>
          <p>
            Flagship radios plus our own software, working as one. The Signal Engine turns the hopping off: we lock
            each phone to the exact tower and frequency that perform best where you play, and it stays there. No
            dead cells, no airplane mode, no spike in the last circle.
          </p>
          <p>
            It also means the phone ignores towers you haven&apos;t approved, including fake cell sites (IMSI
            catchers) built to pull phones in.
          </p>
          <p className="np-engine-small">
            Built for fixed spots: your desk, your couch, your dorm, and yes, plant floors and job sites. Galaxy and Moto
            phones can&apos;t do any of this: their radios are locked, and ours are built open, then set up in our shop.
          </p>
        </div>
      </div>
    </section>
  );
}
