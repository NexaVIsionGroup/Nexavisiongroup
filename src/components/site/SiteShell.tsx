import type { ReactNode } from "react";
import { nxDisplay, nxBody } from "./fonts";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

/** Light, plain-English shell for the renovated marketing pages. Covers the old dark body background. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${nxDisplay.variable} ${nxBody.variable} relative isolate min-h-screen bg-nx-paper font-nx-body text-nx-ink antialiased`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
