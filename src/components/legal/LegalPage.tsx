import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/SiteShell";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <SiteShell>
      <section className="nxs-dark nxs-page-hero nxs-page-hero-sm">
        <div className="nxs-aurora" aria-hidden><i /><i /><i /></div>
        <div className="nxs-wrap" style={{ position: "relative", zIndex: 1 }}>
          <h1 className="nxs-display nxs-grad-glow" style={{ fontSize: "clamp(2.6rem, 6vw, 4.4rem)" }}>{title}</h1>
          <p style={{ marginTop: 14, color: "#9fb4b0" }}>Last updated: {updated}</p>
        </div>
      </section>
      <section className="nxs-light nxs-section" style={{ paddingTop: 60 }}>
        <article className="nxs-wrap nxs-legal">{children}</article>
      </section>
    </SiteShell>
  );
}
