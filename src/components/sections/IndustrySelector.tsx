"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import * as LucideIcons from "lucide-react";

interface IndustrySelectorProps {
  data: any;
}

function getIcon(name: string) {
  const Icon = (LucideIcons as any)[name];
  return Icon || LucideIcons.Briefcase;
}

export function IndustrySelector({ data }: IndustrySelectorProps) {
  if (!data) return null;
  const industries = data.industries || [];

  return (
    <SectionWrapper id="industries" label={data.sectionLabel}>
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      >
        {industries.map((industry: any, i: number) => {
          const Icon = getIcon(industry.icon);
          const slug = industry.slug?.current || industry.slug;
          const color = industry.color || "#00E5CC";

          return (
            <motion.div key={industry._id || i} variants={scaleUp}>
              <Link
                href={`/industries/${slug}`}
                className="nv-card block p-5 h-full group"
              >
                <div
                  className="w-10 h-10 rounded-nv-md flex items-center justify-center mb-4 transition-all duration-300 group-hover:shadow-nv-glow-sm"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  <Icon size={20} />
                </div>
                <h3 className="font-display font-semibold text-body-md mb-2 group-hover:text-nv-teal transition-colors">
                  {industry.name}
                </h3>
                <p className="text-body-xs text-nv-text-muted leading-relaxed">
                  {industry.shortDescription}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </SectionWrapper>
  );
}
