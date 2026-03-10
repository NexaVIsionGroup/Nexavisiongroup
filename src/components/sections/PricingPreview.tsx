"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { ArrowRight } from "lucide-react";

interface PricingPreviewProps {
  data?: any;
}

export function PricingPreview({ data }: PricingPreviewProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-20 md:py-28"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="nv-container text-center max-w-2xl mx-auto">
        <motion.div variants={fadeUp} className="mb-4">
          <span className="nv-section-label">Investment</span>
        </motion.div>

        <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary mb-2">
          Systems start at
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="font-display text-display-lg md:text-display-xl nv-gradient-text-teal mb-3"
        >
          $6K
        </motion.div>

        <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary mb-10">
          Most clients invest{" "}
          <span className="text-nv-text-primary font-medium">$12K–$25K</span>{" "}
          for the full revenue engine.
        </motion.p>

        <motion.div variants={fadeUp}>
          <Link href="/pricing">
            <button className="nv-btn-ghost text-base px-8 py-4 inline-flex items-center gap-2">
              See Pricing & What&apos;s Included <ArrowRight size={18} />
            </button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
