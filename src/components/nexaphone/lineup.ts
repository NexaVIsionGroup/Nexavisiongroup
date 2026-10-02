// Lineup order and counts. A plain module (no "use client") so server
// components like MiniCta and Closer can call these directly.
import { products } from "./catalog";

export const SHOP_ORDER = ["n10", "n13", "n12", "n11", "n15", "nfold", "nrm10", "nrm11"];
export const shopProducts = () => SHOP_ORDER.map((id) => products.find((p) => p.id === id)!).filter(Boolean);
/** The model we lead with: the best seller if it's on sale, else the first in shop order. */
export const featured = () => shopProducts().find((p) => p.bestSeller) ?? shopProducts()[0];
export const MODEL_COUNT = shopProducts().length;
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
export const MODEL_WORD = WORDS[MODEL_COUNT] ?? String(MODEL_COUNT);
