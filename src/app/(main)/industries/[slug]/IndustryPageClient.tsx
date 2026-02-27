"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, staggerFast, viewportOnce } from "@/lib/animations";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { CtaBanner } from "@/components/ui/CtaBanner";
import { IconResolver } from "@/components/ui/IconResolver";
import { urlFor } from "@/sanity/lib/client";
import {
  ChevronRight, ArrowRight, ExternalLink, CheckCircle2,
  AlertTriangle, Zap, Shield, Star, ChevronDown
} from "lucide-react";

interface IndustryPageClientProps {
  data: any;
}

/* ═══════════════════════════════════════════════════
   ANIMATED STAT BLOCK
   ═══════════════════════════════════════════════════ */
function StatBlock({ value, label, index }: { value: string; label: string; index: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: {
          opacity: 1, scale: 1, y: 0,
          transition: { duration: 0.5, delay: index * 0.1, ease: [0.25, 0.4, 0.25, 1] },
        },
      }}
      className="text-center group"
    >
      <div className="nv-glass-elevated rounded-nv-xl p-6 hover:border-nv-teal/20 transition-all duration-500">
        <div className="font-display text-display-md nv-gradient-text-teal mb-1 group-hover:drop-shadow-[0_0_20px_rgba(0,229,204,0.3)] transition-all">
          {value}
        </div>
        <div className="text-body-xs text-nv-text-muted">{label}</div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   PAIN POINT CARD with reveal
   ═══════════════════════════════════════════════════ */
function PainPointCard({ item, index, color }: { item: any; index: number; color: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -30 },
        visible: {
          opacity: 1, x: 0,
          transition: { duration: 0.5, delay: index * 0.1 },
        },
      }}
      className="flex gap-4 group"
    >
      <div className="shrink-0 mt-1">
        <div
          className="w-10 h-10 rounded-nv-md flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
          style={{ backgroundColor: `${color}12`, boxShadow: `0 0 0 1px ${color}20` }}
        >
          <AlertTriangle size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold text-body-md mb-1 group-hover:text-nv-teal transition-colors">
          {item.title}
        </h4>
        <p className="text-body-sm text-nv-text-muted leading-relaxed">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MODULE TILE (compact)
   ═══════════════════════════════════════════════════ */
function ModuleTile({ item, index, color }: { item: any; index: number; color: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1, y: 0, scale: 1,
          transition: { duration: 0.4, delay: index * 0.08 },
        },
      }}
      className="nv-module-card p-5 group"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-nv-md flex items-center justify-center transition-all duration-300"
            style={{ backgroundColor: `${color}10` }}
          >
            <IconResolver name={item.icon || "Box"} size={18} style={{ color }} />
          </div>
          <h4 className="font-display font-semibold text-body-md">
            {item.name}
          </h4>
        </div>
        <p className="text-body-sm text-nv-text-muted leading-relaxed">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   SIGNATURE MODULE SPOTLIGHT
   ═══════════════════════════════════════════════════ */
