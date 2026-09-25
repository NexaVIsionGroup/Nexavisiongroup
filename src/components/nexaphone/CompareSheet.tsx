"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { Product } from "./catalog";
import { versus, type Row } from "./versus";

// The four things a buyer came for. Everything else lives in the sheet.
const HEADLINE = ["Full bars, no internet", "Fake cell sites", "Lock to one exact tower", "Lock to one exact frequency"];

function ScoreRow({ r }: { r: Row }) {
  return (
    <div role="row" className="np-score-row" data-result={r.result}>
      <span role="rowheader">{r.label}</span>
      <span className="np-score-us">
        {r.result === "win" ? <Check size={16} /> : <span className="np-score-tie">=</span>} {r.nexa}
      </span>
      <span className="np-score-them">{r.galaxy}</span>
    </div>
  );
}

/** Device-page compare: a short headline scoreboard plus a bottom sheet with every row. */
export default function CompareSheet({ p }: { p: Product }) {
  const vs = versus(p);
  const [open, setOpen] = useState(false);
  const top = HEADLINE.map((l) => vs.rows.find((r) => r.label === l)).filter(Boolean) as Row[];

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="np-score np-score-top" role="table" aria-label={`${p.name} versus ${vs.galaxy}, highlights`}>
        <div className="np-score-head" role="row">
          <span role="columnheader" />
          <span role="columnheader" className="np-score-us">{p.name}</span>
          <span role="columnheader">{vs.galaxy}</span>
        </div>
        {top.map((r) => (
          <ScoreRow key={r.label} r={r} />
        ))}
      </div>
      <button className="np-btn np-btn-ghost np-score-more" onClick={() => setOpen(true)} aria-expanded={open}>
        See all {vs.rows.length} comparisons
        <span className="np-score-wins np-num">{vs.wins} ahead</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="np-sheet-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="np-sheet np-compare"
              role="dialog"
              aria-modal="true"
              aria-label={`${p.name} versus ${vs.galaxy}`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, i) => i.offset.y > 120 && setOpen(false)}
            >
              <div className="np-sheet-grip" />
              <header className="np-sheet-head">
                <h2 className="np-display">vs {vs.galaxy}</h2>
                <button className="np-icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
                  <X size={20} />
                </button>
              </header>
              <p className="np-compare-lede">
                Same flagship class. The difference is control: Samsung locks its phones, so none of the top rows are possible on a Galaxy.
              </p>
              <div className="np-compare-scroll">
                <div className="np-score" role="table" aria-label={`${p.name} versus ${vs.galaxy}, full list`}>
                  <div className="np-score-head" role="row">
                    <span role="columnheader" />
                    <span role="columnheader" className="np-score-us">{p.name}</span>
                    <span role="columnheader">{vs.galaxy}</span>
                  </div>
                  {vs.rows.map((r) => (
                    <ScoreRow key={r.label} r={r} />
                  ))}
                </div>
                <p className="np-duel-note">
                  Galaxy figures are US launch specs. Speed compared with Geekbench 6 multi-core scores from GSMArena reviews ({p.gb6.toLocaleString()} vs {p.galaxy.gb6.toLocaleString()}). {p.perf.cpu}, {p.perf.gpu}.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
