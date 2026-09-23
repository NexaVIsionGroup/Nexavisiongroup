"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { ADDONS, money, productBySlug } from "./catalog";

export type CartLine = {
  key: string; // slug|ram|storage|color|addons
  slug: string;
  ram: number;
  storage: string;
  color: string;
  addons: string[];
  qty: number;
};

type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (l: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartCtx = createContext<Cart | null>(null);
const STORE = "nexa-cart-v1";

export function unitPrice(l: Pick<CartLine, "slug" | "ram" | "storage" | "addons">) {
  const p = productBySlug(l.slug);
  if (!p) return 0;
  const cfg = p.configs.find((c) => c.ram === l.ram && c.storage === l.storage) ?? p.configs[0];
  const add = l.addons.reduce((s, id) => s + (ADDONS.find((a) => a.id === id)?.price ?? 0), 0);
  return cfg.price + add;
}

export function lineTitle(l: CartLine) {
  const p = productBySlug(l.slug);
  return `${p?.name ?? l.slug}, ${l.ram}GB / ${l.storage}, ${l.color}`;
}

const buzz = (ms: number | number[]) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no haptics */
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setLines((JSON.parse(raw) as CartLine[]).filter((l) => productBySlug(l.slug)));
    } catch {
      /* private mode: cart lives in memory only */
    }
    setLoaded(true);
  }, []);
  // Only write after the saved cart has been read, or the empty initial
  // state would overwrite it on every page load.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, loaded]);

  const add = useCallback((l: Omit<CartLine, "key">) => {
    const key = [l.slug, l.ram, l.storage, l.color, [...l.addons].sort().join("+")].join("|");
    setLines((cur) => {
      const hit = cur.find((x) => x.key === key);
      if (hit) return cur.map((x) => (x.key === key ? { ...x, qty: Math.min(99, x.qty + l.qty) } : x));
      return [...cur, { ...l, key }];
    });
    buzz([10, 30, 20]);
    setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((cur) => cur.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(99, qty)) } : x)));
  }, []);
  const remove = useCallback((key: string) => setLines((cur) => cur.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + unitPrice(l) * l.qty, 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, open, add, setQty, remove, clear]
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

function CartDrawer() {
  const { lines, open, setOpen, subtotal, setQty, remove, count } = useCart();

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="np-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="np-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
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
              <h2 className="np-display">Cart{count ? ` (${count})` : ""}</h2>
              <button className="np-icon-btn" aria-label="Close cart" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="np-sheet-empty">
                <p>Your cart is empty. Pick a phone to get started.</p>
                <Link href="/nexaphone#lineup" className="np-btn np-btn-lock" onClick={() => setOpen(false)}>
                  See the lineup
                </Link>
              </div>
            ) : (
              <>
                <ul className="np-cart-lines">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const p = productBySlug(l.slug)!;
                      return (
                        <motion.li
                          key={l.key}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -60, height: 0 }}
                          className="np-cart-line"
                        >
                          <span className="np-cart-swatch" style={{ background: p.colors.find((c) => c.name === l.color)?.hex }} />
                          <div className="np-cart-info">
                            <strong>{p.name}</strong>
                            <span>
                              {l.ram}GB / {l.storage}, {l.color}
                            </span>
                            {l.addons.length > 0 && (
                              <span>{l.addons.map((a) => ADDONS.find((x) => x.id === a)?.name).join(", ")}</span>
                            )}
                            <div className="np-qty">
                              <button aria-label="Fewer" onClick={() => setQty(l.key, l.qty - 1)}>
                                <Minus size={16} />
                              </button>
                              <span className="np-num">{l.qty}</span>
                              <button aria-label="More" onClick={() => setQty(l.key, l.qty + 1)}>
                                <Plus size={16} />
                              </button>
                              <button aria-label="Remove" className="np-qty-del" onClick={() => remove(l.key)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <b className="np-num">{money(unitPrice(l) * l.qty)}</b>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <footer className="np-sheet-foot">
                  <div className="np-sheet-total">
                    <span>Subtotal</span>
                    <b className="np-num">{money(subtotal)}</b>
                  </div>
                  <p className="np-sheet-note">Free insured shipping. Tax calculated at checkout.</p>
                  <Link href="/nexaphone/checkout" className="np-btn np-btn-lock np-shine" style={{ width: "100%" }} onClick={() => setOpen(false)}>
                    Check out
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
