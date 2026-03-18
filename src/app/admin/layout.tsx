import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/admin/PWARegister";

export const metadata: Metadata = {
  title: {
    default: "Admin | NexaVision Group",
    template: "%s | NexaVision Admin",
  },
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NexaVision Admin",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00E5CC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PWARegister />
    </>
  );
}
