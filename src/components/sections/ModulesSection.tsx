"use client";

import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface ModulesSectionProps {
  data: any;
}

function getIcon(name: string) {
  const Icon = (LucideIcons as any)[name];
  return Icon || LucideIcons.Box;
}

const tierColors: Record<string, { bg: string; text: string; label: string }> = {
  starter: { bg: "bg-nv-teal/10", text: "text-nv-teal", label: "Starter" },
  growth: { bg: "bg-nv-violet/10", text: "text-nv-violet-300", label: "Growth" },
  ops: { bg: "bg-nv-ember/10", text: "text-nv-ember", label: "Ops Stack" },
};

export function ModulesSection({ data }: ModulesSectionProps) {
  if (!data) return null;
  const modules = data.modules || [];

  return (
    <SectionWrapper id="modules" label={data.sectionLabel} className="nv-grid-bg">
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {modules.map((mod: any, i: number) => {
          const Icon = getIcon(mod.icon);
          const tier = tierColors[mod.tier] || tierColors.starter;

          return (
            <motion.div key={i} variants={scaleUp} className="nv-module-card p-6 group flex flex-col">
              <div className="relative z-10 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-nv-md bg-nv-teal/[0.08] flex items-center justify-center group-hover:bg-nv-teal/[0.15] transition-colors">
                    <Icon size={22} className="text-nv-teal" />
                  </div>
                  <span className={cn("text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full", tier.bg, tier.text)}>
                    {tier.label}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-body-lg mb-2">
                  {mod.name}
                </h3>
                <p className="text-body-sm text-nv-text-muted mb-4 leading-relaxed">
                  {mod.description}
                </p>

                {mod.features && mod.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {mod.features.map((f: string, j: number) => (
                      <li key={j} className="flex items-center gap-2 text-body-xs text-nv-text-secondary">
                        <span className="w-1 h-1 rounded-full bg-nv-teal shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </SectionWrapper>
  );
}
