import type { Metadata } from "next";
import { Big_Shoulders_Display, IBM_Plex_Sans } from "next/font/google";
import "@/styles/nexaphone.css";
import "@/styles/nexaphone-store.css";
import { CartProvider } from "@/components/nexaphone/cart";
import { LeadProvider } from "@/components/nexaphone/lead";

const display = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-np-display",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-np-body",
  display: "swap",
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
    <div className={`${display.variable} ${body.variable} np`}>
      <LeadProvider>
        <CartProvider>{children}</CartProvider>
      </LeadProvider>
    </div>
  );
}
