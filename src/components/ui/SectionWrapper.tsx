"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  label?: string;
  container?: boolean;
}

export function SectionWrapper({
  children,
  className,
  id,
  label,
  container = true,
}: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn("relative py-20 md:py-28", className)}
    >
      <div className="absolute top-0 left-0 right-0 nv-divider" />
      <div className={cn(container && "nv-container")}>
        {label && (
          <motion.div variants={fadeUp} className="mb-4">
            <span className="nv-section-label">{label}</span>
          </motion.div>
        )}
        {children}
      </div>
    </motion.section>
  );
}
