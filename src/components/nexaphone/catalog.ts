// Store catalog: per-device page content, launch colors, configs and prices.
// Base prices from the owner (rough, 2026-09-22); the larger storage tier is
// a placeholder step up — tune before launch. Like-new condition only.
// Specs sourced from nexaphone-research/devices.json (GSMArena / OEM pages).

import { devices, type Device } from "./data";

export type Finish = "glass" | "matte" | "leather" | "clear";
export type Color = { name: string; hex: string; finish: Finish };
export type Config = { ram: number; storage: string; price: number };
export type SpecGroup = { title: string; rows: [string, string][] };

export type CatalogEntry = {
  slug: string;
  year: number;
  headline: string;
  pitch: string;
  colors: Color[];
  configs: Config[];
  bands: { title: string; body: string };
  perf: { antutu: string; process: string; cpu: string; gpu: string; note: string };
  hud: { camera: string; chip: string; battery: string; signal: string };
  specs: SpecGroup[];
};

export const EDITIONS = [
  {
    id: "pro",
    name: "Nexa Pro",
    body: "Full control opened up, tower lock, pro network tools, no bloat. Ships today.",
    price: 0,
    available: true,
  },
  {
    id: "secure",
    name: "Nexa Secure",
    body: "Locked-down, verified build for regulated fleets.",
    price: 0,
    available: false,
  },
] as const;

export const ADDONS = [
  { id: "case", name: "Armored case", body: "Drop-rated, raised lip for the camera.", price: 39 },
  { id: "glass", name: "Screen armor, installed", body: "Tempered glass fitted in our shop.", price: 19 },
  { id: "care", name: "Nexa Care, 2 years", body: "Extended warranty with priority swaps.", price: 99 },
  { id: "fleet", name: "Fleet setup", body: "Your apps, your tower profile and your settings, preloaded.", price: 25 },
] as const;

export const CONDITION = {
  name: "Like new",
  body: "Every Nexa ships in like-new condition: no visible wear at arm's length, battery health 90% or better, fully tested in our shop.",
};

const c = (name: string, hex: string, finish: Finish = "glass"): Color => ({ name, hex, finish });

