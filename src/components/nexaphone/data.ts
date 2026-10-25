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
    who: "Top of the line: the most frames, the biggest battery, the newest chip.",
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
    who: "Flagship speed with IP69 toughness, for sessions that run all night.",
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
    who: "Proven flagship power at a price that outfits a whole squad.",
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
    who: "Opens into a 7.8in screen: maps, guides and streams beside the game.",
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
    who: "Liquid-cooled, 144Hz, 7,500 mAh. The one built purely for games.",
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
    who: "Fan-cooled. Holds full frame rate for hours, not minutes.",
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
    img: "/nexaphone/placeholder/hands.jpg",
    tag: "Ranked",
    title: "Ranked, from your spot",
    line: "Your desk, your couch, your dorm. The spot is fixed, so the tower should be too. Lock it once and every match starts on the fast band.",
  },
  {
    img: "/nexaphone/placeholder/fps.jpg",
    tag: "FPS",
    title: "Competitive FPS",
    line: "One band hop mid-firefight is a death. Locked on means the phone never hops, so your ping stays flat through the whole round.",
  },
  {
    img: "/nexaphone/placeholder/rpg.jpg",
    tag: "Gacha",
    title: "Gacha, co-op and open world",
    line: "Live events, big patches, four-player sessions. Hold the fast band for the whole night instead of whatever the network hands you.",
  },
  {
    img: "/nexaphone/placeholder/shards.jpg",
    tag: "Streaming",
    title: "Streaming and co-streams",
    line: "Upload that doesn't sag when the tower gets busy. Your stream holds its bitrate while other phones drop to 480p.",
  },
  {
    img: "/nexaphone/placeholder/streaks.jpg",
    tag: "LAN",
    title: "LAN parties and events",
    line: "When 40,000 phones crowd the same towers, pick the one that isn't full and stay on it.",
  },
  {
    img: "/nexaphone/v2/factory.jpg",
    tag: "Work",
    title: "Plant floors and job sites",
    line: "The same lock that holds a match holds a scanner on a line. Steel, concrete and distance stop being the phone's problem.",
  },
];

export const controls = [
  {
    title: "Nothing you didn't ask for",
    body: "No bloat, no ads, no nag screens. The phone boots straight into your games.",
  },
  {
    title: "Runs the tools other phones block",
    body: "Emulators, overlays, macro and network tools get the deeper access they need. " + t("Things a Galaxy keeps behind bars.", "Things a Galaxy simply won't allow."),
  },
  {
    title: "Give your game the fast lane",
    body: "Decide which apps can use data, and on which connection. Your match gets the band; everything else waits its turn.",
  },
  {
    title: "Updates when you say so",
    body: "No forced update the night before a tournament. Nothing installs until you approve it.",
  },
  {
    title: "Game mode that means it",
    body: "Lock the phone to one app for a session: no notifications, no pop-ups, no accidental home swipes. Works for scanners and kiosks too.",
  },
  {
    title: "Arrives ready to play",
    body: "Configured, loaded and tested before it ships. Unbox, sign in, queue up. Team and crew setups available.",
  },
];

export const gallery = [
  { src: "/nexaphone/placeholder/streaks.jpg", alt: "A phone on black with light streaks", tall: true },
  { src: "/nexaphone/placeholder/fps.jpg", alt: "Squad moving through a dark warehouse" },
  { src: "/nexaphone/placeholder/hands.jpg", alt: "Hands holding a phone mid-game" },
  { src: "/nexaphone/v2/g-tower.jpg", alt: "A cell tower against a storm-blue sky", tall: true },
  { src: "/nexaphone/placeholder/rpg.jpg", alt: "Game character art" },
  { src: "/nexaphone/placeholder/shards.jpg", alt: "A phone screen shattering into glass shards", tall: true },
  { src: "/nexaphone/placeholder/charge.jpg", alt: "A phone charging on black" },
];

// How people reach a human: call, text, or the in-page chat form.
export const CONTACT_PHONE = "(864) 301-1806";
export const CONTACT_TEL = "+18643011806";

export const QUOTE_MAIL =
  "mailto:info@nexavisiongroup.com?subject=" + encodeURIComponent("Nexa Pro quote");
export const GUIDE_MAIL =
  "mailto:info@nexavisiongroup.com?subject=" + encodeURIComponent("Nexa Pro technical guide request");
