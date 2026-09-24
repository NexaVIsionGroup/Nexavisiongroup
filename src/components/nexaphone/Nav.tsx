"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart";

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

function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button className="np-cart-btn" aria-label={`Cart, ${count} items`} onClick={() => setOpen(true)}>
      <ShoppingBag size={20} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            className="np-cart-count np-num"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Nav({ dock: showDock = true }: { dock?: boolean }) {
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
          <Link href="/nexaphone" className="np-wordmark" aria-label="Nexa Pro home">
            <Mark />
            Nexa Pro
          </Link>
          <nav className="np-nav-links" aria-label="Sections">
            <Link href="/nexaphone#signal">How it connects</Link>
            <Link href="/nexaphone#where">Where it works</Link>
            <Link href="/nexaphone#control">Control</Link>
            <Link href="/nexaphone#shop">Shop</Link>
          </nav>
          <div className="np-nav-actions">
            <Link href="/nexaphone#shop" className="np-btn np-btn-lock np-nav-shop">
              Shop
            </Link>
            <CartButton />
          </div>
        </div>
        <motion.div className="np-progress" style={{ scaleX: bar }} />
      </header>

      <AnimatePresence>
        {showDock && dock && (
          <motion.nav
            className="np-dock"
            aria-label="Quick links"
            initial={{ y: 90, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 90, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <Link href="/nexaphone#signal">How</Link>
            <Link href="/nexaphone#shop" className="np-dock-cta">
              Shop phones
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