function SignatureSpotlight({ module, color }: { module: any; color: string }) {
  if (!module) return null;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative"
    >
      <div className="relative overflow-hidden rounded-nv-2xl border border-white/[0.06] bg-gradient-to-br from-nv-deep via-nv-slate/50 to-nv-deep p-8 md:p-10">
        {/* Accent glow */}
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[150px] opacity-[0.06]"
          style={{ background: color }}
        />

        {/* Top badge */}
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
          <Star size={16} style={{ color }} />
          <span className="text-label-md tracking-widest uppercase" style={{ color }}>
            Signature Module
          </span>
        </motion.div>

        <motion.h3 variants={fadeUp} className="font-display text-display-sm md:text-display-md mb-4">
          {module.name}
        </motion.h3>

        <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary max-w-2xl mb-8">
          {module.description}
        </motion.p>

        {module.features && module.features.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {module.features.map((f: string, i: number) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0, transition: { delay: i * 0.06 } },
                }}
                className="flex items-center gap-2.5"
              >
                <CheckCircle2 size={16} style={{ color }} className="shrink-0" />
                <span className="text-body-sm text-nv-text-secondary">{f}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-nv-2xl">
          <motion.div
            className="absolute top-0 left-0 w-full h-[1px]"
            style={{
              background: `linear-gradient(90deg, transparent 20%, ${color}40 50%, transparent 80%)`,
            }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN INDUSTRY PAGE
   ═══════════════════════════════════════════════════ */
export function IndustryPageClient({ data }: IndustryPageClientProps) {
  const color = data.color || "#00E5CC";
  const slug = data.slug?.current || data.slug;

  return (
    <PageWrapper>
      {/* ═══ HERO ═══ */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        {/* Colored atmosphere */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.06]"
            style={{ background: color }}
          />
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-nv-violet/[0.03] rounded-full blur-[130px]" />
        </div>

        <div className="nv-container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Breadcrumb */}
            <motion.nav variants={fadeUp} className="flex items-center gap-1.5 mb-6">
              <Link href="/" className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors">Home</Link>
              <ChevronRight size={12} className="text-nv-text-muted/50" />
              <Link href="/industries" className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors">Industries</Link>
              <ChevronRight size={12} className="text-nv-text-muted/50" />
              <span className="text-body-xs text-nv-text-secondary">{data.name}</span>
            </motion.nav>

            <div className="grid lg:grid-cols-[1fr,auto] gap-12 items-start">
              <div>
                {/* Icon + label */}
                <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-nv-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}12`, boxShadow: `0 0 20px ${color}15` }}
                  >
                    <IconResolver name={data.icon || "Box"} size={24} style={{ color }} />
                  </div>
                  <span className="nv-section-label" style={{ color }}>
                    {data.name} Systems
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="font-display text-display-lg md:text-display-xl lg:text-display-2xl mb-6"
                >
                  Revenue Infrastructure for{" "}
                  <span style={{ color }}>{data.name}</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="text-body-lg md:text-body-xl text-nv-text-secondary max-w-2xl mb-8"
                >
                  {data.shortDescription || `Tailored intake flows, specialized modules, and automation built specifically for ${data.name} businesses.`}
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                  <Link href="/contact">
                    <button className="nv-btn-primary">
                      Build My {data.name} System
                    </button>
                  </Link>
                  {data.demoLink && (
                    <a href={data.demoLink} target="_blank" rel="noopener noreferrer">
                      <button className="nv-btn-ghost">
                        <span>View Live Demo</span>
                        <ExternalLink size={16} />
                      </button>
                    </a>
                  )}
                </motion.div>
              </div>

              {/* Stats sidebar */}
              {data.stats && data.stats.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3 min-w-[240px]"
                >
                  {data.stats.map((stat: any, i: number) => (
                    <StatBlock key={i} value={stat.value} label={stat.label} index={i} />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ PAIN POINTS ═══ */}
      {data.painPoints && data.painPoints.length > 0 && (
        <section className="relative py-16 md:py-24">
          <div className="absolute top-0 left-0 right-0 nv-divider" />
          <div className="nv-container">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
                <Shield size={18} style={{ color }} />
                <span className="nv-section-label" style={{ color }}>Problems We Solve</span>
              </motion.div>

              <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-4 max-w-3xl">
                {data.name} Businesses Lose Revenue to These Problems
              </motion.h2>
              <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary max-w-2xl mb-12">
                Every one of these is a system failure — not a marketing failure. We fix the system.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl"
              >
                {data.painPoints.map((item: any, i: number) => (
                  <PainPointCard key={i} item={item} index={i} color={color} />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══ KEY MODULES ═══ */}
      {data.keyModules && data.keyModules.length > 0 && (
        <section className="relative py-16 md:py-24 nv-grid-bg">
          <div className="absolute top-0 left-0 right-0 nv-divider" />
          <div className="nv-container">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
                <Zap size={18} style={{ color }} />
                <span className="nv-section-label" style={{ color }}>Deployed Modules</span>
              </motion.div>

              <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-4 max-w-3xl">
                Your {data.name} Revenue System Includes
              </motion.h2>
              <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary max-w-2xl mb-12">
                Core modules configured specifically for {data.name} workflows, plus your industry&apos;s signature module.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12"
              >
                {data.keyModules.map((mod: any, i: number) => (
                  <ModuleTile key={i} item={mod} index={i} color={color} />
                ))}
              </motion.div>

              {/* Signature module spotlight */}
              <SignatureSpotlight module={data.signatureModule} color={color} />
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══ HOW IT WORKS (compact) ═══ */}
      <section className="relative py-16 md:py-24">
        <div className="absolute top-0 left-0 right-0 nv-divider" />
        <div className="nv-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-12">
              Live in <span className="nv-gradient-text-teal">Weeks, Not Months</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Discovery", desc: `We map your ${data.name} lead-to-job pipeline and identify where revenue leaks.` },
                { step: "02", title: "Build", desc: "Your system goes live with industry-specific modules, intake flows, and automations." },
                { step: "03", title: "Scale", desc: "Ongoing optimization, feature expansion, and performance monitoring as you grow." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.5 } },
                  }}
                >
                  <div className="relative mb-4">
                    <span
                      className="font-mono text-[4rem] font-bold leading-none opacity-10"
                      style={{ color }}
                    >
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-body-xl mb-2">{item.title}</h3>
                  <p className="text-body-sm text-nv-text-muted">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CtaBanner
        headline={`Ready to Build Your ${data.name} Revenue System?`}
        description={`Get a system engineered for ${data.name} businesses. Intake, pipeline, automation — live in weeks, not months.`}
        primaryLabel="Start Your Build"
        primaryHref="/contact"
        secondaryLabel="View Pricing"
        secondaryHref="/pricing"
      />
    </PageWrapper>
  );
}
