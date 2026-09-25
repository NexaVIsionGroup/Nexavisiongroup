import type { Metadata } from "next";
import { JAIL_THEME } from "../../components/nexaphone/theme";
import { Big_Shoulders_Display, IBM_Plex_Sans } from "next/font/google";
import "@/styles/nexaphone.css";
import "@/styles/nexaphone-store.css";
import "@/styles/nexaphone-shop.css";
import { CartProvider } from "@/components/nexaphone/cart";
import { LeadProvider } from "@/components/nexaphone/lead";

// Chrome holds first paint until preloaded fonts land, so keep the preloaded set
// tiny: one display weight (700 requests resolve to 800), and body text paints in
// the metric-matched fallback and swaps in (no preload). Measured on slow 4G:
// 5 files / 160KB gated FCP at ~2.7s.
const display = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-np-display",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-np-body",
  display: "swap",
  preload: false,
});

// Pre-launch home under nexavisiongroup.com — keep it out of the index until
// it moves to its own domain.
export const metadata: Metadata = {
  title: { absolute: "Nexa Pro | Phones that pick the tower" },
  description:
    "Flagship phones rebuilt for work. Nexa Pro locks onto the strongest tower in range and keeps you on the fastest connection it offers.",
  robots: { index: false, follow: false },
};

export default function NexaPhoneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} np`} data-jail={JAIL_THEME}>
      <LeadProvider>
        <CartProvider>{children}</CartProvider>
      </LeadProvider>
    </div>
  );
}
