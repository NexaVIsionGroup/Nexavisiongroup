"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, fadeIn, slideInRight, staggerContainer, staggerFast, viewportOnce } from "@/lib/animations";

interface HeroProps {
  data: any;
}

export function HeroSection({ data }: HeroProps) {
  if (!data) return null;

  const headline = data.headline || "";
  const highlighted = data.highlightedText || "";
  const before = headline.split(highlighted)[0] || "";
  const after = headline.split(highlighted)[1] || "";
  const console_ = data.consolePanel;

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nv-teal/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-nv-violet/[0.04] rounded-full blur-[100px]" />
      </div>

      <div className="nv-container w-full">
        <div className="grid lg:grid-cols-[1fr,420px] gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="nv-chip">
                <span className="nv-status-dot mr-2" />
                Systems Development Firm
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-display-lg md:text-display-xl lg:text-display-2xl mb-6"
            >
              {before}
              <span className="nv-gradient-text-teal">{highlighted}</span>
              {after}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-body-lg text-nv-text-secondary max-w-xl mb-10"
            >
              {data.subheadline}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              {data.primaryCta && (
                <Link href={data.primaryCta.href || "/contact"}>
                  <button className="nv-btn-primary">
                    {data.primaryCta.label}
                  </button>
                </Link>
              )}
              {data.secondaryCta && (
                <Link href={data.secondaryCta.href || "/demos"}>
                  <button className="nv-btn-ghost">
                    {data.secondaryCta.label}
                  </button>
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Right: Console Panel */}
          {console_ && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideInRight}
              className="nv-console p-6 nv-scan-line"
            >
              {/* Status line */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
                <span className="nv-status-dot" />
                <span className="text-label-md text-nv-text-muted">STATUS</span>
                <span className="text-body-sm text-nv-success font-semibold ml-auto">
                  {console_.statusText}
                </span>
              </div>

              {/* Deployment */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-label-md text-nv-text-muted">DEPLOYMENT</span>
                <span className="text-body-sm text-nv-text-primary font-mono">
                  {console_.deploymentText}
                </span>
              </div>

              {/* Modules */}
              <div className="mb-5">
                <span className="text-label-md text-nv-text-muted block mb-3">MODULES</span>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerFast}
                  className="flex flex-wrap gap-2"
                >
                  {console_.modules?.map((mod: string, i: number) => (
                    <motion.span key={i} variants={fadeIn} className="nv-chip text-[11px]">
                      {mod}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              {/* Industries */}
              <div>
                <span className="text-label-md text-nv-text-muted block mb-3">INDUSTRIES</span>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerFast}
                  className="flex flex-wrap gap-2"
                >
                  {console_.industries?.map((ind: string, i: number) => (
                    <motion.span
                      key={i}
                      variants={fadeIn}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-nv-violet/10 text-nv-violet-300 border border-nv-violet/20"
                    >
                      {ind}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
