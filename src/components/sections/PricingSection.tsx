"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  data: any;
}

export function PricingSection({ data }: PricingSectionProps) {
  if (!data) return null;
  const tiers = data.tiers || [];

  return (
    <SectionWrapper id="pricing" label={data.sectionLabel}>
      <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-4 max-w-3xl">
        {data.headline}
      </motion.h2>
      <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary max-w-2xl mb-14">
        {data.description}
      </motion.p>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
      >
        {tiers.map((tier: any, i: number) => (
          <motion.div
            key={i}
            variants={scaleUp}
            className={cn(
              "relative rounded-nv-xl p-7 flex flex-col",
              tier.featured
                ? "nv-glass-elevated border-nv-teal/30 shadow-nv-glow ring-1 ring-nv-teal/20"
                : "nv-card"
            )}
          >
            {/* Featured badge */}
            {tier.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 bg-nv-teal text-nv-abyss text-label-sm font-bold rounded-full shadow-nv-glow">
                  RECOMMENDED
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-display font-bold text-body-xl mb-1">{tier.name}</h3>
              <p className="text-body-sm text-nv-text-muted mb-4">{tier.tagline}</p>
              <div className="font-display text-display-sm nv-gradient-text-teal">{tier.priceRange}</div>
              {tier.timeline && (
                <p className="text-body-xs text-nv-text-muted mt-1 font-mono">{tier.timeline}</p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
              {(tier.features || []).map((feature: any, j: number) => {
                const text = typeof feature === "string" ? feature : feature.text;
                return (
                  <li key={j} className="flex items-start gap-2.5">
                    <Check size={16} className="text-nv-teal shrink-0 mt-0.5" />
                    <span className="text-body-sm text-nv-text-secondary">{text}</span>
                  </li>
                );
              })}
            </ul>

            {/* Add-ons */}
            {tier.addOns && tier.addOns.length > 0 && (
              <div className="mb-6 pt-4 border-t border-white/[0.04]">
                <p className="text-label-sm text-nv-text-muted mb-2">OPTIONAL ADD-ONS</p>
                <div className="flex flex-wrap gap-1.5">
                  {tier.addOns.map((addon: string, k: number) => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.03] text-nv-text-muted border border-white/[0.06]">
                      {addon}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <Link href={tier.ctaHref || "/contact"}>
              <button className={cn("w-full", tier.featured ? "nv-btn-primary" : "nv-btn-ghost")}>
                {tier.ctaLabel || "Get Started"}
              </button>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </SectionWrapper>
  );
}
