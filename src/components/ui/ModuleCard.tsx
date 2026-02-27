"use client";

import { motion } from "framer-motion";
import { scaleUp } from "@/lib/animations";
import { IconResolver } from "@/components/ui/IconResolver";
import { cn } from "@/lib/utils";

const tierConfig: Record<string, { bg: string; text: string; label: string }> = {
  starter: { bg: "bg-nv-teal/10", text: "text-nv-teal", label: "Starter" },
  growth: { bg: "bg-nv-violet/10", text: "text-nv-violet-300", label: "Growth" },
  ops: { bg: "bg-nv-ember/10", text: "text-nv-ember", label: "Ops Stack" },
};

interface ModuleCardProps {
  name: string;
  description: string;
  icon: string;
  features?: string[];
  tier?: string;
  className?: string;
}

export function ModuleCard({
  name,
  description,
  icon,
  features,
  tier = "starter",
  className,
}: ModuleCardProps) {
  const t = tierConfig[tier] || tierConfig.starter;

  return (
    <motion.div
      variants={scaleUp}
      className={cn("nv-module-card p-6 group flex flex-col", className)}
    >
      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-nv-md bg-nv-teal/[0.08] flex items-center justify-center group-hover:bg-nv-teal/[0.15] transition-colors">
            <IconResolver name={icon} size={22} className="text-nv-teal" />
          </div>
          <span
            className={cn(
              "text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full",
              t.bg,
              t.text
            )}
          >
            {t.label}
          </span>
        </div>

        <h3 className="font-display font-semibold text-body-lg mb-2">
          {name}
        </h3>
        <p className="text-body-sm text-nv-text-muted mb-4 leading-relaxed">
          {description}
        </p>

        {features && features.length > 0 && (
          <ul className="space-y-1.5">
            {features.map((f, j) => (
              <li
                key={j}
                className="flex items-center gap-2 text-body-xs text-nv-text-secondary"
              >
                <span className="w-1 h-1 rounded-full bg-nv-teal shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
