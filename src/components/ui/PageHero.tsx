"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  label?: string;
  headline: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
  className?: string;
  /** Render headline with gradient on a specific substring */
  highlightText?: string;
}

export function PageHero({
  label,
  headline,
  description,
  breadcrumbs,
  children,
  className,
  highlightText,
}: PageHeroProps) {
  // Split headline around highlighted text if provided
  let headlineContent: React.ReactNode = headline;
  if (highlightText && headline.includes(highlightText)) {
    const parts = headline.split(highlightText);
    headlineContent = (
      <>
        {parts[0]}
        <span className="nv-gradient-text-teal">{highlightText}</span>
        {parts[1]}
      </>
    );
  }

  return (
    <section className={cn("relative py-16 md:py-24 overflow-hidden", className)}>
      {/* Background atmosphere */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-nv-teal/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-nv-violet/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="nv-container">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl"
        >
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <motion.nav variants={fadeUp} className="flex items-center gap-1.5 mb-6">
              <Link
                href="/"
                className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors"
              >
                Home
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight size={12} className="text-nv-text-muted/50" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-body-xs text-nv-text-muted hover:text-nv-teal transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-body-xs text-nv-text-secondary">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </motion.nav>
          )}

          {/* Section label */}
          {label && (
            <motion.div variants={fadeUp} className="mb-4">
              <span className="nv-section-label">{label}</span>
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-display-lg md:text-display-xl mb-6"
          >
            {headlineContent}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              variants={fadeUp}
              className="text-body-lg text-nv-text-secondary max-w-2xl"
            >
              {description}
            </motion.p>
          )}

          {/* Optional extra content (CTAs, stats, etc.) */}
          {children && (
            <motion.div variants={fadeUp} className="mt-8">
              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
