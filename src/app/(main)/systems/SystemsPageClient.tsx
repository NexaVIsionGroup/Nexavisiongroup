"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { CtaBanner } from "@/components/ui/CtaBanner";
import { IconResolver } from "@/components/ui/IconResolver";
import {
  ChevronRight, ArrowRight, Layers, Cpu, Users, Settings, Plug,
  Megaphone, Kanban, Globe, Lock, Zap, CheckCircle2,
  ArrowDown, Sparkles
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   MODULE FAMILY DATA
   ═══════════════════════════════════════════════════ */
interface Module {
  name: string;
  description: string;
  icon: string;
  tier: "starter" | "growth" | "ops";
}

interface ModuleFamily {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  modules: Module[];
}

const tierConfig = {
  starter: { bg: "bg-nv-teal/10", text: "text-nv-teal", label: "Starter", border: "border-nv-teal/20" },
  growth: { bg: "bg-nv-violet/10", text: "text-nv-violet-300", label: "Growth", border: "border-nv-violet/20" },
  ops: { bg: "bg-nv-ember/10", text: "text-nv-ember", label: "Ops Stack", border: "border-nv-ember/20" },
};

const families: ModuleFamily[] = [
  {
    id: "acquisition",
    name: "Acquisition",
    tagline: "Get the lead. Qualify it. Start the relationship.",
    description:
      "Everything that happens from first touch to qualified lead. Intake forms, quote wizards, landing pages, follow-up sequences, and review engines that feed your pipeline without paid ads.",
    icon: <Megaphone size={22} />,
    color: "#00E5CC",
    modules: [
      { name: "Multi-Step Intake Wizard", description: "Guided forms that qualify leads by industry, need, budget, and urgency before they hit your inbox.", icon: "ClipboardList", tier: "starter" },
      { name: "Quote / Estimate Builder", description: "Professional quotes with line items, photos, and one-click acceptance. Track open, viewed, and accepted.", icon: "FileText", tier: "starter" },
      { name: "Automated Follow-Up", description: "Email and SMS sequences that re-engage leads who don't convert immediately. No lead left behind.", icon: "Zap", tier: "starter" },
      { name: "Review Generation Engine", description: "Post-service review requests timed to maximize positive reviews. Route happy customers to Google, unhappy ones to you.", icon: "Star", tier: "growth" },
      { name: "Referral System", description: "Track and reward customer referrals with automated thank-you sequences and referral credit tracking.", icon: "Users", tier: "growth" },
      { name: "Landing Page Builder", description: "Campaign-specific landing pages with conversion tracking. A/B test headlines, CTAs, and offers.", icon: "Layout", tier: "ops" },
    ],
  },
  {
    id: "operations",
    name: "Operations",
    tagline: "Run the job. Track the work. Close the loop.",
    description:
      "The engine room. Job pipelines, scheduling, dispatching, invoicing, and payment collection. Everything from accepted quote to paid invoice, automated and tracked.",
    icon: <Kanban size={22} />,
    color: "#7B5EA7",
    modules: [
      { name: "Job Pipeline Board", description: "Visual Kanban board tracking every job from lead to completion. Drag, drop, never lose a job.", icon: "Kanban", tier: "starter" },
      { name: "Scheduling + Reminders", description: "Appointment scheduling with automated confirmation and reminder sequences. Reduce no-shows by 80%.", icon: "CalendarCheck", tier: "starter" },
      { name: "Invoicing", description: "Generate and send professional invoices from completed jobs. Track payment status automatically.", icon: "Receipt", tier: "growth" },
      { name: "Payment Collection", description: "Online payment links, recurring billing, and automated past-due reminders.", icon: "CreditCard", tier: "growth" },
      { name: "Dispatch Board", description: "Assign field staff to jobs with route optimization, status tracking, and ETA notifications.", icon: "Map", tier: "ops" },
      { name: "Inventory Tracking", description: "Track parts, materials, and equipment across jobs and locations.", icon: "Package", tier: "ops" },
    ],
  },
  {
    id: "portals",
    name: "Portals",
    tagline: "Give customers and teams a window into the work.",
    description:
      "Self-service portals that reduce phone calls, build trust, and make you look like a company ten times your size. Customer-facing and internal.",
    icon: <Globe size={22} />,
    color: "#00B4D8",
    modules: [
      { name: "Customer Status Portal", description: "Customers check job status, view documents, and communicate — without calling you.", icon: "Users", tier: "growth" },
      { name: "Document Portal", description: "Secure upload and sharing of contracts, photos, permits, and deliverables.", icon: "FileStack", tier: "growth" },
      { name: "Team Dashboard", description: "Internal dashboard showing pipeline health, revenue metrics, and team performance at a glance.", icon: "LayoutDashboard", tier: "ops" },
      { name: "Owner / Partner Reporting", description: "Automated reports for business owners, partners, or stakeholders with key metrics and trends.", icon: "BarChart3", tier: "ops" },
    ],
  },
  {
    id: "admin",
    name: "Admin",
    tagline: "Content, SEO, and the stuff that compounds.",
    description:
      "The long game. Service area pages for local SEO, blog/resource hubs, schema markup, analytics, and conversion tracking. Organic growth infrastructure.",
    icon: <Settings size={22} />,
    color: "#FF6B35",
    modules: [
      { name: "Service Area Pages", description: "SEO-optimized pages for every city and region you serve. Rank locally without paying for ads.", icon: "MapPin", tier: "starter" },
      { name: "Schema.org Markup", description: "Structured data for LocalBusiness, Service, FAQ, and Reviews. Speak Google's language.", icon: "Code2", tier: "starter" },
      { name: "Blog / Resource Hub", description: "Content management for articles, guides, and resources that build topical authority.", icon: "BookOpen", tier: "growth" },
      { name: "Analytics + Conversion Tracking", description: "GA4 setup with custom events for calls, form submissions, and pipeline progression.", icon: "BarChart3", tier: "starter" },
    ],
  },
  {
    id: "integrations",
    name: "Integrations",
    tagline: "Connect the tools you already use.",
    description:
      "API bridges, webhooks, and native integrations with the platforms your business already runs on. No rip-and-replace — we connect to your stack.",
    icon: <Plug size={22} />,
    color: "#A78BFA",
    modules: [
      { name: "Google Business Profile", description: "Sync reviews, hours, and posts. Manage your GBP presence from one place.", icon: "MapPin", tier: "starter" },
      { name: "Email / SMS Gateway", description: "Transactional email and SMS for confirmations, reminders, and follow-ups.", icon: "Mail", tier: "starter" },
      { name: "Calendar Sync", description: "Two-way sync with Google Calendar, Outlook, or Apple Calendar.", icon: "Calendar", tier: "growth" },
      { name: "Accounting Bridge", description: "Push invoices and payments to QuickBooks, Xero, or FreshBooks.", icon: "Calculator", tier: "growth" },
      { name: "Zapier / Webhooks", description: "Connect to 5,000+ apps via Zapier or direct webhook integrations.", icon: "Webhook", tier: "ops" },
      { name: "Custom API", description: "Full REST API access for custom integrations with your existing systems.", icon: "Code2", tier: "ops" },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   FAMILY TAB SELECTOR
   ═══════════════════════════════════════════════════ */
function FamilyTab({
  family,
  active,
  onClick,
}: {
  family: ModuleFamily;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-5 py-3 rounded-nv-lg text-body-sm font-semibold transition-all duration-300 whitespace-nowrap ${
        active
          ? "text-white"
          : "text-nv-text-muted hover:text-nv-text-secondary"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeFamily"
          className="absolute inset-0 rounded-nv-lg border border-white/10"
          style={{ backgroundColor: `${family.color}12`, boxShadow: `0 0 20px ${family.color}15, inset 0 1px 0 ${family.color}20` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <span style={{ color: active ? family.color : undefined }}>{family.icon}</span>
        {family.name}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   MODULE CARD (with tier badge)
   ═══════════════════════════════════════════════════ */
function SystemModuleCard({ mod, index, familyColor }: { mod: Module; index: number; familyColor: string }) {
  const t = tierConfig[mod.tier];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
      className="nv-module-card p-5 group flex flex-col"
    >
      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-10 h-10 rounded-nv-md flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
            style={{ backgroundColor: `${familyColor}10` }}
          >
            <IconResolver name={mod.icon} size={20} style={{ color: familyColor }} />
          </div>
          <span className={`text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full ${t.bg} ${t.text}`}>
            {t.label}
          </span>
        </div>
        <h4 className="font-display font-semibold text-body-md mb-2 group-hover:text-white transition-colors">
          {mod.name}
        </h4>
        <p className="text-body-xs text-nv-text-muted leading-relaxed">
          {mod.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   TIER PROGRESSION VISUAL
   ═══════════════════════════════════════════════════ */
function TierProgression() {
  const tiers = [
    {
      name: "Starter",
      tagline: "Get found. Get leads. Look professional.",
      color: "#00E5CC",
      modules: "Website + intake + pipeline + follow-up + local SEO",
      ideal: "Solo operators and small teams ready to stop losing leads",
    },
    {
      name: "Growth",
      tagline: "Automate the back office. Scale without hiring.",
      color: "#7B5EA7",
      modules: "Everything in Starter + invoicing, payments, portals, reviews, CRM",
      ideal: "Established businesses doing $500K+ that need operational leverage",
    },
    {
      name: "Ops Stack",
      tagline: "Full command center. Total visibility.",
      color: "#FF6B35",
      modules: "Everything in Growth + dispatch, inventory, reporting, custom API, team dashboards",
      ideal: "Multi-crew operations that need centralized control and real-time data",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {tiers.map((tier, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.5 } },
          }}
          className="relative"
        >
          {/* Connector arrow (between cards) */}
          {i < 2 && (
            <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="w-6 h-6 rounded-full bg-nv-deep border border-white/10 flex items-center justify-center">
                <ArrowRight size={12} className="text-nv-text-muted" />
              </div>
            </div>
          )}

          <div className="nv-glass rounded-nv-xl p-6 h-full flex flex-col hover:border-white/10 transition-all duration-300 group">
            {/* Tier color accent */}
            <div className="h-1 rounded-full mb-5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: tier.color }} />

            <h3 className="font-display font-bold text-body-xl mb-1" style={{ color: tier.color }}>
              {tier.name}
            </h3>
            <p className="text-body-sm text-nv-text-secondary mb-4">
              {tier.tagline}
            </p>
            <p className="text-body-xs text-nv-text-muted mb-4 flex-1">
              {tier.modules}
            </p>
            <div className="pt-3 border-t border-white/[0.04]">
              <p className="text-body-xs text-nv-text-muted">
                <span className="text-nv-text-secondary font-semibold">Ideal for:</span>{" "}
                {tier.ideal}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   ARCHITECTURE DIAGRAM (visual flow)
   ═══════════════════════════════════════════════════ */
function ArchitectureDiagram() {
  const layers = [
    { label: "YOUR CUSTOMER", items: ["Website Visit", "Ad Click", "Referral", "Google Search"], color: "#00E5CC" },
    { label: "ACQUISITION", items: ["Intake Wizard", "Quote Builder", "Follow-Up", "Review Engine"], color: "#00E5CC" },
    { label: "OPERATIONS", items: ["Pipeline", "Scheduling", "Invoicing", "Payments"], color: "#7B5EA7" },
    { label: "PORTALS", items: ["Customer Portal", "Team Dashboard", "Owner Reports"], color: "#00B4D8" },
    { label: "INTEGRATIONS", items: ["GBP", "Email/SMS", "Calendar", "Accounting"], color: "#A78BFA" },
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="max-w-3xl mx-auto"
    >
      {layers.map((layer, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5 } },
          }}
        >
          {/* Layer */}
          <div className="flex items-stretch gap-4">
            {/* Label */}
            <div className="w-32 shrink-0 flex items-center">
              <span
                className="text-[10px] font-bold tracking-[0.15em] uppercase"
                style={{ color: layer.color }}
              >
                {layer.label}
              </span>
            </div>

            {/* Items */}
            <div className="flex-1 flex flex-wrap gap-2 py-3">
              {layer.items.map((item, j) => (
                <motion.span
                  key={j}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + j * 0.05 }}
                  className="px-3 py-1.5 rounded-nv-md text-body-xs font-medium border transition-all duration-300 hover:scale-105"
                  style={{
                    borderColor: `${layer.color}25`,
                    backgroundColor: `${layer.color}06`,
                    color: layer.color,
                  }}
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Connector */}
          {i < layers.length - 1 && (
            <div className="flex items-center gap-4 py-1">
              <div className="w-32 shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                <div className="h-6 w-[1px] ml-8" style={{ background: `${layer.color}20` }} />
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                  <ArrowDown size={12} style={{ color: `${layer.color}40` }} />
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN SYSTEMS PAGE
   ═══════════════════════════════════════════════════ */
export function SystemsPageClient() {
  const [activeFamily, setActiveFamily] = useState(0);
  const current = families[activeFamily];

  return (
    <PageWrapper>
      {/* ═══ HERO ═══ */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-nv-teal/[0.03] rounded-full blur-[160px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-nv-violet/[0.04] rounded-full blur-[130px]" />
        </div>

        <div className="nv-container relative z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Breadcrumb */}
            <motion.nav variants={fadeUp} className="flex items-center gap-1.5 mb-6">
              <Link href="/" className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors">Home</Link>
              <ChevronRight size={12} className="text-nv-text-muted/50" />
              <span className="text-body-xs text-nv-text-secondary">Systems</span>
            </motion.nav>

            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <Cpu size={20} className="text-nv-teal" />
              <span className="nv-section-label">The Revenue System</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-display-lg md:text-display-xl lg:text-display-2xl mb-6 max-w-4xl">
              Modular Infrastructure.{" "}
              <span className="nv-gradient-text-teal">One Platform.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-body-lg md:text-body-xl text-nv-text-secondary max-w-2xl mb-4">
              Five module families. Three tiers. Every piece works alone, but they compound when deployed together. Pick what you need now, expand as you grow.
            </motion.p>

            <motion.p variants={fadeUp} className="text-body-md text-nv-text-muted max-w-2xl">
              No lock-in. No bloat. No paying for features you don&apos;t use.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══ ARCHITECTURE DIAGRAM ═══ */}
      <section className="relative py-16 md:py-20">
        <div className="absolute top-0 left-0 right-0 nv-divider" />
        <div className="nv-container">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="nv-section-label mb-4 block">System Architecture</span>
              <h2 className="font-display text-display-md md:text-display-lg mb-4">
                How the Pieces <span className="nv-gradient-text-teal">Fit Together</span>
              </h2>
              <p className="text-body-md text-nv-text-muted max-w-xl mx-auto">
                From first customer touch to paid invoice, every layer feeds the next.
              </p>
            </motion.div>

            <div className="nv-glass-elevated rounded-nv-2xl p-8 md:p-10">
              <ArchitectureDiagram />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ MODULE FAMILIES (interactive) ═══ */}
      <section className="relative py-16 md:py-24 nv-grid-bg">
        <div className="absolute top-0 left-0 right-0 nv-divider" />
        <div className="nv-container">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
            <motion.div variants={fadeUp} className="mb-10">
              <span className="nv-section-label mb-4 block">Module Families</span>
              <h2 className="font-display text-display-md md:text-display-lg mb-4 max-w-3xl">
                Five Families. Everything Your Business Needs.
              </h2>
            </motion.div>

            {/* Family tabs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-10 p-1.5 rounded-nv-xl bg-white/[0.02] border border-white/[0.04] w-fit">
              {families.map((fam, i) => (
                <FamilyTab key={fam.id} family={fam} active={i === activeFamily} onClick={() => setActiveFamily(i)} />
              ))}
            </motion.div>

            {/* Active family header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-nv-md flex items-center justify-center"
                    style={{ backgroundColor: `${current.color}12` }}
                  >
                    <span style={{ color: current.color }}>{current.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-body-xl" style={{ color: current.color }}>
                      {current.name}
                    </h3>
                    <p className="text-body-xs text-nv-text-muted">{current.tagline}</p>
                  </div>
                </div>
                <p className="text-body-md text-nv-text-secondary max-w-2xl">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Module cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "-cards"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {current.modules.map((mod, i) => (
                  <SystemModuleCard key={mod.name} mod={mod} index={i} familyColor={current.color} />
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ═══ TIER PROGRESSION ═══ */}
      <section className="relative py-16 md:py-24">
        <div className="absolute top-0 left-0 right-0 nv-divider" />
        <div className="nv-container">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="nv-section-label mb-4 block">Tier Progression</span>
              <h2 className="font-display text-display-md md:text-display-lg mb-4">
                Start Lean. <span className="nv-gradient-text-teal">Scale Smart.</span>
              </h2>
              <p className="text-body-md text-nv-text-muted max-w-xl mx-auto">
                Every tier includes everything below it. No double-paying. No feature gaps.
              </p>
            </motion.div>

            <TierProgression />
          </motion.div>
        </div>
      </section>

      {/* ═══ THE ANTHILL CALLBACK ═══ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 nv-divider" />

        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nv-teal/[0.02] rounded-full blur-[160px]" />
        </div>

        <div className="nv-container">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} className="text-center max-w-3xl mx-auto">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nv-teal/[0.06] border border-nv-teal/15 mb-6">
              <Sparkles size={14} className="text-nv-teal" />
              <span className="text-body-xs font-semibold text-nv-teal">The Anthill Model</span>
            </motion.div>

            <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-6">
              Your Customers See the Surface.{" "}
              <span className="nv-gradient-text-teal">We Build the Underground.</span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary mb-4">
              Every great anthill looks simple on top — a clean mound, a clear entrance. But underneath? Tunnels, chambers, supply lines, and logistics that make the whole colony run.
            </motion.p>

            <motion.p variants={fadeUp} className="text-body-md text-nv-text-muted mb-8">
              Your customers see a beautiful website and a smooth booking experience. Behind it, your Revenue System handles intake, routing, follow-up, invoicing, payments, and reporting — automatically.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Link href="/industries">
                <button className="nv-btn-primary">See It by Industry</button>
              </Link>
              <Link href="/pricing">
                <button className="nv-btn-ghost">View Pricing</button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CtaBanner
        headline="Ready to Build Your Revenue System?"
        description="Tell us your industry, your bottlenecks, and your goals. We'll scope the right modules."
        primaryLabel="Start Your Build"
        primaryHref="/contact"
        secondaryLabel="View Demos"
        secondaryHref="/demos"
      />
    </PageWrapper>
  );
}
