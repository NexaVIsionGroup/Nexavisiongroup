"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  Building2,
  Users,
  DollarSign,
  Clock,
  Code2,
  Palette,
  Server,
  ArrowRight,
  Zap,
} from "lucide-react";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   NEXAVISION — PRICING PAGE
   Anchoring · Decoy · ROI · Progressive Disclosure
   ═══════════════════════════════════════════════════ */

const FALLBACK_TIERS = [
  {
    name: "Starter",
    tagline: "Everything you need to stop losing leads and look professional.",
    priceRange: "$6K–$12K",
    timeline: "2–4 weeks",
    featured: false,
    roi: "One new $3K job pays for your system.",
    idealFor: "Solo operators doing under $500K",
    features: [
      "High-converting website",
      "Multi-step intake form",
      "Click-to-call routing",
      "Google review generation",
      "Mobile-optimized design",
      "Sanity CMS (edit everything)",
      "Basic analytics dashboard",
    ],
    ctaLabel: "Start Your Build",
    ctaHref: "/contact",
  },
  {
    name: "Growth",
    tagline: "The full intake-to-payment pipeline. Most clients choose this.",
    priceRange: "$12K–$25K",
    timeline: "3–6 weeks",
    featured: true,
    roi: "Two closed deals cover your entire investment.",
    idealFor: "Teams of 3–10 doing $500K–$2M",
    features: [
      "Everything in Starter",
      "CRM & lead pipeline board",
      "Quote builder with online acceptance",
      "Automated follow-up sequences",
      "Invoice & payment processing",
      "Client portal",
      "Job scheduling module",
      "SMS + email notifications",
      "Advanced reporting dashboard",
    ],
    ctaLabel: "Start Your Build",
    ctaHref: "/contact",
  },
  {
    name: "Ops Stack",
    tagline: "Designed for operations doing $2M+ where one lost contract costs more than the system.",
    priceRange: "$25K–$75K+",
    timeline: "4–10 weeks",
    featured: false,
    roi: "One retained contract covers the system many times over.",
    idealFor: "Multi-crew operations doing $2M+",
    features: [
      "Everything in Growth",
      "Multi-location support",
      "Team & crew dispatching",
      "Inventory tracking",
      "Custom integrations (QuickBooks, etc.)",
      "Admin mobile app",
      "Role-based access control",
      "White-labeled client portal",
      "Priority support & training",
      "Custom module development",
    ],
    ctaLabel: "Scope Your System",
    ctaHref: "/contact",
  },
];

const FAQ_ITEMS = [
  {
    q: "Do I own the code?",
    a: "Yes. 100%. No lock-in, no recurring license. The code, the design, the CMS — it's all yours.",
  },
  {
    q: "What if I need changes after launch?",
    a: "You get full Sanity CMS access to edit all content, images, and copy yourself — no developer needed. For structural changes or new modules, we offer support packages.",
  },
  {
    q: "How long does it really take?",
    a: "Starter systems deploy in 2–4 weeks. Growth systems in 3–6 weeks. We give real timelines based on scope, not marketing promises.",
  },
  {
    q: "What if it doesn't work?",
    a: "We don't launch until you're satisfied. Period. Your system goes through review and approval before it ever goes live.",
  },
  {
    q: "Can I start small and add modules later?",
    a: "Absolutely. That's exactly how the tier system is designed. Start with Starter, prove the ROI, then upgrade to Growth when you're ready.",
  },
];

const INHOUSE_COSTS = [
  { icon: Code2, label: "1 full-stack developer", cost: "$85K–$120K/year" },
  { icon: Palette, label: "1 designer", cost: "$60K–$90K/year" },
  { icon: Server, label: "PM, hosting, CMS licensing", cost: "$15K–$25K/year" },
  { icon: Clock, label: "Time to launch", cost: "4–8 months" },
];

interface PricingPageContentProps {
  data: any;
  settings: any;
}

