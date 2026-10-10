// Lineup order and counts. A plain module (no "use client") so server
// components like MiniCta and Closer can call these directly.
import { fromPrice, products } from "./catalog";

// Everything on sale, cheapest first (owner 2026-10-10). SHOP_ORDER only breaks price ties.
export const SHOP_ORDER = ["n10", "n11", "n12", "n13", "nrm10", "n15", "nfold", "nrm11"];
export const shopProducts = () =>
  products
    .filter((p) => SHOP_ORDER.includes(p.id))
    .sort((a, b) => fromPrice(a) - fromPrice(b) || SHOP_ORDER.indexOf(a.id) - SHOP_ORDER.indexOf(b.id));
/** The model we lead with: the best seller if it's on sale, else the first in shop order. */
export const featured = () => shopProducts().find((p) => p.bestSeller) ?? shopProducts()[0];
export const MODEL_COUNT = shopProducts().length;
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
export const MODEL_WORD = WORDS[MODEL_COUNT] ?? String(MODEL_COUNT);
