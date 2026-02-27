"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { scaleUp } from "@/lib/animations";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTierCardProps {
  name: string;
  tagline: string;
  priceRange: string;
  timeline?: string;
  featured?: boolean;
  features: (string | { text: string; included: boolean })[];
  addOns?: string[];
  ctaLabel: string;
  ctaHref: string;
}

export function PricingTierCard({
  name,
  tagline,
  priceRange,
  timeline,
  featured = false,
  features,
  addOns,
  ctaLabel,
  ctaHref,
}: PricingTierCardProps) {
  return (
    <motion.div
      variants={scaleUp}
      className={cn(
        "relative rounded-nv-xl p-7 flex flex-col",
        featured
          ? "nv-glass-elevated border-nv-teal/30 shadow-nv-glow ring-1 ring-nv-teal/20"
          : "nv-card"
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-nv-teal text-nv-abyss text-label-sm font-bold rounded-full shadow-nv-glow">
            RECOMMENDED
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-display font-bold text-body-xl mb-1">{name}</h3>
        <p className="text-body-sm text-nv-text-muted mb-4">{tagline}</p>
        <div className="font-display text-display-sm nv-gradient-text-teal">
          {priceRange}
        </div>
        {timeline && (
          <p className="text-body-xs text-nv-text-muted mt-1 font-mono">
            {timeline}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, j) => {
          const text = typeof feature === "string" ? feature : feature.text;
          const included =
            typeof feature === "string" ? true : feature.included;
          return (
            <li key={j} className="flex items-start gap-2.5">
              <Check
                size={16}
                className={cn(
                  "shrink-0 mt-0.5",
                  included ? "text-nv-teal" : "text-nv-text-muted/30"
                )}
              />
              <span
                className={cn(
                  "text-body-sm",
                  included
                    ? "text-nv-text-secondary"
                    : "text-nv-text-muted/50 line-through"
                )}
              >
                {text}
              </span>
            </li>
          );
        })}
      </ul>

      {addOns && addOns.length > 0 && (
        <div className="mb-6 pt-4 border-t border-white/[0.04]">
          <p className="text-label-sm text-nv-text-muted mb-2">
            OPTIONAL ADD-ONS
          </p>
          <div className="flex flex-wrap gap-1.5">
            {addOns.map((addon, k) => (
              <span
                key={k}
                className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.03] text-nv-text-muted border border-white/[0.06]"
              >
                {addon}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link href={ctaHref}>
        <button
          className={cn("w-full", featured ? "nv-btn-primary" : "nv-btn-ghost")}
        >
          {ctaLabel}
        </button>
      </Link>
    </motion.div>
  );
}
