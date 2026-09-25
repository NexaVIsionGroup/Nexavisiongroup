import { t } from "./theme";

// Nexa Pro content. Device numbers come from the Stage 0 research
// (C:\websites\nexavisiongroup\nexaphone-research\devices.json, GSMArena
// Geekbench 6 figures). Copy is first-pass and gets tuned section by section.

export type Family = "flagship" | "fold" | "turbo";

export type Device = {
  id: string;
  name: string;
  base: string;
  family: Family;
  tagline: string;
  chip: string;
  gb6: number;
  galaxy: { model: string; gb6: number };
  display: string;
  battery: string;
  memory: string;
  toughness: string;
  carriers: string;
  /** One line on who this phone is for (lineup cards). */
  who: string;
  /** Three short spec chips for cards. */
  chips: [string, string, string];
  stock: "in" | "low" | "out";
  bestSeller?: boolean;
  /** Shape + finish for the placeholder render until real photos exist. */
  render: { island: "round" | "offset" | "wide" | "fan" | "wrap"; body: string; accent: string };
};

export const devices: Device[] = [
  {
    id: "n15",
    name: "Nexa Pro 15",
    base: "OnePlus 15",
    family: "flagship",
    tagline: "The fastest thing we sell. A 7,300 mAh battery that shrugs off a double shift.",
    chip: "Snapdragon 8 Elite Gen 5",
    gb6: 11062,
    galaxy: { model: "Galaxy S26 Ultra", gb6: 11566 },
    display: "6.78in, up to 165Hz",
    battery: "7,300 mAh",
    memory: "12/256GB, 16/512GB",
    toughness: "IP68 and IP69K",
    carriers: "T-Mobile, AT&T, Verizon. eSIM.",
    who: "Top of the line for sites that want the newest everything.",
    chips: ["165Hz screen", "7,300 mAh", "IP69K"],
    stock: "in",
    render: { island: "wide", body: "#2A2F33", accent: "#8C9499" },
  },
  {
    id: "n13",
    name: "Nexa Pro 13",
    base: "OnePlus 13",
    family: "flagship",
    tagline: "Flagship speed, washdown-proof, and the sweet spot of the lineup.",
    chip: "Snapdragon 8 Elite",
    gb6: 9278,
    galaxy: { model: "Galaxy S25 Ultra", gb6: 9846 },
    display: "6.82in QHD+, 120Hz",
    battery: "6,000 mAh",
    memory: "12/256GB, 16/512GB",
    toughness: "IP68 and IP69",
    carriers: "T-Mobile, AT&T, Verizon. eSIM.",
    who: "Flagship speed with washdown-proof toughness.",
    chips: ["QHD+ 120Hz", "6,000 mAh", "IP69"],
    stock: "in",
    render: { island: "round", body: "#1E2A36", accent: "#6F8499" },
  },
  {
    id: "n12",
    name: "Nexa Pro 12",
    base: "OnePlus 12",
    family: "flagship",
    tagline: "Proven, cool-running, and priced to deploy by the dozen.",
    chip: "Snapdragon 8 Gen 3",
    gb6: 6800,
    galaxy: { model: "Galaxy S24 Ultra", gb6: 7076 },
    display: "6.82in QHD+, 120Hz",
    battery: "5,400 mAh",
    memory: "12/256GB, 16/512GB",
    toughness: "IP65",
    carriers: "T-Mobile, AT&T, Verizon. eSIM.",
    who: "Proven flagship power, priced to equip a whole crew.",
    chips: ["QHD+ 120Hz", "5,400 mAh", "50W wireless"],
    stock: "in",
    render: { island: "offset", body: "#253028", accent: "#7F9484" },
  },
  {
    id: "n11",
    name: "Nexa Pro 11",
    base: "OnePlus 11",
    family: "flagship",
    tagline: "The entry ticket to Nexa Pro. Still quicker than most phones sold today.",
    chip: "Snapdragon 8 Gen 2",
    gb6: 5043,
    galaxy: { model: "Galaxy S23 Ultra", gb6: 5077 },
    display: "6.7in QHD+, 120Hz",
    battery: "5,000 mAh",
    memory: "8/128GB, 16/256GB",
    toughness: "IP64",
    carriers: "T-Mobile, AT&T, Verizon. eSIM.",
    who: "Flagship-class speed at a mid-range price.",
    chips: ["QHD+ 120Hz", "5,000 mAh", "80W charge"],
    stock: "in",
    render: { island: "round", body: "#1F2326", accent: "#6B7277" },
  },
  {
    id: "n10",
    name: "Nexa Pro 10",
    base: "OnePlus 10 Pro",
    family: "flagship",
    tagline: "Flagship QHD+ screen and Snapdragon 8 Gen 1 at the lowest price in the lineup.",
    chip: "Snapdragon 8 Gen 1",
    gb6: 3439,
    galaxy: { model: "Galaxy S22 Ultra", gb6: 3933 },
    display: "6.7in QHD+, 120Hz",
    battery: "5,000 mAh",
    memory: "8/128GB, 12/256GB",
    toughness: "Splash resistant",
    carriers: "T-Mobile, AT&T, Verizon. Physical SIM.",
    who: "Our best seller. The easiest way to put tower lock in every pocket.",
    chips: ["QHD+ 120Hz", "5,000 mAh", "50W wireless"],
    stock: "in",
    bestSeller: true,
    render: { island: "wrap", body: "#1c1d20", accent: "#6d7277" },
  },
  {
    id: "nfold",
    name: "Nexa Pro Fold",
    base: "OnePlus Open",
    family: "fold",
    tagline: "A phone that opens into a 7.8in tablet. Schematics, maps and manifests, full size.",
    chip: "Snapdragon 8 Gen 2",
    gb6: 5214,
    galaxy: { model: "Galaxy Z Fold5", gb6: 5396 },
    display: "7.82in inside, 6.31in outside",
    battery: "4,805 mAh",
    memory: "16/512GB",
    toughness: "IPX4",
    carriers: "T-Mobile, AT&T, Verizon. eSIM.",
    who: "A phone that opens into a 7.8in tablet for maps, plans and dashboards.",
    chips: ["7.82in inside", "4,805 mAh", "Foldable"],
    stock: "in",
    render: { island: "round", body: "#2B2A27", accent: "#958F84" },
  },
  {
    id: "nrm11",
    name: "Nexa Turbo 11",
    base: "REDMAGIC 11 Pro",
    family: "turbo",
    tagline: "Liquid-cooled with a built-in fan. Full speed for hours, not minutes.",
    chip: "Snapdragon 8 Elite Gen 5",
    gb6: 11259,
    galaxy: { model: "Galaxy S26 Ultra", gb6: 11566 },
    display: "6.85in, 144Hz",
    battery: "7,500 mAh",
    memory: "12/256GB to 24GB/1TB",
    toughness: "IPX8",
    carriers: "Best on T-Mobile and AT&T. Physical SIM.",
    who: "Liquid-cooled. Holds full speed for hours of heavy work.",
    chips: ["144Hz screen", "7,500 mAh", "Liquid cooled"],
    stock: "in",
    render: { island: "fan", body: "#16181B", accent: "#E0483A" },
  },
  {
    id: "nrm10",
    name: "Nexa Turbo 10",
    base: "REDMAGIC 10 Pro",
    family: "turbo",
    tagline: "Active cooling and a 7,050 mAh battery for always-on workloads.",
    chip: "Snapdragon 8 Elite",
    gb6: 9833,
    galaxy: { model: "Galaxy S25 Ultra", gb6: 9846 },
    display: "6.85in, 144Hz",
    battery: "7,050 mAh",
    memory: "12/256GB to 24GB/1TB",
    toughness: "IP54",
    carriers: "Best on T-Mobile and AT&T. Physical SIM.",
    who: "Fan-cooled for always-on workloads that cook ordinary phones.",
    chips: ["144Hz screen", "7,050 mAh", "Fan cooled"],
    stock: "in",
    render: { island: "fan", body: "#1C1D22", accent: "#C9CDD4" },
  },
];

