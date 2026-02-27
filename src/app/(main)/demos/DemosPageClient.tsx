"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { CtaBanner } from "@/components/ui/CtaBanner";
import { IconResolver } from "@/components/ui/IconResolver";
import {
  ChevronRight, ExternalLink, ArrowRight, Play, Eye,
  Sparkles, Monitor, Smartphone, Layers, Zap, Lock,
  CheckCircle2, Clock, Rocket,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   FALLBACK DEMO DATA
   ═══════════════════════════════════════════════════ */
const fallbackDemos = [
  {
    _id: "demo-hvac",
    title: "Arctic Solutions — Commercial Refrigeration & HVAC",
    slug: { current: "hvac" },
    industry: "HVAC",
    shortDescription:
      "Full Revenue System Starter for a commercial refrigeration company. Emergency intake wizard, click-to-call, service pages, trust stack, and automated follow-up.",
    modules: ["Emergency Intake Wizard", "Click-to-Call", "Service Pages", "Trust Stack", "Automated Follow-Up", "Review Engine"],
    features: ["Multi-step emergency/quote intake", "24/7 click-to-call routing", "Equipment-specific service pages", "Google review generation", "SMS/email confirmations", "Mobile-first responsive"],
    status: "live",
    color: "#00E5CC",
    icon: "Thermometer",
    tier: "Starter + Signature Module",
  },
  {
    _id: "demo-auto",
    title: "Precision Auto — Booking & Estimate System",
    slug: { current: "auto-repair" },
    industry: "Auto Repair",
    shortDescription:
      "Revenue System Starter for an auto repair shop. Online booking, estimate intake with photo upload, job status portal, and review engine.",
    modules: ["Online Booking", "Estimate Intake", "Job Status Portal", "Review Engine", "Automated Reminders"],
    features: ["Vehicle year/make/model selection", "Photo upload for damage", "Real-time job status tracking", "Post-service review requests", "Appointment reminders", "Mobile-optimized booking"],
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
      "Revenue System Growth for a property management company. Tenant intake, maintenance request portal, work order tracking, and owner reporting dashboard.",
    modules: ["Tenant Intake", "Maintenance Portal", "Work Orders", "Owner Dashboard", "Document Portal"],
    features: ["Online tenant applications", "Photo-based maintenance requests", "Vendor assignment workflow", "Real-time owner financials", "Secure document sharing", "Automated lease reminders"],
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
      "Revenue System Starter for a law firm. Lead qualification intake, practice area routing, consultation scheduling, and automated nurture sequences.",
    modules: ["Legal Intake Qualifier", "Consultation Scheduler", "Follow-Up Sequences", "Case Status Portal"],
    features: ["Practice area pre-screening", "Conflict check data capture", "Automated consultation booking", "Document upload for case files", "Nurture sequences for unconverted leads", "Client communication portal"],
    status: "development",
    color: "#7B5EA7",
    icon: "Scale",
    tier: "Starter + Signature Module",
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  live: { label: "LIVE", color: "#00E5CC", icon: <Eye size={12} />, bg: "bg-nv-teal/10" },
  "coming-soon": { label: "COMING SOON", color: "#7B5EA7", icon: <Clock size={12} />, bg: "bg-nv-violet/10" },
  development: { label: "IN DEVELOPMENT", color: "#FF6B35", icon: <Rocket size={12} />, bg: "bg-nv-ember/10" },
};

/* ═══════════════════════════════════════════════════
   FLOATING PARTICLE FIELD
   ═══════════════════════════════════════════════════ */
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${(i * 5.3) % 100}%`,
            top: `${(i * 7.1 + 10) % 100}%`,
            background: i % 3 === 0 ? "#00E5CC" : i % 3 === 1 ? "#7B5EA7" : "#FF6B35",
          }}
          animate={{
            y: [0, -(30 + i * 5), 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 6 + i * 0.3,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCROLL PROGRESS INDICATOR
   ═══════════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #00E5CC, #7B5EA7, #FF6B35)",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   PARALLAX HERO TEXT
   ═══════════════════════════════════════════════════ */
function ParallaxHero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const headlineY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -80]), springConfig);
  const subY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -40]), springConfig);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section ref={heroRef} className="relative py-20 md:py-32 overflow-hidden min-h-[85vh] flex items-center">
      <ParticleField />

      {/* Atmosphere */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-nv-teal/[0.04] rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-nv-violet/[0.04] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-nv-ember/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="nv-container relative z-10 w-full">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          {/* Breadcrumb */}
          <motion.nav variants={fadeUp} className="flex items-center gap-1.5 mb-8">
            <Link href="/" className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors">Home</Link>
            <ChevronRight size={12} className="text-nv-text-muted/50" />
            <span className="text-body-xs text-nv-text-secondary">Demos</span>
          </motion.nav>

          {/* Parallax headline */}
          <motion.div style={{ y: headlineY, opacity, scale }}>
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <Monitor size={20} className="text-nv-teal" />
              <span className="nv-section-label">Live Systems</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-display-xl md:text-display-2xl lg:text-[4.5rem] leading-[0.95] mb-8 max-w-4xl"
            >
              See It{" "}
              <span className="relative inline-block">
                <span className="nv-gradient-text-teal">Running.</span>
                {/* Underline glow */}
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-[3px] rounded-full"
                  style={{ background: "linear-gradient(90deg, #00E5CC, #7B5EA7)" }}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                />
              </span>
              <br />
              Not a Mockup.
            </motion.h1>
          </motion.div>

          <motion.div style={{ y: subY, opacity }}>
            <motion.p
              variants={fadeUp}
              className="text-body-xl md:text-body-2xl text-nv-text-secondary max-w-2xl mb-10"
            >
              Real systems. Real data flows. Real businesses.
              Click through live demos or watch video walkthroughs of
              the Revenue System in production.
            </motion.p>

            {/* Device badges */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              {[
                { icon: <Monitor size={14} />, label: "Desktop Optimized" },
                { icon: <Smartphone size={14} />, label: "Mobile First" },
                { icon: <Layers size={14} />, label: "Sanity CMS" },
                { icon: <Zap size={14} />, label: "Edge Deployed" },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-body-xs text-nv-text-muted"
                >
                  <span className="text-nv-teal">{badge.icon}</span>
                  {badge.label}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   DEMO CARD — 3D tilt + clip-path reveal + scan
   ═══════════════════════════════════════════════════ */
function DemoCard({ demo, index }: { demo: any; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), spring);
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), spring);
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), spring);

  // Clip-path reveal on scroll
  const revealRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: revealRef,
    offset: ["start end", "center center"],
  });
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(8% 8% 8% 8% round 16px)", "inset(0% 0% 0% 0% round 16px)"]
  );
  const cardScale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  function handleMouse(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  }

  const color = demo.color || "#00E5CC";
  const status = statusConfig[demo.status] || statusConfig.live;
  const isLive = demo.status === "live";

  return (
    <motion.div
      ref={revealRef}
      style={{ clipPath, scale: cardScale, opacity: cardOpacity }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouse}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1000,
          transformStyle: "preserve-3d",
        }}
        className="relative group"
      >
        <div className="relative overflow-hidden rounded-nv-2xl border border-white/[0.06] bg-gradient-to-br from-nv-deep via-nv-deep/80 to-nv-slate/50 transition-all duration-500 group-hover:border-transparent">

          {/* Holographic glow tracker */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: useTransform(
                [glowX, glowY],
                ([x, y]) => `radial-gradient(500px circle at ${x}% ${y}%, ${color}12, transparent 60%)`
              ),
            }}
          />

          {/* Top edge scan */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
            <motion.div
              className="h-full w-full"
              style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              animate={hovered ? { x: ["-100%", "100%"] } : {}}
              transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
            />
          </div>

          {/* Scan beam */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute top-0 left-0 w-full h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, transparent 20%, ${color}50 50%, transparent 80%)`,
                    boxShadow: `0 0 30px ${color}30`,
                  }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-7 md:p-8">
            {/* Header row */}
            <div className="flex items-start justify-between mb-5" style={{ transform: "translateZ(20px)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-nv-lg flex items-center justify-center transition-all duration-500"
                  style={{
                    backgroundColor: `${color}10`,
                    boxShadow: hovered ? `0 0 25px ${color}20, inset 0 0 15px ${color}08` : "none",
                  }}
                >
                  <IconResolver name={demo.icon || "Box"} size={24} style={{ color }} />
                </div>
                <div>
                  <span className="text-body-xs text-nv-text-muted">{demo.industry}</span>
                  <div className="text-label-sm font-mono" style={{ color: `${color}80` }}>{demo.tier}</div>
                </div>
              </div>

              {/* Status badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.12em] uppercase ${status.bg}`}
                style={{ color: status.color }}
              >
                {demo.status === "live" && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: status.color }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {!isLive && status.icon}
                {status.label}
              </div>
            </div>

            {/* Title & description */}
            <div style={{ transform: "translateZ(15px)" }}>
              <h3 className="font-display font-bold text-body-xl md:text-display-xs mb-3 group-hover:text-white transition-colors">
                {demo.title}
              </h3>
              <p className="text-body-sm text-nv-text-muted leading-relaxed mb-6">
                {demo.shortDescription}
              </p>
            </div>

            {/* Modules */}
            <div className="mb-6" style={{ transform: "translateZ(10px)" }}>
              <p className="text-label-sm text-nv-text-muted mb-3">DEPLOYED MODULES</p>
              <div className="flex flex-wrap gap-1.5">
                {demo.modules?.map((mod: string, i: number) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="px-2.5 py-1 rounded-nv-md text-[11px] font-medium border"
                    style={{
                      borderColor: `${color}20`,
                      backgroundColor: `${color}06`,
                      color: `${color}CC`,
                    }}
                  >
                    {mod}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mb-8" style={{ transform: "translateZ(10px)" }}>
              <p className="text-label-sm text-nv-text-muted mb-3">KEY FEATURES</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demo.features?.slice(0, 6).map((f: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 size={13} style={{ color }} className="shrink-0" />
                    <span className="text-body-xs text-nv-text-secondary">{f}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3" style={{ transform: "translateZ(25px)" }}>
              {isLive ? (
                <>
                  <button className="nv-btn-primary text-sm flex items-center gap-2">
                    <Play size={14} />
                    Launch Demo
                  </button>
                  <Link href={`/industries/${demo.slug?.current || demo.slug}`}>
                    <button className="nv-btn-ghost text-sm flex items-center gap-2">
                      Learn More
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </>
              ) : (
                <Link href={`/industries/${demo.slug?.current || demo.slug}`}>
                  <button className="nv-btn-ghost text-sm flex items-center gap-2">
                    <Lock size={14} />
                    View Industry Page
                    <ArrowRight size={14} />
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute bottom-4 right-4 w-10 h-[1px]" style={{ background: `${color}25` }} />
            <div className="absolute bottom-4 right-4 w-[1px] h-10" style={{ background: `${color}25` }} />
          </div>

          {/* Noise */}
          <div
            className="absolute inset-0 opacity-[0.012] pointer-events-none rounded-nv-2xl"
            style={{ backgroundImage: "url('/images/noise.svg')", backgroundRepeat: "repeat" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   WHAT YOU'LL SEE SECTION
   ═══════════════════════════════════════════════════ */
function WhatYoullSee() {
  const items = [
    { icon: "Globe", title: "Production Website", desc: "Full responsive site with real content, real navigation, and real conversion paths." },
    { icon: "ClipboardList", title: "Intake System", desc: "The signature module in action — multi-step forms with conditional logic and urgency routing." },
    { icon: "Zap", title: "Automation Flows", desc: "Confirmation emails, follow-up sequences, and review requests — all triggered automatically." },
    { icon: "Smartphone", title: "Mobile Experience", desc: "Every demo is mobile-first. Test it on your phone — it's where your customers are." },
  ];

  return (
    <section className="relative py-16 md:py-24">
      <div className="absolute top-0 left-0 right-0 nv-divider" />
      <div className="nv-container">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="nv-section-label mb-4 block">Inside Each Demo</span>
            <h2 className="font-display text-display-md md:text-display-lg mb-4">
              What You&apos;ll <span className="nv-gradient-text-teal">Experience</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.12,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-nv-teal/[0.06] border border-nv-teal/10 flex items-center justify-center group-hover:border-nv-teal/30 group-hover:bg-nv-teal/[0.1] group-hover:shadow-[0_0_30px_rgba(0,229,204,0.15)] transition-all duration-500">
                  <IconResolver
                    name={item.icon}
                    size={26}
                    className="text-nv-teal group-hover:drop-shadow-[0_0_12px_rgba(0,229,204,0.6)] transition-all"
                  />
                </div>
                <h3 className="font-display font-semibold text-body-lg mb-2">{item.title}</h3>
                <p className="text-body-sm text-nv-text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   BUILD YOUR OWN CTA
   ═══════════════════════════════════════════════════ */
function BuildYourOwn() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 nv-divider" />

      {/* Parallax background orbs */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }}>
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-nv-teal/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-nv-violet/[0.04] rounded-full blur-[120px]" />
      </motion.div>

      <div className="nv-container relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nv-teal/[0.06] border border-nv-teal/15 mb-6">
            <Sparkles size={14} className="text-nv-teal" />
            <span className="text-body-xs font-semibold text-nv-teal">Your Industry Next</span>
          </motion.div>

          <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-6">
            This Could Be{" "}
            <span className="nv-gradient-text-teal">Your System.</span>
          </motion.h2>

          <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary mb-8">
            Every demo started as a conversation about bottlenecks, lost leads, and manual
            processes. Your Revenue System starts the same way.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <button className="nv-btn-primary text-base px-8 py-3.5">
                Start Your Build
              </button>
            </Link>
            <Link href="/systems">
              <button className="nv-btn-ghost text-base px-8 py-3.5">
                See All Modules
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
  const demos = sanityDemos && sanityDemos.length > 0 ? sanityDemos : fallbackDemos;

  return (
    <PageWrapper>
      <ScrollProgress />
      <ParallaxHero />

      {/* ═══ DEMO CARDS ═══ */}
      <section className="relative py-16 md:py-24">
        <div className="absolute top-0 left-0 right-0 nv-divider" />
        <div className="nv-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="mb-12"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[1px] bg-nv-teal/40" />
              <span className="text-label-lg text-nv-teal">INTERACTIVE DEMOS</span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-nv-teal/20 to-transparent" />
            </motion.div>
            <motion.p variants={fadeUp} className="text-body-md text-nv-text-muted max-w-xl">
              Each demo is a real Revenue System deployment. Click through, test the intake flows, and see how the modules work together.
            </motion.p>
          </motion.div>

          <div className="space-y-8">
            {demos.map((demo: any, i: number) => (
              <DemoCard key={demo._id} demo={demo} index={i} />
            ))}
          </div>
        </div>
      </section>

      <WhatYoullSee />
      <BuildYourOwn />

      <CtaBanner
        headline="Want a Demo for Your Industry?"
        description="We build demos as part of every engagement. Your Revenue System becomes the proof."
        primaryLabel="Get Started"
        primaryHref="/contact"
        secondaryLabel="View Industries"
        secondaryHref="/industries"
      />
    </PageWrapper>
  );
}
