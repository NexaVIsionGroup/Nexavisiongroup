import Image from "next/image";
import Link from "next/link";
import {
  Inbox, FolderOpen, FileSignature, CreditCard, UserRound, ShoppingBag, Star, Users, PenLine, BellRing, Check,
} from "lucide-react";
import { HeroPhone } from "./HeroPhone";
import { CHECKUP_HREF, juggling, features, work, audiences, steps, pricing, carePlans } from "./content";

const FEATURE_ICONS = { Inbox, FolderOpen, FileSignature, CreditCard, UserRound, ShoppingBag, Star, Users, PenLine, BellRing };

const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-nx-pine px-7 py-4 text-[18px] font-bold text-white hover:bg-nx-pine-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nx-pine";
const btnSecondary =
  "inline-flex items-center justify-center rounded-full border-2 border-nx-ink px-7 py-[14px] text-[18px] font-bold text-nx-ink hover:bg-nx-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nx-pine";
const h2 = "font-nx-display text-[clamp(2rem,4.2vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-nx-ink";
const lead = "mt-4 max-w-2xl text-[19px] leading-[1.6] text-nx-soft md:text-[20px]";
const wrap = "mx-auto max-w-6xl px-5 md:px-8";

function host(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className={`${wrap} grid items-center gap-14 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28`}>
        <div>
          <h1 className="font-nx-display text-[clamp(2.75rem,6.4vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-nx-ink">
            More than a website. Your own business app.
          </h1>
          <p className="mt-6 max-w-xl text-[20px] leading-[1.6] text-nx-soft md:text-[22px]">
            We build your website and the private app behind it, so your emails, files, quotes, payments and customers live in one place on your phone. Built for you, run by us.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={CHECKUP_HREF} className={btnPrimary}>Get a free check-up</Link>
            <Link href="#work" className={btnSecondary}>See our work</Link>
          </div>
          <p className="mt-7 max-w-lg text-[16px] leading-relaxed text-nx-soft">
            Running today for restaurants, contractors, artists, online stores and service companies across the Carolinas and Florida.
          </p>
        </div>
        <HeroPhone />
      </section>

      {/* Front door */}
      <section className="border-y border-nx-line bg-white">
        <div className={`${wrap} grid gap-12 py-20 md:grid-cols-2 md:py-24`}>
          <div>
            <h2 className={h2}>Most websites stop at the front door.</h2>
            <p className={lead}>
              Most web designers hand you a nice-looking page and walk away. You're left juggling everything behind it.
            </p>
            <p className="mt-4 max-w-2xl text-[19px] leading-[1.6] text-nx-ink md:text-[20px]">
              We build the website and everything behind it: one app that runs your business, made just for you.
            </p>
          </div>
          <div className="self-center">
            <ul className="space-y-3" aria-label="What owners usually juggle">
              {juggling.map((j) => (
                <li key={j} className="text-[20px] text-nx-soft line-through decoration-nx-sun decoration-[3px]">{j}</li>
              ))}
            </ul>
            <p className="mt-6 flex items-center gap-3 font-nx-display text-[30px] font-extrabold tracking-[-0.02em] text-nx-pine">
              <Check className="h-8 w-8" aria-hidden /> One app, all yours.
            </p>
          </div>
        </div>
      </section>

      {/* Business app */}
      <section id="app" className={`${wrap} scroll-mt-24 py-20 md:py-28`}>
        <h2 className={h2}>What's in your business app</h2>
        <p className={lead}>Pick what your business needs. Every feature here is already running for one of our clients.</p>
        <ul className="mt-12 grid gap-x-12 md:grid-cols-2">
          {features.map((f) => {
            const Icon = FEATURE_ICONS[f.icon];
            return (
              <li key={f.title} className="flex gap-5 border-t border-nx-line py-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nx-mint text-nx-pine">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span>
                  <span className="block font-nx-display text-[22px] font-bold tracking-[-0.01em] text-nx-ink">{f.title}</span>
                  <span className="mt-1 block text-[18px] leading-[1.6] text-nx-soft">{f.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Work */}
      <section id="work" className="scroll-mt-24 bg-nx-ink py-20 text-white md:py-28">
        <div className={wrap}>
          <h2 className={`${h2} !text-white`}>Real businesses, running on what we built.</h2>
          <p className="mt-4 max-w-2xl text-[19px] leading-[1.6] text-white/75 md:text-[20px]">
            From a restaurant's online ordering to a construction company's entire operation.
          </p>
          <div className="mt-14 grid gap-x-10 gap-y-16 md:grid-cols-2">
            {work.map((w) => (
              <article key={w.name}>
                <a href={w.url} target="_blank" rel="noopener noreferrer" className="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nx-sun">
                  <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/15">
                    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.06] px-4 py-2.5 text-[13px] text-white/60">
                      <span className="h-2 w-2 rounded-full bg-nx-sun" aria-hidden />
                      {host(w.url)}
                    </div>
                    <Image
                      src={w.img}
                      alt={`${w.name} website`}
                      width={1440}
                      height={900}
                      sizes="(min-width: 768px) 540px, 100vw"
                      className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                </a>
                <p className="mt-5 text-[15px] font-bold text-nx-sun">{w.kind}</p>
                <h3 className="mt-1 font-nx-display text-[28px] font-bold tracking-[-0.02em]">{w.name}</h3>
                <p className="mt-2 text-[18px] leading-[1.6] text-white/80">{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Who we help */}
      <section id="who" className={`${wrap} scroll-mt-24 py-20 md:py-28`}>
        <h2 className={h2}>Who we help</h2>
        <p className={lead}>If you serve customers, we can build what runs behind it. A few of the businesses we work with:</p>
        <dl className="mt-12 divide-y divide-nx-line border-y border-nx-line">
          {audiences.map((a) => (
            <div key={a.title} className="grid gap-2 py-7 md:grid-cols-[1fr_1.4fr] md:gap-10">
              <dt className="font-nx-display text-[23px] font-bold tracking-[-0.01em] text-nx-ink">{a.title}</dt>
              <dd className="text-[18px] leading-[1.6] text-nx-soft">{a.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* How it works */}
      <section className="bg-nx-mint">
        <div className={`${wrap} py-20 md:py-24`}>
          <h2 className={h2}>How it works</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nx-pine font-nx-display text-[24px] font-extrabold text-white">{i + 1}</span>
                <h3 className="mt-5 font-nx-display text-[24px] font-bold tracking-[-0.01em] text-nx-ink">{s.title}</h3>
                <p className="mt-2 text-[18px] leading-[1.6] text-nx-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`${wrap} scroll-mt-24 py-20 md:py-28`}>
        <h2 className={h2}>Simple starting prices</h2>
        <p className={lead}>Every business is different, so you get your exact price in writing before we start. No surprises.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pricing.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-3xl p-7 ${p.featured ? "bg-nx-pine text-white" : "bg-white text-nx-ink ring-1 ring-nx-line"}`}
            >
              <h3 className="font-nx-display text-[22px] font-bold leading-tight tracking-[-0.01em]">{p.name}</h3>
              <p className="mt-5">
                {p.note && <span className={`block text-[15px] ${p.featured ? "text-white/75" : "text-nx-soft"}`}>{p.note}</span>}
                <span className="font-nx-display text-[40px] font-extrabold tracking-[-0.03em]">{p.price}</span>
              </p>
              <p className={`mt-4 flex-1 text-[17px] leading-[1.6] ${p.featured ? "text-white/85" : "text-nx-soft"}`}>{p.text}</p>
              <Link
                href={CHECKUP_HREF}
                className={`mt-7 rounded-full px-5 py-3 text-center text-[17px] font-bold ${
                  p.featured ? "bg-nx-sun text-nx-ink hover:bg-white" : "border-2 border-nx-ink hover:bg-nx-ink hover:text-white"
                }`}
              >
                {p.price === "Let's talk" ? "Talk to us" : "Get a free check-up"}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {carePlans.map((c) => (
            <div key={c.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-2xl border border-dashed border-nx-pine/40 px-6 py-5">
              <span className="font-nx-display text-[20px] font-bold">{c.name}</span>
              <span className="font-nx-display text-[22px] font-extrabold text-nx-pine">
                {c.price}<span className="text-[16px] font-semibold text-nx-soft">/month</span>
              </span>
              <span className="w-full text-[17px] text-nx-soft">{c.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="bg-nx-pine">
        <div className={`${wrap} flex flex-col items-start gap-8 py-20 md:flex-row md:items-center md:justify-between md:py-24`}>
          <div className="max-w-2xl">
            <h2 className="font-nx-display text-[clamp(2rem,4.2vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
              Let's see what your business is missing.
            </h2>
            <p className="mt-4 text-[19px] leading-[1.6] text-white/85 md:text-[20px]">
              Get a free check-up of your website and online presence. We'll show you exactly what we'd fix, with no cost and no obligation.
            </p>
          </div>
          <Link href={CHECKUP_HREF} className="shrink-0 rounded-full bg-nx-sun px-8 py-4 text-[19px] font-bold text-nx-ink hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Get my free check-up
          </Link>
        </div>
      </section>
    </>
  );
}
