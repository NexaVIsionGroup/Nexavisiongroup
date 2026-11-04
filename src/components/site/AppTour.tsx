"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Inbox, FolderOpen, FileSignature, CreditCard, ShoppingBag, Star, Users, PenLine } from "lucide-react";
import { Phone, SCREENS } from "./Screens";
import { tour } from "./content";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const ICONS = { inbox: Inbox, drive: FolderOpen, quotes: FileSignature, payments: CreditCard, orders: ShoppingBag, reviews: Star, team: Users, editor: PenLine };
const DWELL = 6500;

/** Tap a feature: the laptop shows the real (blurred) client screen, the phone shows the app screen. Auto-advances until touched. */
export function AppTour() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, { margin: "-20% 0px" });
  const t = tour[i];
  const Screen = SCREENS[t.phone];

  useEffect(() => {
    if (!auto || !inView || reduce) return;
    const id = setTimeout(() => setI((n) => (n + 1) % tour.length), DWELL);
    return () => clearTimeout(id);
  }, [i, auto, inView, reduce]);

  const pick = (n: number) => { setAuto(false); setI(n); };

  return (
    <div ref={host} className="nxs-tour">
      <div className="nxs-tour-tabs" role="tablist" aria-label="Business app features">
        {tour.map((f, n) => {
          const Icon = ICONS[f.key];
          const on = n === i;
          return (
            <button key={f.key} role="tab" aria-selected={on} aria-controls="tour-panel" className="nxs-tour-tab" onClick={() => pick(n)}>
              <Icon size={18} aria-hidden />
              <span>{f.label}</span>
              {on && auto && inView && !reduce && <motion.i key={`p${i}`} className="nxs-tour-prog" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: DWELL / 1000, ease: "linear" }} />}
            </button>
          );
        })}
      </div>

      <div className="nxs-tour-grid">
        <div id="tour-panel" role="tabpanel" className="nxs-tour-copy" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={t.key} initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -12 }} transition={{ duration: 0.45, ease: EASE }}>
              <span className="nxs-kicker"><span className="nxs-live" />{String(i + 1).padStart(2, "0")} of {tour.length}</span>
              <h3 className="nxs-display">{t.title}</h3>
              <p>{t.text}</p>
              <p className="nxs-story-who">Running for <b>{t.who}</b></p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="nxs-devices" aria-hidden>
          <div className="nxs-laptop">
            <div className="nxs-laptop-screen">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={t.shot} className="nxs-laptop-shot" initial={reduce ? false : { opacity: 0, scale: 1.04, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                  <Image src={t.shot} alt="" fill sizes="(min-width: 1024px) 760px, 92vw" style={{ objectFit: "cover", objectPosition: "top left" }} />
                </motion.div>
              </AnimatePresence>
              <span className="nxs-laptop-tag">{t.shotLabel}<span className="nxs-tag-note"> · real app, details blurred</span></span>
            </div>
            <div className="nxs-laptop-base" />
          </div>
          <div className="nxs-tour-phone">
            <Phone>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={t.key} initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduce ? undefined : { opacity: 0, y: -14, filter: "blur(8px)" }} transition={{ duration: 0.45, ease: EASE }}>
                  <Screen />
                </motion.div>
              </AnimatePresence>
            </Phone>
          </div>
        </div>
      </div>
    </div>
  );
}
