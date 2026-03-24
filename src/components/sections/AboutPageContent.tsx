"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import {
  ArrowRight,
  Code2,
  Shield,
  Clock,
  Eye,
  Layers,
  Zap,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   NEXAVISION — ABOUT PAGE
   Founder story, Anthill philosophy, values
   ═══════════════════════════════════════════════════ */

const VALUES = [
  {
    icon: Code2,
    title: "We build for revenue, not for awards.",
    description:
      "Every decision — design, architecture, copy — is measured against one question: does this help the business owner close more jobs?",
  },
  {
    icon: Shield,
    title: "You own everything we build.",
    description:
      "No lock-in. No recurring license. No hostage situation with your own code. The system is yours, forever.",
  },
  {
    icon: Clock,
    title: "Weeks, not months. Always.",
    description:
      "We scope tight, build fast, and ship working systems. You don't wait 6 months wondering if it'll ever launch.",
  },
  {
    icon: Eye,
    title: "Every system is live before we call it done.",
    description:
      "We don't hand over Figma files and wish you luck. Your system goes through real testing, real data, and real review before launch.",
  },
];

export function AboutPageContent() {
  return (
    <>
      {/* ─── Hero / Founder Section ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="nv-container mb-20"
      >
        <motion.div variants={fadeUp} className="max-w-3xl">
          <span className="nv-section-label mb-6 block">About NexaVision</span>

          <h1 className="font-display text-display-lg md:text-display-xl mb-8">
            Built by <span className="nv-gradient-text-teal">Den Chai</span>
          </h1>

          <div className="space-y-5 text-body-lg text-nv-text-secondary leading-relaxed">
            <motion.p variants={fadeUp}>
              I started NexaVision because I kept seeing the same problem: service business owners
              spending $10K–$20K on websites that looked great but didn&apos;t actually change how
              their business ran. The leads still went to voicemail. The quotes still lived in text
              threads. The follow-up still didn&apos;t happen.
            </motion.p>

            <motion.p variants={fadeUp}>
              So I stopped building websites and started building systems. Not brochures that sit
              there looking pretty — infrastructure that captures leads at 11pm, sends quotes in one
              click, follows up automatically, and collects payment without you lifting a finger.
            </motion.p>

            <motion.p variants={fadeUp}>
              Every system I build runs on the same stack I&apos;d use for a funded startup: Next.js,
              Sanity CMS, Vercel edge deployment, and custom automation. But it&apos;s built for the
              business owner doing $500K–$5M who doesn&apos;t have a dev team and shouldn&apos;t need
              one.
            </motion.p>

            <motion.p variants={fadeUp} className="text-nv-text-primary font-medium">
              If you&apos;re tired of tools that don&apos;t talk to each other and agencies that take
              6 months to deliver a contact form, you&apos;re in the right place.
            </motion.p>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── The Anthill Model (Deep Dive) ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-24 md:py-32 bg-nv-void/50"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nv-teal/20 to-transparent" />

        <div className="nv-container">
          <div className="grid lg:grid-cols-[1fr,1fr] gap-12 lg:gap-20 items-start">
            {/* Left: Story */}
            <div>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <Layers size={20} className="text-nv-teal" />
                <span className="nv-section-label">The Anthill Model</span>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="font-display text-display-md md:text-display-lg mb-6"
              >
                Your Customers See the Surface.
                <br />
                <span className="nv-gradient-text-teal">We Build the Underground.</span>
              </motion.h2>

              <div className="space-y-4 text-body-md text-nv-text-secondary leading-relaxed">
                <motion.p variants={fadeUp}>
                  An anthill looks simple from the top — a clean mound, a clear entrance. But
                  underground? Tunnels, chambers, supply lines, and logistics that make the whole
                  colony run.
                </motion.p>

                <motion.p variants={fadeUp}>
                  That&apos;s how we build. Your customers see a clean, fast, professional website
                  with a smooth intake experience. Behind it, your Revenue System handles lead
                  routing, automated follow-up, quoting, invoicing, payments, and reporting — all
                  without you touching it.
                </motion.p>

                <motion.p variants={fadeUp}>
                  Most agencies build the surface and call it done. We build the surface AND the
                  entire underground infrastructure that actually generates revenue.
                </motion.p>
              </div>
            </div>

            {/* Right: Visual Diagram */}
            <motion.div variants={fadeUp}>
              <div className="space-y-4">
                {[
                  {
                    layer: "THE SURFACE",
                    desc: "What your customers see and interact with",
                    items: ["Website", "Intake Forms", "Trust Pages", "Reviews"],
                    color: "#00E5CC",
                  },
                  {
                    layer: "THE ENGINE",
                    desc: "What runs automatically behind the scenes",
                    items: ["Lead Routing", "Follow-Up", "Quoting", "Invoicing"],
                    color: "#7B5EA7",
                  },
                  {
                    layer: "THE RESULTS",
                    desc: "What you see on your dashboard",
                    items: ["Pipeline", "Revenue", "Close Rates", "Reports"],
                    color: "#FF6B35",
                  },
                ].map((layer, i) => (
                  <div
                    key={i}
                    className="rounded-nv-xl border p-5"
                    style={{
                      borderColor: `${layer.color}20`,
                      backgroundColor: `${layer.color}04`,
                    }}
                  >
                    <span
                      className="text-label-md block mb-2"
                      style={{ color: layer.color }}
                    >
                      {layer.layer}
                    </span>
                    <p className="text-body-sm text-nv-text-muted mb-3">{layer.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.items.map((item, j) => (
                        <span
                          key={j}
                          className="px-2.5 py-1 rounded-full text-[10px] font-medium border"
                          style={{
                            borderColor: `${layer.color}20`,
                            color: `${layer.color}AA`,
                            backgroundColor: `${layer.color}08`,
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ─── Values ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-24 md:py-32"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="nv-container">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className="nv-section-label mb-4 block">How We Work</span>
            <h2 className="font-display text-display-md md:text-display-lg">
              What We Stand On
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {VALUES.map((value, i) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={i}
                  variants={scaleUp}
                  className="nv-card p-6 md:p-8"
                >
                  <Icon size={24} className="text-nv-teal mb-4" />
                  <h3 className="font-display font-semibold text-body-lg mb-2">
                    {value.title}
                  </h3>
                  <p className="text-body-sm text-nv-text-muted leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Tech Stack ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-20 md:py-28 bg-nv-void/30"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="nv-container text-center max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="mb-10">
            <Zap size={20} className="text-nv-teal mx-auto mb-4" />
            <h2 className="font-display text-display-sm mb-4">
              Enterprise Stack. Startup Speed.
            </h2>
            <p className="text-body-md text-nv-text-secondary">
              Every system runs on the same technology powering companies 100× your size — but
              scoped and priced for service businesses.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
            {["Next.js 14", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Sanity CMS", "Vercel Edge", "Node.js"].map(
              (tech, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-nv-lg text-body-sm font-medium bg-nv-deep border border-white/[0.06] text-nv-text-muted"
                >
                  {tech}
                </span>
              )
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── CTA ─── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative py-28 md:py-36"
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nv-teal/[0.04] rounded-full blur-[150px]" />
        </div>
        <div className="nv-container text-center max-w-3xl mx-auto">
          <motion.h2
            variants={fadeUp}
            className="font-display text-display-md md:text-display-lg mb-6"
          >
            Hard work should lead to growth, not chaos.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-body-lg text-nv-text-secondary mb-10 max-w-xl mx-auto"
          >
            Let&apos;s build the system that makes your business run the way it should.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <button className="nv-btn-primary text-base px-8 py-4 flex items-center gap-2">
                Start Your Build <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/demos">
              <button className="nv-btn-ghost text-base px-8 py-4">
                See Live Systems
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