export const catalog: Record<string, CatalogEntry> = {
  n15: {
    slug: "nexa-pro-15",
    year: 2025,
    headline: "The fastest phone we have ever rebuilt.",
    pitch:
      "Snapdragon 8 Elite Gen 5, a 165Hz screen and a 7,300 mAh battery, rated IP69K for high-pressure washdown. Nexa Pro 15 is the top of the line, tuned to find and hold the best tower in the building.",
    colors: [c("Infinite Black", "#1a1b1e", "matte"), c("Ultra Violet", "#4f4670", "matte"), c("Sand Storm", "#c8bca6", "matte")],
    configs: [
      { ram: 12, storage: "256GB", price: 1300 },
      { ram: 16, storage: "512GB", price: 1400 },
    ],
    bands: {
      title: "Built for all three US networks",
      body: "Tuned for T-Mobile, AT&T and Verizon, with eSIM. The newest modem in the lineup reaches more bands and holds weak signals longer.",
    },
    perf: {
      antutu: "3.69M",
      process: "3nm",
      cpu: "2 × 4.6GHz + 6 × 3.62GHz Oryon V3",
      gpu: "Adreno 840",
      note: "Scores within a few percent of the Galaxy S26 Ultra.",
    },
    hud: { camera: "Triple 50MP, 3.5× periscope", chip: "Snapdragon 8 Elite Gen 5", battery: "7,300 mAh", signal: "Snapdragon X85 modem" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Elite Gen 5"], ["CPU", "2 × 4.6GHz + 6 × 3.62GHz Oryon V3"], ["Graphics", "Adreno 840"], ["Process", "3nm"], ["Memory", "12GB or 16GB"], ["Storage", "256GB or 512GB"]] },
      { title: "Display", rows: [["Size", "6.78in LTPO AMOLED"], ["Resolution", "1272 × 2772"], ["Refresh", "Up to 165Hz"]] },
      { title: "Battery", rows: [["Capacity", "7,300 mAh"], ["Wired", "Fast charging"], ["Wireless", "50W"]] },
      { title: "Cameras", rows: [["Main", "50MP, OIS"], ["Telephoto", "50MP 3.5× periscope"], ["Ultrawide", "50MP"], ["Selfie", "32MP"]] },
      { title: "Build", rows: [["Water and dust", "IP66, IP68, IP69, IP69K"], ["Frame", "Aluminium"], ["Weight", "About 213g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X85"], ["Carriers", "T-Mobile, AT&T, Verizon"], ["SIM", "Dual nano-SIM + eSIM"], ["Wi-Fi", "Wi-Fi 7"]] },
    ],
  },
  n13: {
    slug: "nexa-pro-13",
    year: 2025,
    headline: "Flagship everything. Washdown proof.",
    pitch:
      "Snapdragon 8 Elite, a QHD+ screen, a 6,000 mAh battery and IP69 protection against hot, high-pressure water. The sweet spot of the lineup, for crews that need flagship speed every day.",
    colors: [c("Black Eclipse", "#15171a"), c("Midnight Ocean", "#1c2a42", "leather"), c("Arctic Dawn", "#dde2e7")],
    configs: [
      { ram: 12, storage: "256GB", price: 800 },
      { ram: 16, storage: "512GB", price: 900 },
    ],
    bands: {
      title: "Built for all three US networks",
      body: "Tuned for T-Mobile, AT&T and Verizon, with eSIM. The Snapdragon X80 modem holds on in basements, stairwells and steel buildings.",
    },
    perf: {
      antutu: "2.69M",
      process: "3nm",
      cpu: "2 × 4.32GHz + 6 × 3.53GHz Oryon V2",
      gpu: "Adreno 830",
      note: "Same chip family as the Galaxy S25 Ultra, single-core effectively tied.",
    },
    hud: { camera: "Triple 50MP, Hasselblad tuned", chip: "Snapdragon 8 Elite", battery: "6,000 mAh", signal: "Snapdragon X80 modem" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Elite"], ["CPU", "2 × 4.32GHz + 6 × 3.53GHz Oryon V2"], ["Graphics", "Adreno 830"], ["Process", "3nm"], ["Memory", "12GB or 16GB"], ["Storage", "256GB or 512GB"]] },
      { title: "Display", rows: [["Size", "6.82in LTPO 4.1 AMOLED"], ["Resolution", "1440 × 3168"], ["Refresh", "1 to 120Hz"], ["Peak brightness", "4,500 nits"]] },
      { title: "Battery", rows: [["Capacity", "6,000 mAh"], ["Wired", "80W (US)"], ["Wireless", "50W, 10W reverse"]] },
      { title: "Cameras", rows: [["Main", "50MP Sony LYT-808, OIS"], ["Telephoto", "50MP 3× periscope"], ["Ultrawide", "50MP"], ["Selfie", "32MP"]] },
      { title: "Build", rows: [["Water and dust", "IP68 and IP69"], ["Front", "Ceramic Guard"], ["Weight", "About 211g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X80"], ["Carriers", "T-Mobile, AT&T, Verizon"], ["SIM", "Dual nano-SIM + eSIM"], ["Wi-Fi", "Wi-Fi 7"]] },
    ],
  },
  n12: {
    slug: "nexa-pro-12",
    year: 2024,
    headline: "Proven power, priced for the fleet.",
    pitch:
      "Snapdragon 8 Gen 3, a QHD+ screen and wireless charging. Cool-running, proven in the field, and the best value per unit when you are equipping a whole crew.",
    colors: [c("Silky Black", "#1b1c1f"), c("Flowy Emerald", "#2d5647")],
    configs: [
      { ram: 12, storage: "256GB", price: 600 },
      { ram: 16, storage: "512GB", price: 680 },
    ],
    bands: {
      title: "Built for all three US networks",
      body: "Tuned for T-Mobile, AT&T and Verizon, with eSIM and the Snapdragon X75 modem.",
    },
    perf: {
      antutu: "2.08M",
      process: "4nm",
      cpu: "1 × 3.3GHz + 5 × 3.2GHz + 2 × 2.3GHz",
      gpu: "Adreno 750",
      note: "Neck and neck with the Galaxy S24 Ultra.",
    },
    hud: { camera: "50MP + 64MP 3× periscope", chip: "Snapdragon 8 Gen 3", battery: "5,400 mAh", signal: "Snapdragon X75 modem" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Gen 3"], ["CPU", "1 × 3.3GHz + 5 × 3.2GHz + 2 × 2.3GHz"], ["Graphics", "Adreno 750"], ["Process", "4nm"], ["Memory", "12GB or 16GB"], ["Storage", "256GB or 512GB"]] },
      { title: "Display", rows: [["Size", "6.82in LTPO AMOLED"], ["Resolution", "1440 × 3168"], ["Refresh", "1 to 120Hz"], ["Peak brightness", "4,500 nits"]] },
      { title: "Battery", rows: [["Capacity", "5,400 mAh"], ["Wired", "80W (US)"], ["Wireless", "50W, 10W reverse"]] },
      { title: "Cameras", rows: [["Main", "50MP Sony LYT-808, OIS"], ["Telephoto", "64MP 3× periscope"], ["Ultrawide", "48MP"], ["Selfie", "32MP"]] },
      { title: "Build", rows: [["Water and dust", "IP65"], ["Front", "Gorilla Glass Victus 2"], ["Weight", "About 220g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X75"], ["Carriers", "T-Mobile, AT&T, Verizon"], ["SIM", "Dual nano-SIM + eSIM"], ["Wi-Fi", "Wi-Fi 7"]] },
    ],
  },
  n11: {
    slug: "nexa-pro-11",
    year: 2023,
    headline: "Your way into Nexa Pro.",
    pitch:
      "Snapdragon 8 Gen 2 and a QHD+ screen, the same performance class as the Galaxy S23 Ultra. The lowest-cost way to put tower lock in every pocket.",
    colors: [c("Titan Black", "#1f2225", "matte"), c("Eternal Green", "#2a4a3e")],
    configs: [
      { ram: 8, storage: "128GB", price: 500 },
      { ram: 16, storage: "256GB", price: 560 },
    ],
    bands: {
      title: "Built for all three US networks",
      body: "Tuned for T-Mobile, AT&T and Verizon on the North American model, with the Snapdragon X70 modem.",
    },
    perf: {
      antutu: "1.4M+",
      process: "4nm",
      cpu: "1 × 3.2GHz + 4 × 2.8GHz + 3 × 2.0GHz",
      gpu: "Adreno 740",
      note: "Multi-core within 1% of the Galaxy S23 Ultra.",
    },
    hud: { camera: "50MP Sony IMX890, OIS", chip: "Snapdragon 8 Gen 2", battery: "5,000 mAh", signal: "Snapdragon X70 modem" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Gen 2"], ["CPU", "1 × 3.2GHz + 4 × 2.8GHz + 3 × 2.0GHz"], ["Graphics", "Adreno 740"], ["Process", "4nm"], ["Memory", "8GB or 16GB"], ["Storage", "128GB or 256GB"]] },
      { title: "Display", rows: [["Size", "6.7in LTPO3 AMOLED"], ["Resolution", "1440 × 3216"], ["Refresh", "1 to 120Hz"]] },
      { title: "Battery", rows: [["Capacity", "5,000 mAh"], ["Wired", "80W (US)"]] },
      { title: "Cameras", rows: [["Main", "50MP Sony IMX890, OIS"], ["Telephoto", "32MP 2× portrait"], ["Ultrawide", "48MP"], ["Selfie", "16MP"]] },
      { title: "Build", rows: [["Water and dust", "IP64"], ["Glass", "Gorilla Glass Victus"], ["Weight", "About 205g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X70"], ["Carriers", "T-Mobile, AT&T, Verizon"], ["SIM", "Dual nano-SIM"], ["Wi-Fi", "Wi-Fi 7"]] },
    ],
  },
  n10: {
    slug: "nexa-pro-10",
    year: 2022,
    headline: "Flagship screen. Entry price.",
    pitch:
      "A QHD+ 120Hz screen, Snapdragon 8 Gen 1 and a 5,000 mAh battery with 50W wireless charging. The most affordable way to put tower lock and full control in a crew's pockets.",
    colors: [c("Volcanic Black", "#1c1d20", "matte"), c("Emerald Forest", "#23443a", "matte")],
    configs: [
      { ram: 8, storage: "128GB", price: 375 },
      { ram: 12, storage: "256GB", price: 425 },
    ],
    bands: {
      title: "Built for all three US networks",
      body: "The North American model runs on T-Mobile, AT&T and Verizon with a physical SIM and the Snapdragon X65 modem.",
    },
    perf: {
      antutu: "1.0M",
      process: "4nm",
      cpu: "1 × 3.0GHz + 3 × 2.5GHz + 4 × 1.8GHz",
      gpu: "Adreno 730",
      note: "Same chip as the Galaxy S22 Ultra.",
    },
    hud: { camera: "48MP main + 50MP ultrawide", chip: "Snapdragon 8 Gen 1", battery: "5,000 mAh", signal: "Snapdragon X65 modem" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Gen 1"], ["CPU", "1 × 3.0GHz + 3 × 2.5GHz + 4 × 1.8GHz"], ["Graphics", "Adreno 730"], ["Process", "4nm"], ["Memory", "8GB or 12GB"], ["Storage", "128GB or 256GB"]] },
      { title: "Display", rows: [["Size", "6.7in LTPO2 AMOLED"], ["Resolution", "1440 × 3216"], ["Refresh", "1 to 120Hz"]] },
      { title: "Battery", rows: [["Capacity", "5,000 mAh"], ["Wired", "65W (US)"], ["Wireless", "50W, reverse charging"]] },
      { title: "Cameras", rows: [["Main", "48MP, OIS"], ["Ultrawide", "50MP, 150°"], ["Telephoto", "8MP 3.3×"], ["Selfie", "32MP"]] },
      { title: "Build", rows: [["Front", "Gorilla Glass Victus"], ["Weight", "About 201g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X65"], ["Carriers", "T-Mobile, AT&T, Verizon"], ["SIM", "Nano-SIM"], ["Wi-Fi", "Wi-Fi 6"]] },
    ],
  },
  nfold: {
    slug: "nexa-pro-fold",
    year: 2023,
    headline: "A phone in your pocket. A tablet in your hands.",
    pitch:
      "Opens into a 7.8in screen for schematics, maps, manifests and dashboards, then folds back into a normal phone. All the tower lock, twice the screen.",
    colors: [c("Voyager Black", "#1b1b1d", "leather"), c("Emerald Dusk", "#34443f")],
    configs: [
      { ram: 16, storage: "512GB", price: 1500 },
      { ram: 16, storage: "1TB", price: 1650 },
    ],
    bands: {
      title: "Built for all three US networks",
      body: "Tuned for T-Mobile, AT&T and Verizon, with eSIM and two physical SIM slots.",
    },
    perf: {
      antutu: "1.51M",
      process: "4nm",
      cpu: "1 × 3.2GHz + 4 × 2.8GHz + 3 × 2.0GHz",
      gpu: "Adreno 740",
      note: "Matches the Galaxy Z Fold5 within a few percent.",
    },
    hud: { camera: "48MP + 64MP 3× telephoto", chip: "Snapdragon 8 Gen 2", battery: "4,805 mAh", signal: "Snapdragon X70 modem" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Gen 2"], ["Graphics", "Adreno 740"], ["Memory", "16GB"], ["Storage", "512GB or 1TB"]] },
      { title: "Displays", rows: [["Inside", "7.82in, 2268 × 2440, 120Hz"], ["Outside", "6.31in, 1116 × 2484, 120Hz"], ["Peak brightness", "2,800 nits"]] },
      { title: "Battery", rows: [["Capacity", "4,805 mAh"], ["Wired", "67W"]] },
      { title: "Cameras", rows: [["Main", "48MP, 1/1.43in, OIS"], ["Telephoto", "64MP 3×, OIS"], ["Ultrawide", "48MP"], ["Selfie", "32MP outside, 20MP inside"]] },
      { title: "Build", rows: [["Water", "IPX4"], ["Hinge", "Titanium alloy parts"], ["Weight", "About 239g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X70"], ["Carriers", "T-Mobile, AT&T, Verizon"], ["SIM", "Two nano-SIM + eSIM"], ["Wi-Fi", "Wi-Fi 7"]] },
    ],
  },
  nrm11: {
    slug: "nexa-turbo-11",
    year: 2025,
    headline: "Liquid cooled. It never slows down.",
    pitch:
      "A real liquid-cooling loop, a 24,000 RPM fan and Snapdragon 8 Elite Gen 5. Where other phones throttle after a few minutes, Nexa Turbo 11 holds full speed for hours: video, mapping, AI workloads, always-on stations.",
    colors: [c("Nightfreeze", "#15171c", "clear"), c("Subzero", "#c9ced6", "clear"), c("Shadow", "#101113", "matte")],
    configs: [
      { ram: 12, storage: "256GB", price: 999 },
      { ram: 16, storage: "512GB", price: 1099 },
      { ram: 24, storage: "1TB", price: 1249 },
    ],
    bands: {
      title: "Best on T-Mobile and AT&T",
      body: "Runs on T-Mobile and AT&T with a physical SIM. Not recommended for Verizon, which relies on a band this phone lacks.",
    },
    perf: {
      antutu: "4.07M",
      process: "3nm",
      cpu: "2 × 4.6GHz + 6 × 3.62GHz Oryon V3",
      gpu: "Adreno 840",
      note: "Highest benchmark in the lineup, and it holds it under sustained load.",
    },
    hud: { camera: "50MP main, OIS", chip: "Snapdragon 8 Elite Gen 5", battery: "7,500 mAh", signal: "Liquid cooling + 24,000 RPM fan" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Elite Gen 5"], ["CPU", "2 × 4.6GHz + 6 × 3.62GHz Oryon V3"], ["Graphics", "Adreno 840"], ["Cooling", "Liquid loop, 24,000 RPM fan, vapor chamber"], ["Memory", "12GB to 24GB"], ["Storage", "256GB to 1TB"]] },
      { title: "Display", rows: [["Size", "6.85in AMOLED, no notch"], ["Resolution", "1216 × 2688"], ["Refresh", "144Hz"]] },
      { title: "Battery", rows: [["Capacity", "7,500 mAh"], ["Wired", "80W"], ["Wireless", "80W"]] },
      { title: "Cameras", rows: [["Main", "50MP, OIS"], ["Ultrawide", "50MP"], ["Selfie", "16MP under the screen"]] },
      { title: "Build", rows: [["Water", "IPX8"], ["Weight", "About 230g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X85"], ["Carriers", "T-Mobile, AT&T"], ["SIM", "Dual nano-SIM"], ["Wi-Fi", "Wi-Fi 7"]] },
    ],
  },
  nrm10: {
    slug: "nexa-turbo-10",
    year: 2024,
    headline: "Built-in fan. Full speed, all shift.",
    pitch:
      "Snapdragon 8 Elite with a 23,000 RPM fan, liquid metal and a 7,050 mAh battery. Made for always-on workloads that would cook an ordinary phone.",
    colors: [c("Shadow", "#16181b", "matte"), c("Dusk", "#1d1f27", "clear"), c("Moonlight", "#b8bdc5", "clear")],
    configs: [
      { ram: 12, storage: "256GB", price: 599 },
      { ram: 16, storage: "512GB", price: 699 },
      { ram: 24, storage: "1TB", price: 849 },
    ],
    bands: {
      title: "Best on T-Mobile and AT&T",
      body: "Runs on T-Mobile and AT&T with a physical SIM. Not recommended for Verizon, which relies on a band this phone lacks.",
    },
    perf: {
      antutu: "2.69M",
      process: "3nm",
      cpu: "2 × 4.32GHz + 6 × 3.53GHz Oryon V2",
      gpu: "Adreno 830",
      note: "Matches the Galaxy S25 Ultra, and keeps going when it gets hot.",
    },
    hud: { camera: "50MP main, OIS", chip: "Snapdragon 8 Elite", battery: "7,050 mAh", signal: "23,000 RPM turbofan" },
    specs: [
      { title: "Performance", rows: [["Chip", "Snapdragon 8 Elite"], ["CPU", "2 × 4.32GHz + 6 × 3.53GHz Oryon V2"], ["Graphics", "Adreno 830"], ["Cooling", "23,000 RPM fan, vapor chamber, liquid metal"], ["Memory", "12GB to 24GB"], ["Storage", "256GB to 1TB"]] },
      { title: "Display", rows: [["Size", "6.85in AMOLED, no notch"], ["Resolution", "1216 × 2688"], ["Refresh", "144Hz"], ["Peak brightness", "2,000 nits"]] },
      { title: "Battery", rows: [["Capacity", "7,050 mAh"], ["Wired", "Up to 100W"]] },
      { title: "Cameras", rows: [["Main", "50MP, OIS"], ["Ultrawide", "50MP"], ["Selfie", "16MP under the screen"]] },
      { title: "Build", rows: [["Water and dust", "IP54"], ["Weight", "About 229g"]] },
      { title: "Connectivity", rows: [["Modem", "Snapdragon X80"], ["Carriers", "T-Mobile, AT&T"], ["SIM", "Dual nano-SIM"], ["Wi-Fi", "Wi-Fi 7"]] },
    ],
  },
};

export type Product = Device & CatalogEntry;

export const products: Product[] = devices.map((d) => ({ ...d, ...catalog[d.id] }));
export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const fromPrice = (p: Product) => Math.min(...p.configs.map((x) => x.price));
export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });
