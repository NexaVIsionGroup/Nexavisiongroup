"use client";

import { ContactModalProvider } from "@/components/ui/ContactModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ContactModalProvider>
      {children}
    </ContactModalProvider>
  );
}
