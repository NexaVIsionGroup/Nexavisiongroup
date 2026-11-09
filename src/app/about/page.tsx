import type { Metadata } from "next";
import { Globe, Smartphone, ShoppingBag, CreditCard, UserRound, Inbox, FolderOpen, Bot, Link2, Server, Check, Star } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Rise } from "@/components/site/Rise";
import { Junction } from "@/components/site/Junction";
import { AppWall, Closer } from "@/components/site/Chapters";

export const metadata: Metadata = {
  title: "About",
  description:
    "NexaVision Group builds websites and complete business platforms, from a café's online menu to a company's entire operation. Based in South Carolina.",
};

const HANDLE = [
  { icon: Globe, t: "Websites" },
  { icon: Smartphone, t: "Business apps" },
  { icon: ShoppingBag, t: "Online stores and ordering" },
  { icon: CreditCard, t: "Payments and billing" },
  { icon: UserRound, t: "Customer portals" },
  { icon: Inbox, t: "Email systems" },
  { icon: FolderOpen, t: "Private file storage" },
  { icon: Smartphone, t: "Android apps" },
  { icon: Bot, t: "AI that answers and drafts" },
  { icon: Link2, t: "Square, Stripe and Google connections" },
  { icon: Star, t: "Review management" },
  { icon: Server, t: "Hosting and support" },
];

const HOW = [
  { title: "Built for you, not from a template", text: "Every site and app is designed around how your business actually runs: your services, your customers, your words." },
  { title: "You own it", text: "Your website and app carry your name. Your data stays yours, even if prices change somewhere else." },
  { title: "Plain English, always", text: "No tech talk. We explain what we're building, what it costs and how it helps, in words that make sense." },
  { title: "We stay on", text: "We host it, keep it secure, fix what breaks and keep adding to it. You call us, not a help desk." },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="nxs-dark nxs-page-hero">
        <div className="nxs-aurora" aria-hidden><i /><i /><i /></div>
        <div className="nxs-grain" aria-hidden />
        <div className="nxs-wrap" style={{ position: "relative", zIndex: 1 }}>
          <p className="nxs-kicker"><span className="nxs-live" />Empowering Your Digital Ecosystem.</p>
          <Rise as="h1" immediate text="From a café's online menu to a company's entire operation." className="nxs-display nxs-page-h1 nxs-grad-glow" delay={0.1} />
          <p className="nxs-hero-sub">
            We&rsquo;re your outsourced tech and marketing department. We build it, we run it, and you run your business. One week it&rsquo;s a restaurant&rsquo;s online ordering. The next it&rsquo;s a construction company&rsquo;s full operations system with estimates, employees, vendors, its own file storage and its own Android app.
          </p>
        </div>
      </section>
      <Junction src="/site/scenes/crane-v1.webp" from="dark" to="light" focus="50% 60%" caption="One system, built around how you work." />
      <section className="nxs-light nxs-section" style={{ paddingTop: 30 }}>
        <div className="nxs-wrap nxs-door">
          <div>
            <Rise text="Websites that do more than sit there." className="nxs-display nxs-h2 nxs-grad" />
          </div>
          <div>
            <p className="nxs-lede">Most businesses are stuck with the same problem: a website that looks fine but does nothing, and ten apps that don&rsquo;t talk to each other.</p>
            <p className="nxs-lede" style={{ marginTop: 16, color: "var(--ink)" }}>We replace that with one system built around how you work: your website out front, your own business app behind it. Then we stay on to host it, maintain it and keep adding to it.</p>
          </div>
        </div>
        <div className="nxs-wrap" style={{ marginTop: "clamp(70px, 9vw, 110px)" }}>
          <Rise text="What we handle." className="nxs-display nxs-h2 nxs-grad" />
          <ul className="nxs-handle">
            {HANDLE.map(({ icon: Icon, t }) => (
              <li key={t}><Icon size={22} aria-hidden /><span>{t}</span></li>
            ))}
          </ul>
        </div>
        <div className="nxs-wrap" style={{ marginTop: "clamp(70px, 9vw, 110px)" }}>
          <Rise text="How we work." className="nxs-display nxs-h2 nxs-grad" />
          <div className="nxs-how">
            {HOW.map((h) => (
              <div key={h.title}>
                <Check size={20} strokeWidth={3} aria-hidden />
                <h3 className="nxs-display">{h.title}</h3>
                <p>{h.text}</p>
              </div>
            ))}
          </div>
          <p className="nxs-lede" style={{ marginTop: 40 }}>Based in South Carolina. Working with restaurants, contractors, artists, online stores and service companies across the Carolinas, Florida and beyond.</p>
        </div>
      </section>
      <Junction src="/site/scenes/phone-v1.webp" from="light" to="dark" focus="45% 50%" />
      <AppWall />
      <Closer />
    </SiteShell>
  );
}
