import { Space_Grotesk, Outfit, JetBrains_Mono } from "next/font/google";

// preload: false on all three — Chrome holds first paint until preloaded fonts
// arrive, and these are also preloaded on routes that never use them (/nexaphone).
// With display: swap + the metric-matched fallback, text paints immediately and swaps.

// Display font — bold, geometric, futuristic
// Used for headlines, CTAs, navigation
export const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700", "800"],
});

// Body font — clean, readable, professional
// Used for paragraphs, descriptions, body content
export const fontBody = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: false,
  weight: ["300", "400", "500", "600", "700"],
});

// Mono font — console panel, code, labels
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700"],
});
