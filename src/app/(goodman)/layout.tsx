import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import SmoothScroll from "@/components/goodman/SmoothScroll";
import "@/styles/goodman.css";

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-gd-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gd-body",
  display: "swap",
});

// Temp home lives under nexavisiongroup.com — keep it out of the index until
// it moves to Goodman's own domain.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GoodmanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} gd-root`}>
      <SmoothScroll>{children}</SmoothScroll>
    </div>
  );
}
