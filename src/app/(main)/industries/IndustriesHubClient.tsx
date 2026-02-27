"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { CtaBanner } from "@/components/ui/CtaBanner";
import { IconResolver } from "@/components/ui/IconResolver";
import { ArrowRight, Cpu, Layers, Zap, ChevronRight } from "lucide-react";

interface Industry {
  _id: string;
  name: string;
  slug: any;
  shortDescription: string;
  icon: string;
  color?: string;
}

/* ═══════════════════════════════════════════════════
   HOLOGRAPHIC INDUSTRY CARD
   3D tilt, glow tracking, scanning beam, edge light
   ═══════════════════════════════════════════════════ */
function HolographicCard({ industry, index }: { industry: Industry; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

  function handleMouse(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  }

  const slug = industry.slug?.current || industry.slug;
  const color = industry.color || "#00E5CC";

  // Flagship verticals get special treatment
  const isFlagship = slug === "hvac" || slug === "auto-repair";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40, scale: 0.92 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.6,
            delay: index * 0.08,
            ease: [0.25, 0.4, 0.25, 1],
          },
        },
      }}
      className={isFlagship ? "sm:col-span-2 lg:col-span-1" : ""}
    >
      <Link href={`/industries/${slug}`}>
        <motion.div
          ref={ref}
          onMouseMove={handleMouse}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handleLeave}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 800,
            transformStyle: "preserve-3d",
          }}
          className="relative group cursor-pointer"
        >
          {/* Card body */}
          <div className="relative overflow-hidden rounded-nv-xl border border-white/[0.06] bg-gradient-to-br from-nv-deep via-nv-deep to-nv-slate p-6 md:p-7 h-full min-h-[220px] flex flex-col transition-all duration-500 group-hover:border-transparent">

            {/* Holographic glow tracker */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: useTransform(
                  [glowX, glowY],
                  ([x, y]) =>
                    `radial-gradient(400px circle at ${x}% ${y}%, ${color}18, transparent 60%)`
                ),
              }}
            />

            {/* Top edge glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
              <motion.div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  opacity: hovered ? 1 : 0,
                }}
                initial={false}
                animate={hovered ? { x: ["-100%", "100%"] } : {}}
                transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
              />
            </div>

            {/* Scanning beam */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="absolute top-0 left-0 w-full h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent 20%, ${color}60 50%, transparent 80%)`,
                      boxShadow: `0 0 20px ${color}40, 0 0 60px ${color}20`,
                    }}
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flagship badge */}
            {isFlagship && (
              <div className="absolute top-4 right-4 z-10">
                <span className="px-2.5 py-1 text-[9px] font-bold tracking-[0.15em] uppercase rounded-full bg-nv-teal/15 text-nv-teal border border-nv-teal/25 backdrop-blur-sm">
                  Flagship
                </span>
              </div>
            )}

            {/* Icon container with animated ring */}
            <div className="relative mb-5 z-10" style={{ transform: "translateZ(30px)" }}>
              <div
                className="w-14 h-14 rounded-nv-lg flex items-center justify-center transition-all duration-500 group-hover:shadow-lg"
                style={{
                  backgroundColor: `${color}10`,
                  boxShadow: hovered ? `0 0 30px ${color}25, inset 0 0 20px ${color}08` : "none",
                }}
              >
                <IconResolver name={industry.icon} size={26} style={{ color }} />
              </div>

              {/* Animated ring */}
              <motion.div
                className="absolute inset-0 rounded-nv-lg border"
                style={{ borderColor: `${color}30` }}
                animate={hovered ? {
                  scale: [1, 1.4, 1.4],
                  opacity: [0.6, 0, 0],
                } : { scale: 1, opacity: 0 }}
                transition={{ duration: 1.5, repeat: hovered ? Infinity : 0 }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col" style={{ transform: "translateZ(20px)" }}>
              <h3 className="font-display font-bold text-body-xl mb-2 text-nv-text-primary group-hover:text-white transition-colors duration-300">
                {industry.name}
              </h3>
              <p className="text-body-sm text-nv-text-muted leading-relaxed flex-1 mb-5">
                {industry.shortDescription}
              </p>

              {/* CTA arrow */}
              <div className="flex items-center gap-2 text-body-sm font-semibold transition-all duration-300" style={{ color }}>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore system
                </span>
                <motion.div
                  animate={hovered ? { x: [0, 6, 0] } : { x: 0 }}
                  transition={{ duration: 1, repeat: hovered ? Infinity : 0 }}
                >
                  <ArrowRight size={18} />
                </motion.div>
              </div>
            </div>

            {/* Corner accent lines */}
            <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute bottom-3 right-3 w-8 h-[1px]" style={{ background: `${color}30` }} />
              <div className="absolute bottom-3 right-3 w-[1px] h-8" style={{ background: `${color}30` }} />
            </div>

            {/* Noise texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.015] pointer-events-none rounded-nv-xl"
              style={{
                backgroundImage: "url('/images/noise.svg')",
                backgroundRepeat: "repeat",
              }}
            />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   ANIMATED BACKGROUND GRID WITH NODES
   ═══════════════════════════════════════════════════ */
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 229, 204, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 204, 1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating nodes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-nv-teal/30"
          style={{
            left: `${12 + i * 12}%`,
            top: `${15 + (i % 3) * 30}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.4,
          }}
        >
          {/* Node glow */}
          <div className="absolute inset-0 rounded-full bg-nv-teal/20 blur-md scale-[3]" />
        </motion.div>
      ))}

      {/* Connection lines between nodes (decorative) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <motion.line
          x1="12%" y1="15%" x2="24%" y2="45%"
          stroke="#00E5CC" strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.line
          x1="36%" y1="75%" x2="60%" y2="15%"
          stroke="#00E5CC" strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.line
          x1="72%" y1="45%" x2="96%" y2="75%"
          stroke="#7B5EA7" strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STAT COUNTER (animated number)
   ═══════════════════════════════════════════════════ */
function StatCounter({ value, label, icon: IconName }: { value: string; label: string; icon: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative group"
    >
      <div className="nv-glass rounded-nv-lg p-5 text-center hover:border-nv-teal/20 transition-all duration-300">
        <IconResolver name={IconName} size={20} className="text-nv-teal mx-auto mb-2 group-hover:drop-shadow-[0_0_10px_rgba(0,229,204,0.6)] transition-all" />
        <div className="font-display text-display-sm nv-gradient-text-teal">{value}</div>
        <div className="text-body-xs text-nv-text-muted mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN HUB PAGE
   ═══════════════════════════════════════════════════ */
export function IndustriesHubClient({ industries }: { industries: Industry[] }) {
  // Separate flagship from others
  const flagships = industries.filter((i) => {
    const s = i.slug?.current || i.slug;
    return s === "hvac" || s === "auto-repair";
  });
  const others = industries.filter((i) => {
    const s = i.slug?.current || i.slug;
    return s !== "hvac" && s !== "auto-repair";
  });

  return (
    <PageWrapper>
      {/* ═══ HERO ═══ */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        <AnimatedGrid />

        {/* Atmosphere */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-nv-teal/[0.04] rounded-full blur-[160px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-nv-violet/[0.04] rounded-full blur-[130px]" />
        </div>

        <div className="nv-container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl"
          >
            {/* Breadcrumb */}
            <motion.nav variants={fadeUp} className="flex items-center gap-1.5 mb-6">
              <Link href="/" className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors">
                Home
              </Link>
              <ChevronRight size={12} className="text-nv-text-muted/50" />
              <span className="text-body-xs text-nv-text-secondary">Industries</span>
            </motion.nav>

            {/* Label with animated typing cursor */}
            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
              <span className="nv-section-label">Vertical Systems</span>
              <motion.div
                className="w-2 h-5 bg-nv-teal/60 rounded-sm"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-display-lg md:text-display-xl lg:text-display-2xl mb-6"
            >
              Revenue Systems Built for{" "}
              <span className="nv-gradient-text-teal">Your Vertical</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-body-lg md:text-body-xl text-nv-text-secondary max-w-2xl mb-10"
            >
              Every industry gets tailored intake flows, specialized data models,
              industry-specific automations, and proof pages that match buying behavior.
              One platform. Configured for your world.
            </motion.p>

            {/* Quick stats */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-4 max-w-md"
            >
              <StatCounter value="10+" label="Verticals" icon="Layers" />
              <StatCounter value="8" label="Core Modules" icon="Cpu" />
              <StatCounter value="Fast" label="Deployment" icon="Zap" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FLAGSHIP VERTICALS ═══ */}
      <section className="relative py-16 md:py-20">
        <div className="nv-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <div className="w-8 h-[1px] bg-nv-teal/40" />
              <span className="text-label-lg text-nv-teal">FLAGSHIP VERTICALS</span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-nv-teal/20 to-transparent" />
            </motion.div>

            <motion.p variants={fadeUp} className="text-body-md text-nv-text-muted mb-10 max-w-xl">
              Our deepest builds, richest demos, and strongest ROI stories.
              Start here.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flagships.map((industry, i) => (
                <HolographicCard key={industry._id} industry={industry} index={i} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ ALL VERTICALS GRID ═══ */}
      <section className="relative py-16 md:py-24">
        <div className="absolute top-0 left-0 right-0 nv-divider" />

        <div className="nv-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <div className="w-8 h-[1px] bg-nv-violet/40" />
              <span className="text-label-lg text-nv-violet-300">ALL SUPPORTED VERTICALS</span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-nv-violet/20 to-transparent" />
            </motion.div>

            <motion.p variants={fadeUp} className="text-body-md text-nv-text-muted mb-12 max-w-xl">
              Same platform, same quality, configured for each industry&apos;s unique
              workflows and customer acquisition patterns.
            </motion.p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {others.map((industry, i) => (
                <HolographicCard
                  key={industry._id}
                  industry={industry}
                  index={i + flagships.length}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS STRIP ═══ */}
      <section className="relative py-16 md:py-20 nv-grid-bg">
        <div className="absolute top-0 left-0 right-0 nv-divider" />
        <div className="nv-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeUp}
              className="font-display text-display-sm md:text-display-md mb-12 text-center"
            >
              One Platform. <span className="nv-gradient-text-teal">Every Vertical.</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: "Layers",
                  title: "Same Core Engine",
                  description:
                    "Universal data model: leads, contacts, jobs, quotes, invoices, payments. Proven and reliable across every vertical.",
                },
                {
                  icon: "Settings",
                  title: "Configured Per Industry",
                  description:
                    "Tailored intake flows, specialized fields, industry-specific automation rules, and proof pages that match buying behavior.",
                },
                {
                  icon: "Rocket",
                  title: "Deploy in Days",
                  description:
                    "Your Revenue System deploys fast — scoped to the modules that matter most to your vertical.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, delay: i * 0.15 },
                    },
                  }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-nv-teal/[0.06] border border-nv-teal/10 flex items-center justify-center group-hover:border-nv-teal/30 group-hover:shadow-nv-glow-sm transition-all duration-500">
                    <IconResolver
                      name={item.icon}
                      size={28}
                      className="text-nv-teal group-hover:drop-shadow-[0_0_12px_rgba(0,229,204,0.5)] transition-all"
                    />
                  </div>
                  <h3 className="font-display font-semibold text-body-lg mb-3">
                    {item.title}
                  </h3>
                  <p className="text-body-sm text-nv-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CtaBanner
        headline="Don't See Your Industry?"
        description="We build for any service business with high-ticket clients and operational complexity. Let's talk about your vertical."
        primaryLabel="Get a Custom Quote"
        primaryHref="/contact"
        secondaryLabel="View Live Demos"
        secondaryHref="/demos"
      />
    </PageWrapper>
  );
}
