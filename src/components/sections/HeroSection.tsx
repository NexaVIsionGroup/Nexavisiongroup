"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";

interface HeroProps {
  data: any;
}

export function HeroSection({ data }: HeroProps) {
  if (!data) return null;

  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-nv-teal/[0.05] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-nv-violet/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="nv-container w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl"
        >
          <motion.h1
            variants={fadeUp}
            className="font-display text-display-lg md:text-display-xl lg:text-display-2xl mb-6 leading-[1.05]"
          >
            {data.headline || "Stop Losing Leads. Start Closing More Jobs."}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-body-lg md:text-body-xl text-nv-text-secondary max-w-2xl mb-10 leading-relaxed"
          >
            {data.subheadline ||
              "We build automated intake, quoting, and follow-up systems for service businesses. Your website becomes a revenue engine — not a brochure."}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-8">
            {data.primaryCta && (
              <Link href={data.primaryCta.href || "/contact"}>
                <button className="nv-btn-primary text-base px-8 py-4">
                  {data.primaryCta.label || "Start Your Build"}
                </button>
              </Link>
            )}
            {data.secondaryCta && (
              <a
                href={data.secondaryCta.href || "https://arcticsolutionsllc.com"}
                target={data.secondaryCta.href?.startsWith("http") ? "_blank" : undefined}
                rel={data.secondaryCta.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <button className="nv-btn-ghost text-base px-8 py-4">
                  {data.secondaryCta.label || "See a Live System"}
                </button>
              </a>
            )}
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-body-sm text-nv-text-muted"
          >
            {data.trustLine ||
              "Trusted by Arctic Solutions, RO Unlimited, and service businesses across the Carolinas"}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
