import type { Metadata } from "next";
import { fontDisplay, fontBody, fontMono } from "@/lib/fonts";
import { Providers } from "@/components/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "NexaVision Group | Websites and Business Apps",
    template: "%s | NexaVision Group",
  },
  description:
    "We build your website and your own business app: inbox, file Drive, quotes, invoices, payments and more.",
  metadataBase: new URL("https://nexavisiongroup.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "NexaVision Group",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-nv-abyss text-nv-text-primary font-body antialiased">
        {/* Background grid + gradient atmosphere */}
        <div className="fixed inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-nv-gradient-hero" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 bg-nv-grid bg-nv-grid animate-nv-grid-pulse"
            style={{
              maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            }}
          />
        </div>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
