// Nexa vs Galaxy head-to-head. Every Galaxy figure is the US launch spec
// (Samsung / GSMArena / Android Central, checked 2026-09-22). We only show
// rows we win or tie; the full truth is always in each phone's spec sheet.

import { fromPrice, money, type Product } from "./catalog";

type G = { price: number; battery: number; wired: number; wireless: number; water: string; refresh: number };

export const GALAXY: Record<string, G> = {
  "Galaxy S22 Ultra": { price: 1199, battery: 5000, wired: 45, wireless: 15, water: "IP68", refresh: 120 },
  "Galaxy S23 Ultra": { price: 1199, battery: 5000, wired: 45, wireless: 15, water: "IP68", refresh: 120 },
  "Galaxy S24 Ultra": { price: 1299, battery: 5000, wired: 45, wireless: 15, water: "IP68", refresh: 120 },
  "Galaxy S25 Ultra": { price: 1299, battery: 5000, wired: 45, wireless: 15, water: "IP68", refresh: 120 },
  "Galaxy S26 Ultra": { price: 1299, battery: 5000, wired: 60, wireless: 25, water: "IP68", refresh: 120 },
  "Galaxy Z Fold5": { price: 1799, battery: 4400, wired: 25, wireless: 15, water: "IPX8", refresh: 120 },
};

// Nexa hardware facts per model (US versions).
const NEXA: Record<string, { wired: number; wireless: number; water?: string; refresh: number; cooling?: string }> = {
  n10: { wired: 65, wireless: 50, refresh: 120 },
  n11: { wired: 80, wireless: 0, refresh: 120 },
  n12: { wired: 80, wireless: 50, refresh: 120 },
  n13: { wired: 80, wireless: 50, water: "IP68 + IP69", refresh: 120 },
  n15: { wired: 80, wireless: 50, water: "IP68 + IP69K", refresh: 165 },
  nfold: { wired: 67, wireless: 0, refresh: 120 },
  nrm10: { wired: 100, wireless: 0, refresh: 144, cooling: "23,000 RPM fan" },
  nrm11: { wired: 80, wireless: 80, refresh: 144, cooling: "Liquid loop + fan" },
};

export type Row = { label: string; nexa: string; galaxy: string; result: "win" | "tie" };

const num = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;

export function versus(p: Product): { galaxy: string; rows: Row[]; wins: number } {
  const g = GALAXY[p.galaxy.model];
  const n = NEXA[p.id];
  const rows: Row[] = [];
  if (!g || !n) return { galaxy: p.galaxy.model, rows, wins: 0 };

  const price = fromPrice(p);
  if (price < g.price) rows.push({ label: "Price", nexa: money(price), galaxy: `${money(g.price)} new at launch`, result: "win" });

  const diff = (p.gb6 - p.galaxy.gb6) / p.galaxy.gb6;
  rows.push({
    label: "Flagship speed",
    nexa: p.chip,
    galaxy: diff >= 0 ? "Slower on our benchmark" : -diff > 0.08 ? "Same chip generation" : `Within ${Math.max(1, Math.round(-diff * 100))}%`,
    result: diff >= 0 ? "win" : "tie",
  });

  const bat = num(p.battery);
  if (bat > g.battery) rows.push({ label: "Battery", nexa: `${bat.toLocaleString()} mAh`, galaxy: `${g.battery.toLocaleString()} mAh`, result: "win" });
  if (n.wired > g.wired) rows.push({ label: "Wired charging", nexa: `${n.wired}W`, galaxy: `${g.wired}W`, result: "win" });
  if (n.wireless > g.wireless) rows.push({ label: "Wireless charging", nexa: `${n.wireless}W`, galaxy: `${g.wireless}W`, result: "win" });
  if (n.water) rows.push({ label: "Water and dust", nexa: n.water, galaxy: g.water, result: "win" });
  if (n.refresh > g.refresh) rows.push({ label: "Screen refresh", nexa: `${n.refresh}Hz`, galaxy: `${g.refresh}Hz`, result: "win" });
  else if (n.refresh === g.refresh) rows.push({ label: "Screen refresh", nexa: `${n.refresh}Hz`, galaxy: `${g.refresh}Hz`, result: "tie" });
  if (n.cooling) rows.push({ label: "Cooling", nexa: n.cooling, galaxy: "Passive, throttles under load", result: "win" });

  // What Samsung locks away and we build in.
  rows.push({ label: "Tower lock", nexa: "Pick and hold the best tower", galaxy: "Not available", result: "win" });
  rows.push({ label: "Full system access", nexa: "Built in", galaxy: "Bootloader locked by Samsung", result: "win" });
  rows.push({ label: "Network rules per app", nexa: "System-wide, every connection", galaxy: "Basic data toggles", result: "win" });
  rows.push({ label: "Preinstalled apps", nexa: "None you didn't ask for", galaxy: "Samsung and carrier apps", result: "win" });
  rows.push({ label: "Updates", nexa: "Only when you approve", galaxy: "Pushed by Samsung and carrier", result: "win" });
  rows.push({ label: "Setup and support", nexa: "Programmed and tested in our shop", galaxy: "Carrier store", result: "win" });

  return { galaxy: p.galaxy.model, rows, wins: rows.filter((r) => r.result === "win").length };
}

export const saving = (p: Product) => {
  const g = GALAXY[p.galaxy.model];
  return g ? g.price - fromPrice(p) : 0;
};

/** One honest line about price versus the Galaxy. */
export const priceLine = (p: Product) => {
  const s = saving(p);
  return s > 0 ? `${money(s)} less than it cost new. Same flagship class.` : "Priced like a new Galaxy. Built to outwork it.";
};