export const families: { id: Family | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "flagship", label: "Flagship" },
  { id: "fold", label: "Foldable" },
  { id: "turbo", label: "Turbo" },
];

export const places = [
  {
    img: "/nexaphone/v2/factory.jpg",
    title: "Plant floors",
    line: "Steel, machinery and concrete swallow signal. Stay on the one tower that actually reaches the line.",
  },
  {
    img: "/nexaphone/v3/work-warehouse.jpg",
    title: "Warehouses",
    line: "Racking turns a building into a maze. Scanners and handhelds stay connected aisle to aisle.",
  },
  {
    img: "/nexaphone/v3/work-construction.jpg",
    title: "Job sites",
    line: "Site trailers and new builds sit at the edge of coverage. Lock onto the strong tower across town, not the weak one next door.",
  },
  {
    img: "/nexaphone/v3/work-field.jpg",
    title: "Remote sites",
    line: "Pump stations, equipment rooms, rooftops and basements. A phone installed there stays connected, day and night.",
  },
  {
    img: "/nexaphone/v3/work-venue.jpg",
    title: "Venues and events",
    line: "When 40,000 phones crowd the same towers, pick the one that isn't full.",
  },
  {
    img: "/nexaphone/v2/fleet.jpg",
    title: "Docks and yards",
    line: "Shipping offices, loading docks and gate houses. Scanners and check-in stations that never drop.",
  },
];

