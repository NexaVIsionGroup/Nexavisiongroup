"use client";

import Link from "next/link";
import { t } from "./theme";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Rows3 } from "lucide-react";
import { fromPrice, money, products, type Product } from "./catalog";
import { useCart } from "./cart";
import PhoneRender from "./PhoneRender";
import Title from "./Title";
import { useCoverflow } from "./useCoverflow";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Shop order: best seller first, then flagships by price, then fold and turbo. */
export const SHOP_ORDER = ["n10", "n13", "n12", "n11", "n15", "nfold", "nrm10", "nrm11"];
export const shopProducts = () => SHOP_ORDER.map((id) => products.find((p) => p.id === id)!).filter(Boolean);

const num = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;
const PICKS: { id: string; label: string; pick: (all: Product[]) => Product[] }[] = [
  { id: "all", label: "All 8", pick: (a) => a },
  { id: "value", label: "Best value", pick: (a) => [...a].sort((x, y) => fromPrice(x) - fromPrice(y)).slice(0, 3) },
  { id: "battery", label: "Longest battery", pick: (a) => [...a].sort((x, y) => num(y.battery) - num(x.battery)).slice(0, 3) },
  { id: "fast", label: "Fastest", pick: (a) => [...a].sort((x, y) => y.gb6 - x.gb6).slice(0, 3) },
  { id: "screen", label: "Biggest screen", pick: (a) => [...a].sort((x, y) => num(y.display) - num(x.display)).slice(0, 3) },
  { id: "fold", label: "Foldable", pick: (a) => a.filter((p) => p.family === "fold") },
];

const STOCK = { in: "In stock", low: "Low stock", out: "Sold out" };

export function ShopCard({ p, big = false }: { p: Product; big?: boolean }) {
  const { add } = useCart();
  const buy = () => add({ slug: p.slug, ram: p.configs[0].ram, storage: p.configs[0].storage, color: p.colors[0].name, addons: [], qty: 1 });
  return (
    <article className="np-shop-card" data-big={big} data-best={!!p.bestSeller}>
      <Link href={`/nexaphone/phones/${p.slug}`} className="np-shop-stage" aria-label={`${p.name} details`}>
        {p.bestSeller && <span className="np-shop-badge">Best seller</span>}
        <span className="np-shop-stock" data-stock={p.stock}>
          {STOCK[p.stock]}
        </span>
        <PhoneRender d={p} />
      </Link>
      <div className="np-shop-body">
        <h3 className="np-display">{p.name}</h3>
        <p className="np-shop-who">{p.who}</p>
        <div className="np-shop-chips">
          {p.chips.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="np-shop-price">
          <span>From</span>
          <b className="np-num">{money(fromPrice(p))}</b>
        </div>
        <div className="np-shop-btns">
          <button className="np-btn np-btn-lock" onClick={buy} disabled={p.stock === "out"}>
            Buy
          </button>
          <Link href={`/nexaphone/phones/${p.slug}`} className="np-btn np-btn-ghost">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ShopRail() {
  const all = useMemo(shopProducts, []);
  const [pick, setPick] = useState("all");
  const [grid, setGrid] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  useCoverflow(rail, ".np-shop-card", 0.5);
  const shown = PICKS.find((x) => x.id === pick)!.pick(all);

  return (
    <section className="np-section np-shop" id="shop">
      <div className="np-wrap">
        <Title text="Pick your phone." />
        <p className="np-lede np-shop-lede">
          {t(
            "Eight models, one Signal Engine, all out. Each one locks on to the exact tower and frequency you choose, arrives set up by our shop, and carries our shop warranty.",
            "Eight models, one Signal Engine. Every phone locks to the exact tower and frequency you choose, arrives set up by our shop, and carries our shop warranty."
          )}
        </p>
        <div className="np-picks" role="group" aria-label="Pick by need">
          {PICKS.map((x) => (
            <button
              key={x.id}
              aria-pressed={pick === x.id}
              onClick={() => {
                setPick(x.id);
                rail.current?.scrollTo({ left: 0, behavior: "smooth" });
              }}
            >
              {x.label}
            </button>
          ))}
          <button className="np-picks-view" aria-label={grid ? "Show as a row" : "Show as a grid"} aria-pressed={grid} onClick={() => setGrid((g) => !g)}>
            {grid ? <Rows3 size={18} /> : <LayoutGrid size={18} />}
          </button>
        </div>
      </div>
      <motion.div className="np-shop-rail" data-grid={grid} ref={rail} layout>
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p, i) => (
            <motion.div
              key={p.id}
              className="np-shop-slot"
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <ShopCard p={p} big={!grid && i === 0 && !!p.bestSeller} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <div className="np-wrap">
        <p className="np-shop-foot">
          Like new, tested in our shop, backed by our warranty. Not sure which one? <Link href="#talk">Talk to a person</Link>.
        </p>
      </div>
    </section>
  );
}
