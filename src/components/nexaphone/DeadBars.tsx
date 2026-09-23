"use client";

import { useEffect, useRef, useState } from "react";
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
          <Bars on={plane ? 0 : step === 3 ? 1 : 4} color="#e9eef0" />
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
                <span>Stuck on a tower that has stopped delivering.</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="np-db-toggle" data-on={plane}>
          <Plane size={16} />
          <span className="np-db-knob" />
        </div>
      </div>
      <p className="np-db-cap">Every other phone</p>
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
          <span>Held on the tower and band that are actually moving data.</span>
        </div>
        <div className="np-db-flow" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      </div>
      <p className="np-db-cap np-db-cap-good">Nexa Pro</p>
    </div>
  );
}

export default function DeadBars() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  return (
    <section className="np-section np-deadbars" id="stuck">
      <div className="np-wrap">
        <Title text="Full bars. No internet." />
        <motion.p
          className="np-lede"
          style={{ marginTop: 22, color: "#cfd9df" }}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          Your phone says 4G and full bars, and nothing loads. So you flip airplane mode on and off and hope it
          lands on 5G. It happens because ordinary phones trust the bars and let the network decide. A Nexa Pro
          doesn&apos;t.
        </motion.p>

        <div className="np-db-grid" ref={ref}>
          <Everyday active={inView} />
          <Nexa active={inView} />
        </div>

        <div className="np-engine">
          <h3 className="np-display">The Nexa Signal Engine</h3>
          <p>
            Flagship radios plus our own software, working as one. It watches whether data is actually moving, not
            how many bars you have. When a tower stops delivering, it moves you to one that does, on the fastest band
            that tower offers. No airplane mode. No restarts. No guessing.
          </p>
          <p className="np-engine-small">
            Galaxy phones can&apos;t run it: Samsung locks its phones so this level of radio control is off-limits.
            Ours are built open, then tuned in our shop.
          </p>
        </div>
      </div>
    </section>
  );
}
