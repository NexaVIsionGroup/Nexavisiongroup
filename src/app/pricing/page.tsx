import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Rise } from "@/components/site/Rise";
import { Junction } from "@/components/site/Junction";
import { Pricing, Closer } from "@/components/site/Chapters";
import { Faq } from "@/components/site/Faq";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple starting prices: websites from $1,500, a website with your own business app from $4,500, custom builds from $10,000. Care plans from $99 a month.",
};

const COLS = ["Website", "Website and Business App", "Custom Build"];
// true = included, "pick" = choose what you need, false = not included
const ROWS: [string, (boolean | string)[]][] = [
  ["Custom design that works on every phone", [true, true, true]],
  ["Google set up so customers can find you", [true, true, true]],
  ["Edit your own hours, menu, photos and text", [true, true, true]],
  ["Your own email inbox", [false, true, true]],
  ["Your own private Drive for files and photos", [false, true, true]],
  ["Quotes, invoices and online payments", [false, true, true]],
  ["Customer accounts", [false, true, true]],
  ["Alerts on your phone", [false, true, true]],
  ["Google review replies", [false, "Add-on", true]],
  ["Online ordering or an online store", [false, "Add-on", true]],
  ["Your own Android app", [false, false, true]],
  ["Staff, vendor and multi-location tools", [false, false, true]],
];

const FAQ = [
  { q: "Why do you show “starting at” prices?", a: "Every business is different. A five-page site for a café costs less than a site with online ordering and a staff app. After your free check-up you get an exact price in writing, and that's the price you pay." },
  { q: "Are there monthly fees?", a: "Hosting and upkeep are covered by a Care Plan: $99 a month for websites, $249 a month for websites with a business app. That includes security, updates, small changes and support." },
  { q: "Can I start with a website and add the app later?", a: "Yes. Many clients start with a website and add their inbox, Drive, quotes or ordering once they see how it helps." },
  { q: "How long does it take?", a: "Most websites take a few weeks. Business apps and custom builds take longer depending on the features. You get a timeline with your quote." },
  { q: "Do I own my website and app?", a: "Yes. They're built for your business with your name on them. We host and maintain them so you don't have to think about it." },
  { q: "Do you take on large projects?", a: "Yes. We build full operations platforms with estimates, employees, vendors, file storage and Android apps. Large and multi-location projects are quoted individually." },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <span className="nxs-cmp-yes" aria-label="Included"><Check size={18} strokeWidth={3} /></span>;
  if (v === false) return <span className="nxs-cmp-no" aria-label="Not included"><Minus size={18} /></span>;
  return <span className="nxs-cmp-pick">{v}</span>;
}

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="nxs-dark nxs-page-hero">
        <div className="nxs-aurora" aria-hidden><i /><i /><i /></div>
        <div className="nxs-grain" aria-hidden />
        <div className="nxs-wrap" style={{ position: "relative", zIndex: 1 }}>
          <p className="nxs-kicker"><span className="nxs-live" />Pricing</p>
          <Rise as="h1" immediate text="Simple prices. No surprises." className="nxs-display nxs-page-h1 nxs-grad-glow" delay={0.1} />
          <p className="nxs-hero-sub">Starting prices for every kind of project, from a café&rsquo;s website to a company&rsquo;s entire operation. You always get your exact price in writing before we start.</p>
        </div>
      </section>
      <Junction src="/site/scenes/cafe-v1.webp" from="dark" to="light" focus="50% 30%" />
      <Pricing heading={false} />
      <section className="nxs-light nxs-section" style={{ paddingTop: 0 }}>
        <div className="nxs-wrap">
          <Rise text="What's included." className="nxs-display nxs-h2 nxs-grad" />
          <p className="nxs-lede" style={{ marginTop: 18 }}>With a business app, you pick the features you need. Everything below is already running for one of our clients.</p>
          <div className="nxs-cmp-wrap">
            <table className="nxs-cmp">
              <thead>
                <tr><th scope="col"><span className="sr-only">Feature</span></th>{COLS.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
              </thead>
              <tbody>
                {ROWS.map(([label, vals]) => (
                  <tr key={label}><th scope="row">{label}</th>{vals.map((v, i) => <td key={i}><Cell v={v} /></td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "clamp(70px, 9vw, 110px)" }}>
            <Rise text="Pricing questions." className="nxs-display nxs-h2 nxs-grad" />
            <Faq items={FAQ} />
          </div>
        </div>
      </section>
      <Junction src="/site/scenes/kitchen-v1.webp" from="light" to="dark" focus="70% 40%" />
      <Closer />
    </SiteShell>
  );
}
