"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { scaleUp } from "@/lib/animations";
import { IconResolver } from "@/components/ui/IconResolver";

interface IndustryCardProps {
  name: string;
  slug: string;
  shortDescription: string;
  icon: string;
  color?: string;
}

export function IndustryCard({
  name,
  slug,
  shortDescription,
  icon,
  color = "#00E5CC",
}: IndustryCardProps) {
  return (
    <motion.div variants={scaleUp}>
      <Link
        href={`/industries/${slug}`}
        className="nv-card block p-5 h-full group"
      >
        <div
          className="w-10 h-10 rounded-nv-md flex items-center justify-center mb-4 transition-all duration-300 group-hover:shadow-nv-glow-sm"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <IconResolver name={icon} size={20} />
        </div>
        <h3 className="font-display font-semibold text-body-md mb-2 group-hover:text-nv-teal transition-colors">
          {name}
        </h3>
        <p className="text-body-xs text-nv-text-muted leading-relaxed">
          {shortDescription}
        </p>
      </Link>
    </motion.div>
  );
}
