"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";

interface CtaCloseSectionProps {
  data: any;
}

export function CtaCloseSection({ data }: CtaCloseSectionProps) {
  if (!data) return null;

  const headline =
    data.headline || "Your next lead is 15 minutes away from choosing your competitor.";
  const description =
    data.description || "Let's build the system that makes sure they choose you.";

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-28 md:py-36 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-nv-teal/[0.04] rounded-full blur-[180px]" />
      </div>

      <div className="nv-container text-center max-w-3xl mx-auto">
        <motion.h2
          variants={fadeUp}
          className="font-display text-display-md md:text-display-lg mb-6"
        >
          {headline}
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="text-body-lg text-nv-text-secondary mb-10 max-w-xl mx-auto"
        >
          {description}
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
          {data.primaryCta && (
            <Link href={data.primaryCta.href || "/contact"}>
              <button className="nv-btn-primary text-base px-8 py-4">
                {data.primaryCta.label || "Start Your Build"}
              </button>
            </Link>
          )}
          {data.secondaryCta && (
            <a
              href={
                data.secondaryCta.href ||
                "mailto:hello@nexavisiongroup.com?subject=15-Min Scope Call"
              }
            >
              <button className="nv-btn-ghost text-base px-8 py-4">
                {data.secondaryCta.label || "Book a 15-Min Call"}
              </button>
            </a>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
