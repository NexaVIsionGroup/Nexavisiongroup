"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, scaleUp, viewportOnce } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import * as LucideIcons from "lucide-react";

interface AnthillProps {
  data: any;
}

function getIcon(name: string) {
  const Icon = (LucideIcons as any)[name];
  return Icon || LucideIcons.Box;
}

export function AnthillSection({ data }: AnthillProps) {
  if (!data) return null;

  return (
    <SectionWrapper id="anthill" label={data.sectionLabel}>
      <motion.h2 variants={fadeUp} className="font-display text-display-md md:text-display-lg mb-4 max-w-3xl">
        {data.headline}
      </motion.h2>
      <motion.p variants={fadeUp} className="text-body-lg text-nv-text-secondary max-w-2xl mb-16">
        {data.description}
      </motion.p>

      <div className="relative">
        {/* Surface layer */}
        <motion.div variants={fadeUp} className="mb-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-nv-teal" />
            <span className="text-label-lg text-nv-teal">CUSTOMER-FACING LAYER</span>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.surfaceItems?.map((item: any, i: number) => {
              const Icon = getIcon(item.icon);
              return (
                <motion.div key={i} variants={scaleUp} className="nv-glass-elevated rounded-nv-lg p-5 group hover:border-nv-teal/30 transition-all duration-300">
                  <Icon size={22} className="text-nv-teal mb-3 group-hover:drop-shadow-[0_0_8px_rgba(0,229,204,0.5)] transition-all" />
                  <h4 className="font-display font-semibold text-body-md mb-1">{item.label}</h4>
                  <p className="text-body-sm text-nv-text-muted">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Divider: the "ground line" */}
        <motion.div variants={fadeUp} className="relative my-8 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-nv-teal/40 to-transparent" />
          <span className="relative z-10 px-6 py-2 bg-nv-abyss border border-nv-teal/20 rounded-full text-label-sm text-nv-teal tracking-widest">
            ▼ THE UNDERGROUND ▼
          </span>
        </motion.div>

        {/* Underground layer */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-nv-violet" />
            <span className="text-label-lg text-nv-violet-300">OPERATIONS ENGINE</span>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.undergroundItems?.map((item: any, i: number) => {
              const Icon = getIcon(item.icon);
              return (
                <motion.div key={i} variants={scaleUp} className="nv-module-card p-5 group">
                  <div className="relative z-10">
                    <Icon size={22} className="text-nv-violet-300 mb-3 group-hover:text-nv-teal group-hover:drop-shadow-[0_0_8px_rgba(0,229,204,0.5)] transition-all duration-300" />
                    <h4 className="font-display font-semibold text-body-md mb-1">{item.label}</h4>
                    <p className="text-body-sm text-nv-text-muted">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
