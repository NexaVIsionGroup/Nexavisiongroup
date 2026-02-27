"use client";

import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import * as LucideIcons from "lucide-react";

interface ProofSectionProps {
  data: any;
}

function getIcon(name: string) {
  const Icon = (LucideIcons as any)[name];
  return Icon || LucideIcons.CheckCircle;
}

export function ProofSection({ data }: ProofSectionProps) {
  if (!data) return null;

  return (
    <SectionWrapper id="proof" label={data.sectionLabel}>
      <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-4 max-w-3xl">
        {data.headline}
      </motion.h2>
      <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary max-w-2xl mb-16">
        {data.description}
      </motion.p>

      {/* Stats row */}
      {data.stats && data.stats.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {data.stats.map((stat: any, i: number) => {
            const Icon = getIcon(stat.icon);
            return (
              <motion.div key={i} variants={scaleUp} className="nv-glass-elevated rounded-nv-lg p-6 text-center group hover:border-nv-teal/20 transition-all">
                <Icon size={24} className="text-nv-teal mx-auto mb-3 group-hover:drop-shadow-[0_0_10px_rgba(0,229,204,0.6)] transition-all" />
                <div className="font-display text-display-md nv-gradient-text-teal mb-1">{stat.value}</div>
                <div className="text-body-xs text-nv-text-muted">{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Process steps */}
      {data.processSteps && data.processSteps.length > 0 && (
        <div>
          <motion.h3 variants={fadeUp} className="font-display text-display-sm mb-10 text-center">
            How We Build
          </motion.h3>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {data.processSteps.map((step: any, i: number) => (
              <motion.div key={i} variants={fadeUp} className="relative">
                <div className="nv-card p-6 h-full">
                  <div className="w-10 h-10 rounded-full bg-nv-teal/10 flex items-center justify-center mb-4">
                    <span className="font-mono font-bold text-nv-teal text-body-md">{step.step}</span>
                  </div>
                  <h4 className="font-display font-semibold text-body-lg mb-2">{step.title}</h4>
                  <p className="text-body-sm text-nv-text-muted">{step.description}</p>
                </div>
                {/* Connector line */}
                {i < data.processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-nv-teal/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </SectionWrapper>
  );
}
