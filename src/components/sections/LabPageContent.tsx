"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  fadeUp,
  scaleUp,
  staggerContainer,
  viewportOnce,
} from "@/lib/animations";
import {
  ExternalLink,
  Clock,
  Zap,
  Shield,
  ArrowRight,
  Layers,
  Globe,
  Receipt,
  Thermometer,
  HardHat,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   NEXAVISION — SYSTEMS LAB
   Case studies + proof of builds
   ═══════════════════════════════════════════════════ */

const ARCTIC_CASE_STUDY = {
  company: "Arctic Solutions",
  industry: "Commercial HVAC & Refrigeration",
  location: "Upstate South Carolina",
  headline: "From Kickoff to Live in 3 Weeks",
  description:
    "Arctic Solutions is a commercial refrigeration and HVAC company in Upstate South Carolina, covering the Spartanburg region and greater Carolinas. They needed an emergency intake system that could capture after-hours calls, route urgent requests instantly, and automate follow-up. We built it.",
  stats: [
    { value: "3 weeks", label: "From kickoff to live deployment", icon: Clock },
    { value: "48 hours", label: "First emergency lead captured after launch", icon: Zap },
    { value: "24/7", label: "Intake running around the clock", icon: Shield },
  ],
  challenge:
    "Arctic Solutions needed a 24/7 emergency intake system for commercial refrigeration clients. After-hours calls were going to voicemail. Emergency leads were lost to competitors who answered faster.",
  solution:
    "Revenue System Starter with custom emergency routing, SMS confirmation, click-to-call integration, and automated review generation. Built on Next.js with Sanity CMS for full content control.",
  techStack: ["Next.js 14", "Sanity CMS", "Tailwind CSS", "Framer Motion", "Vercel"],
  modules: [
    "Emergency Intake Wizard",
    "Click-to-Call Routing",
    "SMS Confirmation",
    "Review Engine",
    "Service Area Pages",
  ],
  demoUrl: "https://arcticsolutionsllc.com",
  tier: "Starter",
};

const OTHER_BUILDS = [
  {
    name: "RO Unlimited",
    type: "Construction & Development Revenue System",
    description:
      "Full revenue system for a general contractor — bid intake, project showcase, subcontractor coordination, and client portal. Currently in active development as NexaVision's flagship construction vertical build.",
    icon: HardHat,
    status: "Building Now",
    color: "#D4772C",
  },
  {
    name: "JHPSFL",
    type: "Lead-to-Job Operating System",
    description:
      "A Tier-3 operating system handling the full lifecycle from lead capture through job completion, invoicing, and review generation. Internal proof-of-concept for the NexaVision ops engine.",
    icon: Layers,
    status: "Internal Build",
    color: "#7B5EA7",
  },
  {
    name: "Den-Chai Restaurant",
    type: "Restaurant Revenue Site",
    description:
      "Full restaurant website with menu management, online ordering integration, event booking, and review aggregation. Demonstrates the platform's flexibility beyond service trades.",
    icon: UtensilsCrossed,
    status: "Live Build",
    color: "#FF6B35",
  },
];

interface LabPageContentProps {
  data: any;
  settings: any;
}

export function LabPageContent({ data, settings }: LabPageContentProps) {
  return (
    <>
      {/* ─── Hero ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="nv-container mb-20"
      >
        <motion.div variants={fadeUp} className="text-center mb-6">
          <span className="nv-section-label mb-4 block">Systems Lab</span>
          <h1 className="font-display text-display-lg md:text-display-xl mb-4 max-w-4xl mx-auto">
            Real Systems. Real Businesses.
          </h1>
          <p className="text-body-lg text-nv-text-secondary max-w-2xl mx-auto">
            Every build below is a production system running for a real company. Click through them.
            Test the forms. See what your customers will experience.
          </p>
        </motion.div>
      </motion.section>

      {/* ─── Featured Case Study: Arctic Solutions ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-20 md:py-28"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-nv-deep/50 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nv-teal/20 to-transparent" />

        <div className="nv-container">
          {/* Feature badge */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
            <Thermometer size={20} className="text-nv-teal" />
            <span className="text-label-md text-nv-teal">FEATURED CASE STUDY</span>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr,1fr] gap-12 lg:gap-16 items-start">
            {/* Left: Story */}
            <div>
              <motion.h2
                variants={fadeUp}
                className="font-display text-display-md md:text-display-lg mb-2"
              >
                {ARCTIC_CASE_STUDY.company}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-body-md text-nv-teal mb-6">
                {ARCTIC_CASE_STUDY.industry} · {ARCTIC_CASE_STUDY.location}
              </motion.p>
              <motion.p
                variants={fadeUp}
                className="text-body-lg text-nv-text-secondary mb-8 leading-relaxed"
              >
                {ARCTIC_CASE_STUDY.description}
              </motion.p>

              {/* Stats */}
              <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-4 mb-8">
                {ARCTIC_CASE_STUDY.stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={scaleUp}
                      className="text-center p-4 rounded-nv-lg bg-nv-deep/80 border border-white/[0.04]"
                    >
                      <Icon size={18} className="text-nv-teal mx-auto mb-2" />
                      <div className="font-display font-bold text-body-lg nv-gradient-text-teal mb-1">
                        {stat.value}
                      </div>
                      <div className="text-body-xs text-nv-text-muted">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <a
                  href={ARCTIC_CASE_STUDY.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nv-btn-primary flex items-center gap-2 px-6 py-3"
                >
                  Try the Live Demo <ExternalLink size={16} />
                </a>
                <Link href="/contact" className="nv-btn-ghost flex items-center gap-2 px-6 py-3">
                  Build One Like This <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>

            {/* Right: Details Panel */}
            <motion.div variants={fadeUp}>
              <div className="nv-glass-elevated rounded-nv-xl p-6 space-y-6">
                {/* Challenge */}
                <div>
                  <h3 className="text-label-md text-nv-text-muted mb-2">THE CHALLENGE</h3>
                  <p className="text-body-sm text-nv-text-secondary leading-relaxed">
                    {ARCTIC_CASE_STUDY.challenge}
                  </p>
                </div>

                {/* Solution */}
                <div>
                  <h3 className="text-label-md text-nv-text-muted mb-2">THE SOLUTION</h3>
                  <p className="text-body-sm text-nv-text-secondary leading-relaxed">
                    {ARCTIC_CASE_STUDY.solution}
                  </p>
                </div>

                {/* Modules */}
                <div>
                  <h3 className="text-label-md text-nv-text-muted mb-3">MODULES DEPLOYED</h3>
                  <div className="flex flex-wrap gap-2">
                    {ARCTIC_CASE_STUDY.modules.map((mod, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-nv-teal/10 text-nv-teal border border-nv-teal/20"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <h3 className="text-label-md text-nv-text-muted mb-3">TECH STACK</h3>
                  <div className="flex flex-wrap gap-2">
                    {ARCTIC_CASE_STUDY.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] text-nv-text-muted border border-white/[0.06]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tier */}
                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-body-xs text-nv-text-muted">System tier</span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-nv-teal/10 text-nv-teal border border-nv-teal/20">
                      {ARCTIC_CASE_STUDY.tier}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ─── Other Builds ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="py-20 md:py-28"
      >
        <div className="nv-container">
          <motion.div variants={fadeUp} className="mb-12">
            <span className="nv-section-label mb-4 block">More Builds</span>
            <h2 className="font-display text-display-sm md:text-display-md mb-4">
              Proof of Range
            </h2>
            <p className="text-body-lg text-nv-text-secondary max-w-2xl">
              Beyond client systems — these builds demonstrate the platform&apos;s depth and
              flexibility across different use cases.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid md:grid-cols-2 gap-6">
            {OTHER_BUILDS.map((build, i) => {
              const Icon = build.icon;
              return (
                <motion.div key={i} variants={scaleUp} className="nv-card p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-nv-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${build.color}15`, color: build.color }}
                    >
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-body-lg">{build.name}</h3>
                      <p className="text-body-sm text-nv-text-muted">{build.type}</p>
                    </div>
                  </div>
                  <p className="text-body-sm text-nv-text-secondary leading-relaxed mb-4">
                    {build.description}
                  </p>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[11px] font-medium border"
                    style={{
                      backgroundColor: `${build.color}10`,
                      color: build.color,
                      borderColor: `${build.color}30`,
                    }}
                  >
                    {build.status}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── CTA ─── */}
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
            Your Competitors Don&apos;t Have This Yet.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-body-lg text-nv-text-secondary mb-10 max-w-xl mx-auto"
          >
            Every demo started with a business owner who was tired of losing leads. Your system
            could be next.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <button className="nv-btn-primary text-base px-8 py-4 flex items-center gap-2">
                Tell Us About Your Business <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
