"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { CtaBanner } from "@/components/ui/CtaBanner";
import { IconResolver } from "@/components/ui/IconResolver";
import {
  ChevronRight, ExternalLink, ArrowRight, Play, Eye,
  Sparkles, Monitor, Smartphone, Layers, Zap, Lock,
  CheckCircle2, Clock, Rocket, Thermometer, HardHat,
  Mail, Shield,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   FALLBACK DEMO DATA
   ═══════════════════════════════════════════════════ */
const FEATURED_DEMO = {
  _id: "demo-hvac",
  title: "Arctic Solutions",
  subtitle: "Commercial HVAC & Refrigeration Revenue System",
  slug: { current: "hvac" },
  industry: "HVAC",
  location: "Upstate South Carolina",
  description:
    "Emergency intake wizard, click-to-call routing, automated follow-up, and review generation. Live and running for a commercial refrigeration company in the Spartanburg region.",
  modules: ["Emergency Intake Wizard", "Click-to-Call Routing", "SMS Confirmation", "Review Engine", "Service Area Pages", "Automated Follow-Up"],
  stats: [
    { value: "3 weeks", label: "to build", icon: Clock },
    { value: "24/7", label: "intake", icon: Shield },
    { value: "48 hours", label: "first lead", icon: Zap },
  ],
  demoUrl: "https://arcticsolutionsllc.com",
  color: "#00E5CC",
  icon: "Thermometer",
  tier: "Starter + Signature Module",
};

const OTHER_DEMOS = [
  {
    _id: "demo-construction",
    title: "RO Unlimited — Construction & Development",
    slug: { current: "construction" },
    industry: "Construction",
    shortDescription:
      "Full revenue system for a general contractor. Bid intake, project showcase, subcontractor coordination, and client portal with progress tracking.",
    modules: ["Bid Request Intake", "Project Showcase", "Client Portal", "Milestone Invoicing"],
    status: "building",
    color: "#D4772C",
    icon: "HardHat",
    tier: "Growth System",
  },
  {
    _id: "demo-auto",
    title: "Precision Auto — Booking & Estimate System",
    slug: { current: "auto-repair" },
    industry: "Auto Repair",
    shortDescription:
      "Revenue System Starter for an auto repair shop. Online booking, estimate intake with photo upload, job status portal, and review engine.",
    modules: ["Online Booking", "Estimate Intake", "Job Status Portal", "Review Engine"],
    status: "coming-soon",
    color: "#00E5CC",
    icon: "Wrench",
    tier: "Starter + Signature Module",
  },
  {
    _id: "demo-property",
    title: "Haven Properties — Tenant & Maintenance Portal",
    slug: { current: "property-management" },
    industry: "Property Management",
    shortDescription:
      "Revenue System Growth for a property management company. Tenant intake, maintenance request portal, and owner reporting dashboard.",
    modules: ["Tenant Intake", "Maintenance Portal", "Work Orders", "Owner Dashboard"],
    status: "coming-soon",
    color: "#7B5EA7",
    icon: "Building2",
    tier: "Growth",
  },
  {
    _id: "demo-legal",
    title: "Sterling Law — Legal Intake Qualifier",
    slug: { current: "law-firms" },
    industry: "Law Firms",
    shortDescription:
      "Revenue System Starter for a law firm. Lead qualification intake, practice area routing, and consultation scheduling.",
    modules: ["Legal Intake Qualifier", "Consultation Scheduler", "Follow-Up Sequences"],
    status: "coming-soon",
    color: "#7B5EA7",
    icon: "Scale",
    tier: "Starter + Signature Module",
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  live: { label: "LIVE", color: "#00E5CC", icon: <Eye size={12} />, bg: "bg-nv-teal/10" },
  building: { label: "BUILDING NOW", color: "#D4772C", icon: <Rocket size={12} />, bg: "bg-orange-500/10" },
  "coming-soon": { label: "IN DEVELOPMENT", color: "#7B5EA7", icon: <Clock size={12} />, bg: "bg-nv-violet/10" },
  development: { label: "IN DEVELOPMENT", color: "#FF6B35", icon: <Rocket size={12} />, bg: "bg-nv-ember/10" },
};

/* ═══════════════════════════════════════════════════
   FLOATING PARTICLE FIELD
   ═══════════════════════════════════════════════════ */
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${(i * 6.7) % 100}%`,
            top: `${(i * 8.3 + 10) % 100}%`,
            background: i % 3 === 0 ? "#00E5CC" : i % 3 === 1 ? "#7B5EA7" : "#FF6B35",
          }}
          animate={{
            y: [0, -(25 + i * 4), 0],
            opacity: [0.1, 0.35, 0.1],
          }}
          transition={{
            duration: 6 + i * 0.4,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HERO (PARALLAX)
   ═══════════════════════════════════════════════════ */
function ParallaxHero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const springCfg = { stiffness: 100, damping: 30 };
  const headlineY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -80]), springCfg);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={heroRef} className="relative py-20 md:py-32 overflow-hidden min-h-[70vh] flex items-center">
      <ParticleField />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-nv-teal/[0.04] rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-nv-violet/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="nv-container relative z-10 w-full">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.nav variants={fadeUp} className="flex items-center gap-1.5 mb-8">
            <Link href="/" className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors">Home</Link>
            <ChevronRight size={12} className="text-nv-text-muted/50" />
            <span className="text-body-xs text-nv-text-secondary">Live Demos</span>
          </motion.nav>

          <motion.div style={{ y: headlineY, opacity }}>
            <motion.h1
              variants={fadeUp}
              className="font-display text-display-xl md:text-display-2xl leading-[0.95] mb-6 max-w-4xl"
            >
              See It{" "}
              <span className="nv-gradient-text-teal">Running.</span>
              <br />
              Not a Mockup.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-body-lg md:text-body-xl text-nv-text-secondary max-w-2xl mb-8">
              Every demo below is a real system running for a real business. Click through it. Test the forms. See what your customers will experience.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FEATURED DEMO — Arctic Solutions (hero-style)
   ═══════════════════════════════════════════════════ */
function FeaturedDemoSection() {
  const d = FEATURED_DEMO;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-20 md:py-28"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nv-teal/30 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-nv-teal/[0.02] to-transparent" />

      <div className="nv-container">
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 rounded-full bg-nv-teal animate-pulse" />
          <span className="text-label-md text-nv-teal">FLAGSHIP DEMO — LIVE NOW</span>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-12 lg:gap-16 items-start">
          {/* Left: Content */}
          <div>
            <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-2">
              {d.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-body-md text-nv-teal mb-6">
              {d.subtitle} · {d.location}
            </motion.p>
            <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary leading-relaxed mb-8">
              {d.description}
            </motion.p>

            {/* Stats */}
            <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-4 mb-8">
              {d.stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} variants={scaleUp} className="text-center p-4 rounded-nv-lg bg-nv-deep/80 border border-nv-teal/10">
                    <Icon size={16} className="text-nv-teal mx-auto mb-2" />
                    <div className="font-display font-bold text-body-lg nv-gradient-text-teal">{stat.value}</div>
                    <div className="text-body-xs text-nv-text-muted">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <a href={d.demoUrl} target="_blank" rel="noopener noreferrer" className="nv-btn-primary flex items-center gap-2 px-6 py-3">
                <Play size={16} /> Try the Live Demo
              </a>
              <Link href="/contact" className="nv-btn-ghost flex items-center gap-2 px-6 py-3">
                Build One Like This <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          {/* Right: Modules & Tech Panel */}
          <motion.div variants={fadeUp}>
            <div className="nv-glass-elevated rounded-nv-xl p-6 space-y-6">
              <div>
                <h3 className="text-label-md text-nv-text-muted mb-3">DEPLOYED MODULES</h3>
                <div className="flex flex-wrap gap-2">
                  {d.modules.map((mod, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-nv-teal/10 text-nv-teal border border-nv-teal/20">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-body-xs text-nv-text-muted">System tier</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-nv-teal/10 text-nv-teal border border-nv-teal/20">
                    {d.tier}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <a
                  href={d.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group"
                >
                  <span className="text-body-sm text-nv-text-secondary group-hover:text-nv-teal transition-colors">
                    Visit live site →
                  </span>
                  <ExternalLink size={14} className="text-nv-text-muted group-hover:text-nv-teal transition-colors" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════
   UPCOMING DEMO CARD — with email capture
   ═══════════════════════════════════════════════════ */
function UpcomingDemoCard({ demo }: { demo: any }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const color = demo.color || "#7B5EA7";
  const status = statusConfig[demo.status] || statusConfig["coming-soon"];
  const isBuilding = demo.status === "building";

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <motion.div
      variants={scaleUp}
      className="rounded-nv-xl border border-white/[0.06] bg-nv-deep/60 p-6 md:p-7 group hover:border-white/[0.1] transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-nv-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}12` }}
          >
            <IconResolver name={demo.icon || "Box"} size={22} style={{ color }} />
          </div>
          <div>
            <span className="text-body-xs text-nv-text-muted">{demo.industry}</span>
            <div className="text-[10px] font-mono" style={{ color: `${color}80` }}>{demo.tier}</div>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.12em] uppercase ${status.bg}`}
          style={{ color: status.color }}
        >
          {isBuilding && (
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: status.color }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          {!isBuilding && status.icon}
          {status.label}
        </div>
      </div>

      <h3 className="font-display font-semibold text-body-lg mb-2">{demo.title}</h3>
      <p className="text-body-sm text-nv-text-muted leading-relaxed mb-4">
        {demo.shortDescription}
      </p>

      {/* Modules */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {demo.modules?.map((mod: string, i: number) => (
          <span
            key={i}
            className="px-2 py-1 rounded-nv-md text-[10px] font-medium border"
            style={{ borderColor: `${color}20`, backgroundColor: `${color}06`, color: `${color}AA` }}
          >
            {mod}
          </span>
        ))}
      </div>

      {/* Email Capture or Industry Link */}
      {subscribed ? (
        <p className="text-body-sm text-nv-teal flex items-center gap-2">
          <CheckCircle2 size={14} /> You&apos;ll be notified when this launches.
        </p>
      ) : (
        <form onSubmit={handleNotify} className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nv-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isBuilding ? "Get early access" : "Get notified at launch"}
              className="w-full pl-8 pr-3 py-2.5 bg-nv-deep border border-white/[0.08] rounded-nv-md text-body-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/40 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 px-4 py-2.5 rounded-nv-md text-[11px] font-bold tracking-wider uppercase border transition-colors"
            style={{
              backgroundColor: `${color}10`,
              borderColor: `${color}25`,
              color: color,
            }}
          >
            Notify Me
          </button>
        </form>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   YOUR INDUSTRY NEXT — loss-framed
   ═══════════════════════════════════════════════════ */
function YourIndustryNext() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }}>
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-nv-teal/[0.04] rounded-full blur-[150px]" />
      </motion.div>

      <div className="nv-container relative z-10 text-center max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nv-teal/[0.06] border border-nv-teal/15 mb-6">
            <Sparkles size={14} className="text-nv-teal" />
            <span className="text-body-xs font-semibold text-nv-teal">Your Industry Next</span>
          </motion.div>

          <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-4">
            Your Competitors Don&apos;t Have This Yet.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary mb-10">
            Every demo started with a business owner who was tired of losing leads. Your system could be next.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <button className="nv-btn-primary text-base px-8 py-4 flex items-center gap-2">
                Tell Us About Your Business <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN DEMOS PAGE
   ═══════════════════════════════════════════════════ */
export function DemosPageClient({ sanityDemos }: { sanityDemos: any[] | null }) {
  return (
    <PageWrapper>
      <ParallaxHero />

      {/* ═══ FEATURED: Arctic Solutions ═══ */}
      <FeaturedDemoSection />

      {/* ═══ UPCOMING / IN-PROGRESS DEMOS ═══ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-20 md:py-28"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="nv-container">
          <motion.div variants={fadeUp} className="mb-10">
            <span className="nv-section-label mb-4 block">Coming Up</span>
            <h2 className="font-display text-display-sm md:text-display-md mb-3">
              More Systems in the Pipeline
            </h2>
            <p className="text-body-md text-nv-text-muted max-w-xl">
              These are actively being built or scoped. Drop your email to get notified when they launch.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid md:grid-cols-2 gap-6">
            {OTHER_DEMOS.map((demo) => (
              <UpcomingDemoCard key={demo._id} demo={demo} />
            ))}
          </motion.div>
        </div>
      </motion.section>

      <YourIndustryNext />
    </PageWrapper>
  );
}
