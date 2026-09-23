"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { QUOTE_MAIL } from "./data";

export function Mark({ className = "np-wordmark-mark" }: { className?: string }) {
  // A tower with one locked ring — the product in one glyph.
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 7 7.5 22M12 7l4.5 15M9 16h6M8.3 19h7.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="5" r="2" fill="var(--lock)" />
      <path d="M6.5 2.2a8 8 0 0 0 0 5.6M17.5 2.2a8 8 0 0 1 0 5.6" stroke="var(--lock)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [dock, setDock] = useState(false);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 24);
      setDock(window.scrollY > window.innerHeight * 0.8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="np-nav" data-solid={solid}>
        <div className="np-wrap np-nav-inner">
          <a href="#top" className="np-wordmark" aria-label="Nexa Pro home">
            <Mark />
            Nexa Pro
          </a>
          <nav className="np-nav-links" aria-label="Sections">
            <a href="#signal">How it connects</a>
            <a href="#where">Where it works</a>
            <a href="#control">Control</a>
            <a href="#lineup">Lineup</a>
          </nav>
          <a href={QUOTE_MAIL} className="np-btn np-btn-lock" style={{ minHeight: 42, padding: "0 18px", fontSize: 15 }}>
            Get a quote
          </a>
        </div>
        <motion.div className="np-progress" style={{ scaleX: bar }} />
      </header>

      <AnimatePresence>
        {dock && (
          <motion.nav
            className="np-dock"
            aria-label="Quick links"
            initial={{ y: 90, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 90, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <a href="#signal">How</a>
            <a href="#lineup">Lineup</a>
            <a href={QUOTE_MAIL} className="np-dock-cta">Get a quote</a>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