export const controls = [
  {
    title: "Nothing you didn't ask for",
    body: "No bloat, no ads, no nag screens. The phone boots straight into your work.",
  },
  {
    title: "Runs the tools other phones block",
    body: "Professional network, diagnostic and automation apps get the deeper access they need. " + t("Things a Galaxy keeps behind bars.", "Things a Galaxy simply won't allow."),
  },
  {
    title: "Your rules for every app",
    body: "Decide which apps can use data, and on which connection. Everything else stays quiet.",
  },
  {
    title: "Updates when you say so",
    body: "A phone in the field never changes overnight. Nothing installs until you approve it.",
  },
  {
    title: "One job, done well",
    body: "Lock a phone to a single app for scanners, check-in stations and point of sale.",
  },
  {
    title: "Arrives ready for your fleet",
    body: "Configured, loaded and tested before it ships. Unbox, sign in, go to work.",
  },
];

export const gallery = [
  { src: "/nexaphone/v2/g-tunnel.jpg", alt: "A phone glowing in a dark blue tunnel", tall: true },
  { src: "/nexaphone/v2/g-circuit-lens.jpg", alt: "Circuit board seen through a lens ring" },
  { src: "/nexaphone/v2/g-welder.jpg", alt: "A welder working in blue light" },
  { src: "/nexaphone/v2/g-tower.jpg", alt: "A cell tower against a storm-blue sky", tall: true },
  { src: "/nexaphone/v2/g-rugged.jpg", alt: "A rugged dark phone case close up" },
  { src: "/nexaphone/v2/g-bokeh.jpg", alt: "A phone held in low light", tall: true },
  { src: "/nexaphone/v2/g-board.jpg", alt: "Macro of a circuit board" },
];

// How people reach a human: call, text, or the in-page chat form.
export const CONTACT_PHONE = "(864) 301-1806";
export const CONTACT_TEL = "+18643011806";

export const QUOTE_MAIL =
  "mailto:info@nexavisiongroup.com?subject=" + encodeURIComponent("Nexa Pro quote");
export const GUIDE_MAIL =
  "mailto:info@nexavisiongroup.com?subject=" + encodeURIComponent("Nexa Pro technical guide request");
