import localFont from "next/font/local";

// Self-hosted (src/fonts/*-latin.woff2, the Latin variable fonts from Google Fonts) so builds don't
// depend on fonts.gstatic.com, which started failing from Vercel builds on 2026-11-14.
// preload: false on all three — Chrome holds first paint until preloaded fonts
// arrive, and these are also preloaded on routes that never use them (/nexaphone).
// With display: swap + the metric-matched fallback, text paints immediately and swaps.

// Display font — bold, geometric, futuristic
// Used for headlines, CTAs, navigation
export const fontDisplay = localFont({
  src: "../fonts/outfit-latin.woff2",
  variable: "--font-display",
  display: "swap",
  preload: false,
  weight: "400 800",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});

// Body font — clean, readable, professional
// Used for paragraphs, descriptions, body content
export const fontBody = localFont({
  src: "../fonts/space-grotesk-latin.woff2",
  variable: "--font-body",
  display: "swap",
  preload: false,
  weight: "300 700",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});

// Mono font — console panel, code, labels
export const fontMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  variable: "--font-mono",
  display: "swap",
  preload: false,
  weight: "400 700",
  fallback: ["ui-monospace", "Consolas", "monospace"],
});
