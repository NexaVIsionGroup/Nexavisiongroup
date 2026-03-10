"use client";

import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { PhoneOff, FileQuestion, ClipboardList } from "lucide-react";

interface ProblemSectionProps {
  data?: any;
}

const FALLBACK_PROBLEMS = [
  {
    icon: PhoneOff,
    text: "Leads go to voicemail after hours. By morning, they've called your competitor.",
    color: "#EF4444",
  },
  {
    icon: FileQuestion,
    text: "Quotes live in text threads. You have no idea which ones converted.",
    color: "#EAB308",
  },
  {
    icon: ClipboardList,
    text: "You're doing $800K in revenue but still dispatching by phone and sticky notes.",
    color: "#FF6B35",
  },
];

export function ProblemSection({ data }: ProblemSectionProps) {
  const headline = data?.headline || "Sound Familiar?";
  const problems = data?.problems || FALLBACK_PROBLEMS;
  const closingLine =
    data?.closingLine ||
    "These aren't marketing problems. They're system problems. And they're costing you real money.";

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-20 md:py-28 bg-nv-void/50"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="nv-container">
        <motion.h2
          variants={fadeUp}
          className="font-display text-display-sm md:text-display-md text-center mb-14"
        >
          {headline}
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14"
        >
          {problems.map((problem: any, i: number) => {
            const FallbackIcon = FALLBACK_PROBLEMS[i]?.icon || PhoneOff;
            const Icon = FallbackIcon;
            const color = problem.color || FALLBACK_PROBLEMS[i]?.color || "#EF4444";
            const text = typeof problem === "string" ? problem : problem.text;

            return (
              <motion.div
                key={i}
                variants={scaleUp}
                className="rounded-nv-xl border border-white/[0.06] bg-nv-deep/60 p-6 md:p-8"
              >
                <div
                  className="w-11 h-11 rounded-nv-md flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <p className="text-body-md text-nv-text-secondary leading-relaxed">
                  {text}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-body-lg text-nv-text-primary text-center max-w-2xl mx-auto font-medium"
        >
          {closingLine}
        </motion.p>
      </div>
    </motion.section>
  );
}
