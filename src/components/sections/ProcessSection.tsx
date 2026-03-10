"use client";

import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";

interface ProcessSectionProps {
  data?: any;
}

const STEPS = [
  {
    step: 1,
    title: "Tell us where you're losing money",
    description: "A 10-minute call or our intake form maps your bottlenecks.",
  },
  {
    step: 2,
    title: "We design and build your system",
    description: "Custom modules, tailored to your vertical, built in weeks.",
  },
  {
    step: 3,
    title: "You go live and start closing",
    description: "Launch, train, and optimize. Revenue starts flowing.",
  },
];

export function ProcessSection({ data }: ProcessSectionProps) {
  const steps = data?.processSteps?.length === 3 ? data.processSteps : STEPS;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-24 md:py-32"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="nv-container">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <span className="nv-section-label mb-4 block">How It Works</span>
          <h2 className="font-display text-display-md md:text-display-lg">
            Three Steps. That&apos;s It.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10"
        >
          {steps.map((step: any, i: number) => (
            <motion.div key={i} variants={scaleUp} className="relative text-center">
              {/* Number circle */}
              <div className="w-14 h-14 rounded-full bg-nv-teal/10 border border-nv-teal/20 flex items-center justify-center mx-auto mb-5">
                <span className="font-mono font-bold text-nv-teal text-body-lg">
                  {step.step}
                </span>
              </div>

              {/* Connecting line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-nv-teal/30 to-nv-teal/10" />
              )}

              <h3 className="font-display font-semibold text-body-lg mb-2">
                {step.title}
              </h3>
              <p className="text-body-sm text-nv-text-muted leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-center text-body-md text-nv-text-muted"
        >
          No lock-in contracts. No 6-month timelines. Just systems that work.
        </motion.p>
      </div>
    </motion.section>
  );
}
