import type { ReactNode } from "react";
import "@/styles/nexa-site.css";
import { nxDisplay, nxBody } from "./fonts";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

/** Shell for the renovated marketing pages. Scoped under .nxs; covers the old body background. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${nxDisplay.variable} ${nxBody.variable} nxs`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
