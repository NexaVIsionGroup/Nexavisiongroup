import type { Metadata } from "next";
import { Search, TrendingDown, FileCheck } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Rise } from "@/components/site/Rise";
import { Junction } from "@/components/site/Junction";
import { CheckupForm } from "@/components/site/CheckupForm";
import { Faq } from "@/components/site/Faq";

export const metadata: Metadata = {
  title: "Free Check-up",
  description:
    "Tell us about your business in two minutes. Within one business day we'll send a free check-up: what's working, what's costing you customers, and what we'd build.",
};

const GETS = [
  { icon: Search, title: "A real look at your website", text: "How it works on phones, how it shows up on Google, and what customers see first." },
  { icon: TrendingDown, title: "Where you're losing customers", text: "Missed calls, slow pages, no online ordering or quotes: the leaks that cost you money." },
  { icon: FileCheck, title: "A plan and a price in writing", text: "What we'd build for you and exactly what it costs. No pressure, no obligation." },
];

const FAQ = [
  { q: "Is the check-up really free?", a: "Yes. There's no cost and no obligation. If you like the plan, we'll build it. If not, you keep the advice." },
  { q: "How soon will I hear back?", a: "Within one business day, by call, text or email, whichever you picked." },
  { q: "I don't have a website yet. Can I still ask?", a: "Of course. We'll look at how your business shows up online today and plan your site and app from scratch." },
  { q: "What does it cost after that?", a: "Websites start at $1,500 and a website with your own business app starts at $4,500. You get an exact price in writing before we start." },
  { q: "Will I own my website and app?", a: "Yes. They're built for your business, with your name on them. We host and maintain them so you don't have to." },
];

export default function ContactPage({ searchParams }: { searchParams: { plan?: string } }) {
  const plan = typeof searchParams?.plan === "string" ? searchParams.plan.slice(0, 80) : "";
  return (
    <SiteShell>
      <section className="nxs-cu nxs-dark">
        <div className="nxs-aurora" aria-hidden><i /><i /><i /></div>
        <div className="nxs-grain" aria-hidden />
        <div className="nxs-wrap nxs-cu-grid">
          <div className="nxs-cu-copy">
            <p className="nxs-kicker"><span className="nxs-live" />Free, no obligation</p>
            <Rise as="h1" immediate text="Get your free check-up." className="nxs-display nxs-cu-h1 nxs-grad-glow" delay={0.1} />
            <p className="nxs-hero-sub">
              Tell us about your business in about two minutes. Within one business day we&rsquo;ll send you a personal check-up and a plan.
            </p>
          </div>
          <div className="nxs-cu-form"><CheckupForm plan={plan} /></div>
          <ul className="nxs-cu-gets">
              {GETS.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span><Icon size={20} aria-hidden /></span>
                  <div><b>{title}</b><p>{text}</p></div>
                </li>
              ))}
          </ul>
        </div>
      </section>
      <Junction src="/site/scenes/cafe-v1.webp" from="dark" to="light" focus="50% 30%" />
      <section className="nxs-section nxs-light" style={{ paddingTop: 20 }}>
        <div className="nxs-wrap">
          <Rise text="Questions people ask first." className="nxs-display nxs-h2 nxs-grad" />
          <Faq items={FAQ} />
        </div>
      </section>
    </SiteShell>
  );
}
