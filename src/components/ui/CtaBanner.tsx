"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface CtaBannerProps {
  headline?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}

export function CtaBanner({
  headline = "Ready to Replace Chaos with Systems?",
  description = "Stop losing leads to slow follow-up and manual processes.",
  primaryLabel = "Start Your Build",
  primaryHref = "/contact",
  secondaryLabel,
  secondaryHref,
  className,
}: CtaBannerProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn("relative py-20 md:py-28 overflow-hidden", className)}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-nv-teal/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="nv-container">
        <div className="nv-glass-elevated rounded-nv-xl p-10 md:p-14 text-center max-w-3xl mx-auto">
          <motion.h2
            variants={fadeUp}
            className="font-display text-display-sm md:text-display-md mb-4"
          >
            {headline}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-body-lg text-nv-text-secondary mb-8 max-w-lg mx-auto"
          >
            {description}
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href={primaryHref}>
              <button className="nv-btn-primary">{primaryLabel}</button>
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link href={secondaryHref}>
                <button className="nv-btn-ghost">{secondaryLabel}</button>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
