"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  label?: string;
  headline: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  label,
  headline,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16",
        align === "center" && "text-center mx-auto max-w-3xl",
        className
      )}
    >
      {label && (
        <motion.div variants={fadeUp} className="mb-4">
          <span className="nv-section-label">{label}</span>
        </motion.div>
      )}
      <motion.h2
        variants={fadeUp}
        className={cn(
          "font-display text-display-md md:text-display-lg mb-4",
          align === "left" && "max-w-3xl"
        )}
      >
        {headline}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUp}
          className={cn(
            "text-body-lg text-nv-text-secondary",
            align === "left" ? "max-w-2xl" : "max-w-xl mx-auto"
          )}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