export function PricingPageContent({ data, settings }: PricingPageContentProps) {
  const tiers = data?.tiers?.length ? data.tiers : FALLBACK_TIERS;
  const faqItems = data?.faq?.length ? data.faq : FAQ_ITEMS;

  return (
    <>
      {/* ─── Anchor Section ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="nv-container mb-20"
      >
        <motion.div variants={fadeUp} className="text-center mb-14">
          <span className="nv-section-label mb-4 block">Pricing</span>
          <h1 className="font-display text-display-lg md:text-display-xl mb-4 max-w-4xl mx-auto">
            {data?.headline || "Systems That Pay for Themselves"}
          </h1>
          <p className="text-body-lg text-nv-text-secondary max-w-2xl mx-auto">
            {data?.description ||
              "The economics of software development changed. We build what used to cost $150K for a fraction — and faster."}
          </p>
        </motion.div>

        {/* Comparison Bar */}
        <motion.div
          variants={fadeUp}
          className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8"
        >
          {/* Traditional */}
          <div className="rounded-nv-xl border border-white/[0.06] bg-nv-deep/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 size={20} className="text-nv-text-muted" />
              <span className="text-label-md text-nv-text-muted">TRADITIONAL AGENCY</span>
            </div>
            <div className="font-display text-display-sm text-nv-text-secondary/60 mb-3 line-through decoration-nv-error/50">
              $100K–$200K+
            </div>
            <div className="space-y-1.5 text-body-sm text-nv-text-muted">
              <p>4–6 months timeline</p>
              <p>Team of 5+ billable heads</p>
              <p>Ongoing retainer required</p>
            </div>
          </div>

          {/* NexaVision */}
          <div className="rounded-nv-xl border border-nv-teal/30 bg-nv-teal/[0.04] p-6 shadow-nv-glow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Zap size={20} className="text-nv-teal" />
              <span className="text-label-md text-nv-teal">YOUR NEXAVISION SYSTEM</span>
            </div>
            <div className="font-display text-display-sm nv-gradient-text-teal mb-3">
              $6K–$75K
            </div>
            <div className="space-y-1.5 text-body-sm text-nv-text-secondary">
              <p>Weeks, not months</p>
              <p>One architect, one vision</p>
              <p>You own everything</p>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── Pricing Tiers ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="nv-container mb-24"
      >
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {tiers.map((tier: any, i: number) => (
            <PricingTier key={i} tier={tier} />
          ))}
        </motion.div>

        {/* Cost of inaction */}
        <motion.p
          variants={fadeUp}
          className="text-center text-body-md text-nv-text-muted mt-10 max-w-2xl mx-auto"
        >
          Every month without a system costs the average service business{" "}
          <span className="text-nv-ember font-semibold">$4K–$8K</span> in lost leads and manual
          overhead.
        </motion.p>
      </motion.section>

      {/* ─── In-House Comparison ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-20 md:py-28"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="nv-container max-w-4xl mx-auto">
          <motion.h2
            variants={fadeUp}
            className="font-display text-display-sm md:text-display-md text-center mb-12"
          >
            What it would cost to build this yourself
          </motion.h2>

          <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {INHOUSE_COSTS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  variants={scaleUp}
                  className="nv-card p-5 text-center"
                >
                  <Icon size={24} className="text-nv-error/70 mx-auto mb-3" />
                  <p className="text-body-sm text-nv-text-secondary mb-1">{item.label}</p>
                  <p className="font-display font-semibold text-body-lg text-nv-text-primary">
                    {item.cost}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-body-lg text-nv-text-secondary text-center max-w-2xl mx-auto"
          >
            Or invest{" "}
            <span className="text-nv-teal font-semibold">$12K–$25K</span> and launch in weeks.
            With a system built by someone who&apos;s done it for your industry.
          </motion.p>
        </div>
      </motion.section>

      {/* ─── FAQ ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-20 md:py-28"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="nv-container max-w-3xl mx-auto">
          <motion.h2
            variants={fadeUp}
            className="font-display text-display-sm md:text-display-md text-center mb-12"
          >
            Common Questions
          </motion.h2>

          <motion.div variants={staggerContainer} className="space-y-3">
            {faqItems.map((item: any, i: number) => (
              <FaqItem key={i} question={item.q || item.question} answer={item.a || item.answer} />
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Closing CTA ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-24 md:py-32"
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nv-teal/[0.04] rounded-full blur-[150px]" />
        </div>
        <div className="nv-container text-center max-w-3xl mx-auto">
          <motion.h2
            variants={fadeUp}
            className="font-display text-display-md md:text-display-lg mb-4"
          >
            The longer you wait, the more leads your competitors close.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-body-lg text-nv-text-secondary mb-10 max-w-xl mx-auto"
          >
            Pick a tier and let&apos;s get started. Or book a 15-minute call to scope your system.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <button className="nv-btn-primary text-base px-8 py-4 flex items-center gap-2">
                Start Your Build <ArrowRight size={18} />
              </button>
            </Link>
            <a
              href="mailto:hello@nexavisiongroup.com?subject=15-Min Scope Call"
              className="nv-btn-ghost text-base px-8 py-4"
            >
              Book a 15-Min Scope Call
            </a>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}

/* ─── Pricing Tier Card ─── */
function PricingTier({ tier }: { tier: any }) {
  const [expanded, setExpanded] = useState(false);
  const features = tier.features || [];
  const previewCount = 4;
  const showToggle = features.length > previewCount;

  return (
    <motion.div
      variants={scaleUp}
      className={cn(
        "relative rounded-nv-xl p-7 flex flex-col",
        tier.featured
          ? "nv-glass-elevated border-nv-teal/30 shadow-nv-glow ring-1 ring-nv-teal/20"
          : "nv-card"
      )}
    >
      {tier.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-nv-teal text-nv-abyss text-label-sm font-bold rounded-full shadow-nv-glow">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-display font-bold text-body-xl mb-1">{tier.name}</h3>
        <p className="text-body-sm text-nv-text-muted mb-4">{tier.tagline}</p>
        <div className="font-display text-display-sm nv-gradient-text-teal">{tier.priceRange}</div>
        {tier.timeline && (
          <p className="text-body-xs text-nv-text-muted mt-1 font-mono">{tier.timeline}</p>
        )}
      </div>

      {/* Ideal for */}
      {tier.idealFor && (
        <div className="mb-4 px-3 py-2 rounded-nv-md bg-nv-teal/[0.04] border border-nv-teal/10">
          <p className="text-body-xs text-nv-text-secondary">
            <span className="text-nv-teal font-medium">Ideal for:</span> {tier.idealFor}
          </p>
        </div>
      )}

      {/* ROI line */}
      {tier.roi && (
        <div className="mb-6 px-3 py-2 rounded-nv-md bg-nv-success/[0.06] border border-nv-success/10">
          <p className="text-body-xs text-nv-success flex items-center gap-2">
            <DollarSign size={14} />
            {tier.roi}
          </p>
        </div>
      )}

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.slice(0, expanded ? features.length : previewCount).map((feature: any, j: number) => {
          const text = typeof feature === "string" ? feature : feature.text;
          return (
            <li key={j} className="flex items-start gap-2.5">
              <Check size={15} className="text-nv-teal shrink-0 mt-0.5" />
              <span className="text-body-sm text-nv-text-secondary">{text}</span>
            </li>
          );
        })}
      </ul>

      {showToggle && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-body-xs text-nv-teal flex items-center gap-1 mb-6 hover:underline"
        >
          <ChevronDown
            size={14}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Show less" : `See all ${features.length} features`}
        </button>
      )}

      {/* CTA */}
      <Link href={tier.ctaHref || "/contact"}>
        <button className={cn("w-full", tier.featured ? "nv-btn-primary" : "nv-btn-ghost")}>
          {tier.ctaLabel || "Start Your Build"}
        </button>
      </Link>
    </motion.div>
  );
}

/* ─── FAQ Accordion Item ─── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-nv-lg border border-white/[0.06] bg-nv-deep/60 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-display font-medium text-body-md text-nv-text-primary pr-4">
          {question}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "text-nv-text-muted shrink-0 transition-transform duration-300",
            open && "rotate-180 text-nv-teal"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="px-5 pb-5 text-body-sm text-nv-text-secondary leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
