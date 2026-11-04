import { Bricolage_Grotesque, Atkinson_Hyperlegible } from "next/font/google";

// New marketing site (2026-11 renovation). Scoped to the .nx wrapper so the
// admin, /nexaphone, /vm etc. keep their own fonts.
export const nxDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-nx-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const nxBody = Atkinson_Hyperlegible({
  subsets: ["latin"],
  variable: "--font-nx-body",
  display: "swap",
  weight: ["400", "700"],
});
