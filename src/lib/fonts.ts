import { Space_Grotesk, Outfit, JetBrains_Mono } from "next/font/google";

// Display font — bold, geometric, futuristic
// Used for headlines, CTAs, navigation
export const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Body font — clean, readable, professional
// Used for paragraphs, descriptions, body content
export const fontBody = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Mono font — console panel, code, labels
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
