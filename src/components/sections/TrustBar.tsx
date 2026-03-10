"use client";

import { motion } from "framer-motion";
import { fadeUp, fadeIn, staggerContainer, viewportOnce } from "@/lib/animations";

interface TrustBarProps {
  data?: any;
}

export function TrustBar({ data }: TrustBarProps) {
  const tagline = data?.tagline || "Trusted by service businesses across South Carolina, North Carolina, and Florida";

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-8 border-y border-white/[0.04]"
    >
      <div className="nv-container">
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
        >
          {/* Logos placeholder — renders Arctic Solutions text logo until real logos are uploaded */}
          <div className="flex items-center gap-8">
            <motion.div
              variants={fadeIn}
              className="text-nv-text-muted/60 hover:text-nv-text-muted transition-colors"
            >
              <span className="font-display font-bold text-body-lg tracking-tight">
                Arctic<span className="text-nv-teal/40 hover:text-nv-teal/70 transition-colors">Solutions</span>
              </span>
            </motion.div>
            <motion.div
              variants={fadeIn}
              className="text-nv-text-muted/60 hover:text-nv-text-muted transition-colors"
            >
              <span className="font-display font-bold text-body-lg tracking-tight">
                RO<span className="text-nv-text-muted/40 hover:text-nv-text-muted/70 transition-colors ml-1">Unlimited</span>
              </span>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/[0.08]" />

          {/* Tagline */}
          <motion.p
            variants={fadeIn}
            className="text-body-xs text-nv-text-muted text-center sm:text-left"
          >
            {tagline}
          </motion.p>
        </motion.div>
      </div>
    </motion.section>
  );
}
