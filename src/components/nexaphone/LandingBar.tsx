"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, X } from "lucide-react";
import { fromPrice, money, products } from "./catalog";
import { useCart } from "./cart";
import { shopProducts } from "./ShopRail";
import PhoneRender from "./PhoneRender";

/**
 * Persistent buy path on the landing page: the best seller with a Buy button
 * and an "All models" sheet, so nobody has to scroll back up to the lineup.
 */
export default function LandingBar() {
  const { add, open: cartOpen } = useCart();
  const [show, setShow] = useState(false);
  const [sheet, setSheet] = useState(false);
  const hero = products.find((p) => p.bestSeller) ?? products[0];

  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.9);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!sheet) return;
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", k);
    };
  }, [sheet]);

  const buy = (slug: string) => {
    const p = products.find((x) => x.slug === slug)!;
    add({ slug, ram: p.configs[0].ram, storage: p.configs[0].storage, color: p.colors[0].name, addons: [], qty: 1 });
    setSheet(false);
  };

  return (
    <>
      <AnimatePresence>
        {show && !cartOpen && (
          <motion.div
            className="np-lbar"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <Link href={`/nexaphone/phones/${hero.slug}`} className="np-lbar-item">
              <small>Best seller</small>
              <b>
                {hero.name} <span className="np-num">{money(fromPrice(hero))}</span>
              </b>
            </Link>
            <button className="np-btn np-btn-lock" onClick={() => buy(hero.slug)}>
              Buy
            </button>
            <button className="np-lbar-all" onClick={() => setSheet(true)} aria-expanded={sheet}>
              All models <ChevronUp size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheet && (
          <>
            <motion.div className="np-sheet-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.aside
              className="np-sheet np-models"
              role="dialog"
              aria-modal="true"
              aria-label="All models"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, i) => i.offset.y > 120 && setSheet(false)}
            >
              <div className="np-sheet-grip" />
              <header className="np-sheet-head">
                <h2 className="np-display">All 8 models</h2>
                <button className="np-icon-btn" aria-label="Close" onClick={() => setSheet(false)}>
                  <X size={20} />
                </button>
              </header>
              <ul className="np-models-list">
                {shopProducts().map((p) => (
                  <li key={p.id}>
                    <Link href={`/nexaphone/phones/${p.slug}`} className="np-models-stage" onClick={() => setSheet(false)}>
                      <PhoneRender d={p} />
                    </Link>
                    <Link href={`/nexaphone/phones/${p.slug}`} className="np-models-info" onClick={() => setSheet(false)}>
                      <strong>
                        {p.name}
                        {p.bestSeller && <em>Best seller</em>}
                      </strong>
                      <span>{p.chips.join(", ")}</span>
                      <b className="np-num">From {money(fromPrice(p))}</b>
                    </Link>
                    <button className="np-btn np-btn-lock np-models-buy" onClick={() => buy(p.slug)}>
                      Buy
                    </button>
                  </li>
                ))}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
