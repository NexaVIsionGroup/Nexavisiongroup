import type { Metadata } from "next";
import Hero from "@/components/goodman/Hero";
import DualPath from "@/components/goodman/DualPath";
import BeforeAfter from "@/components/goodman/BeforeAfter";
import StickyCTA from "@/components/goodman/StickyCTA";
import Reveal from "@/components/goodman/Reveal";
import { GOODMAN } from "@/components/goodman/data";

export const metadata: Metadata = {
  title: { absolute: `${GOODMAN.name} — Premium Auto & Fleet Detailing` },
  description:
    "Showroom-grade auto detailing and professional on-site fleet washing. Residential and commercial, across the region.",
};

export default function GoodmanHome() {
  return (
    <main className="relative">
      {/* Nav */}
      <header className="gd-glass sticky top-0 z-40 border-b border-[var(--gd-line)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="gd-display text-lg font-extrabold tracking-tight">
            GOODMAN<span className="text-[var(--gd-cyan)]">.</span>
          </span>
          <div className="flex items-center gap-3">
            <a href={GOODMAN.phoneHref} className="gd-muted hidden text-sm font-medium hover:text-[var(--gd-ice)] sm:block">
              {GOODMAN.phone}
            </a>
            <a href="#contact" className="gd-cta px-4 py-2 text-sm">Get a Quote</a>
          </div>
        </div>
      </header>

      <Hero />

      {/* Dual path */}
      <section id="paths" className="py-24 sm:py-32">
        <Reveal>
          <div className="mx-auto mb-12 max-w-6xl px-6">
            <span className="gd-chip"><span className="gd-chip-dot" />What we do</span>
            <h2 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Two operations, one obsessive standard.
            </h2>
            <p className="gd-muted mt-4 max-w-xl text-base sm:text-lg">
              Whether it&apos;s your weekend car or a fifty-truck fleet, the finish is the same: spotless, and done right.
            </p>
          </div>
        </Reveal>
        <DualPath />
      </section>

      {/* Before / After */}
      <section id="compare" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <span className="gd-chip"><span className="gd-chip-dot" />{GOODMAN.beforeAfter.eyebrow}</span>
              <h2 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">{GOODMAN.beforeAfter.title}</h2>
              <p className="gd-faint mt-4 text-sm">{GOODMAN.beforeAfter.sub}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <BeforeAfter />
          </Reveal>
        </div>
      </section>

      {/* Contact / footer */}
      <footer id="contact" className="gd-topglow border-t border-[var(--gd-line)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="max-w-md text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready for the <span className="bg-gradient-to-r from-[var(--gd-cyan)] to-[var(--gd-blue)] bg-clip-text text-transparent">Goodman finish?</span>
              </h2>
              <p className="gd-muted mt-4 max-w-md text-sm sm:text-base">
                Book a residential detail or request a fleet quote. Serving {GOODMAN.cities.join(", ")}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={GOODMAN.phoneHref} className="gd-cta">Call {GOODMAN.phone}</a>
              <a href={`mailto:${GOODMAN.email}`} className="gd-cta-ghost">Email Us</a>
            </div>
          </div>
          <div className="gd-faint mt-14 flex flex-col gap-2 border-t border-[var(--gd-line)] pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} {GOODMAN.name}. Insured &amp; licensed.</span>
            <span>Residential · Commercial · Fleet</span>
          </div>
        </div>
      </footer>

      <StickyCTA />
    </main>
  );
}
