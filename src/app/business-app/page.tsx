import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Rise } from "@/components/site/Rise";
import { Junction } from "@/components/site/Junction";
import { AppTour } from "@/components/site/AppTour";
import { AppWall, Closer } from "@/components/site/Chapters";
import { whyOwn, moreFeatures, CHECKUP_HREF } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Your Business App",
  description:
    "Your own business app: email inbox, private Drive, quotes, invoices and payments, online orders, Google review replies, team tools and a website you edit yourself. Built for you, run by us.",
};

export default function BusinessAppPage() {
  return (
    <SiteShell>
      <section className="nxs-dark nxs-page-hero nxs-ba-hero">
        <div className="nxs-aurora" aria-hidden><i /><i /><i /></div>
        <div className="nxs-gridlines" aria-hidden />
        <div className="nxs-grain" aria-hidden />
        <div className="nxs-wrap" style={{ position: "relative", zIndex: 1 }}>
          <p className="nxs-kicker"><span className="nxs-live" />Your business app</p>
          <Rise as="h1" immediate text="Your whole business, in one app." className="nxs-display nxs-page-h1 nxs-grad-glow" delay={0.1} />
          <p className="nxs-hero-sub">
            Not another subscription shared with a million other companies. An app built for your business, with your name on it: your inbox, your files, your quotes, your payments and your customers, on your phone and your computer.
          </p>
          <div className="nxs-hero-ctas">
            <Link href={CHECKUP_HREF} className="nxs-btn nxs-btn-glow">Get a free check-up</Link>
            <Link href="#tour" className="nxs-btn nxs-btn-ghost">Take the tour</Link>
          </div>
          <div id="tour" style={{ scrollMarginTop: 90 }}>
            <AppTour />
          </div>
        </div>
      </section>

      <Junction src="/site/scenes/kitchen-v1.webp" from="dark" to="light" focus="50% 45%" />

      <section className="nxs-light nxs-section" style={{ paddingTop: 20 }}>
        <div className="nxs-wrap">
          <Rise text="Why your own app beats ten different ones." className="nxs-display nxs-h2 nxs-grad" />
          <div className="nxs-how">
            {whyOwn.map((w) => (
              <div key={w.title}>
                <Check size={20} strokeWidth={3} aria-hidden />
                <h3 className="nxs-display">{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "clamp(70px, 9vw, 110px)" }}>
            <Rise text="And it can do a lot more." className="nxs-display nxs-h2 nxs-grad" />
            <p className="nxs-lede" style={{ marginTop: 18 }}>Pick what fits. Every one of these is already running for a client.</p>
            <ul className="nxs-more">
              {moreFeatures.map((m) => (
                <li key={m.title}><Plus size={20} aria-hidden /><div><b>{m.title}</b><p>{m.text}</p></div></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Junction src="/site/scenes/phone-v1.webp" from="light" to="dark" focus="45% 50%" />
      <AppWall />
      <Closer />
    </SiteShell>
  );
}
