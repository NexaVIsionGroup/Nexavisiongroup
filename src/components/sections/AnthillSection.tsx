"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { ChevronDown, Globe, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnthillProps {
  data: any;
}

const LAYERS = [
  {
    id: "surface",
    label: "THE SURFACE",
    subtitle: "Your website, intake forms, and trust pages",
    icon: Globe,
    color: "#00E5CC",
    bgColor: "bg-nv-teal/[0.04]",
    borderColor: "border-nv-teal/20",
    modules: [
      {
        name: "Multi-Step Intake",
        outcome: "A guided form that asks the right questions and filters out tire-kickers before they hit your inbox.",
      },
      {
        name: "Trust Stack",
        outcome: "Reviews, credentials, and proof pages that make visitors confident before they ever pick up the phone.",
      },
      {
        name: "High-Converting Pages",
        outcome: "Industry-specific landing pages engineered to turn visitors into leads — not just viewers.",
      },
    ],
  },
  {
    id: "engine",
    label: "THE ENGINE",
    subtitle: "Automated quoting, follow-up, scheduling, and invoicing",
    icon: Zap,
    color: "#7B5EA7",
    bgColor: "bg-nv-violet/[0.04]",
    borderColor: "border-nv-violet/20",
    modules: [
      {
        name: "Automated Follow-Up",
        outcome: "Every lead gets a personalized email and text within 5 minutes. No manual work.",
      },
      {
        name: "Quote Builder",
        outcome: "Professional quotes sent in one click. Customers accept online. You get notified instantly.",
      },
      {
        name: "Invoicing & Payments",
        outcome: "Send invoices, collect payments, and issue receipts — all automatically after the job's done.",
      },
    ],
  },
  {
    id: "results",
    label: "THE RESULTS",
    subtitle: "Dashboards, reports, and revenue tracking",
    icon: BarChart3,
    color: "#FF6B35",
    bgColor: "bg-nv-ember/[0.04]",
    borderColor: "border-nv-ember/20",
    modules: [
      {
        name: "Pipeline Dashboard",
        outcome: "See every lead, quote, and job in one view. Know exactly where your revenue stands.",
      },
      {
        name: "Performance Reports",
        outcome: "Track close rates, response times, and revenue per lead — see what's working and what isn't.",
      },
    ],
  },
];

export function AnthillSection({ data }: AnthillProps) {
  const [openLayer, setOpenLayer] = useState<string | null>(null);

  const headline = data?.headline || "What Happens After Someone Finds You";
  const description =
    data?.description ||
    "Most websites stop at the front door. Your Revenue System handles everything behind it.";

  const toggleLayer = (id: string) => {
    setOpenLayer((prev) => (prev === id ? null : id));
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-24 md:py-32"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="nv-container max-w-4xl mx-auto">
        <motion.div variants={fadeUp} className="mb-4">
          <span className="nv-section-label">{data?.sectionLabel || "How It Works"}</span>
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="font-display text-display-md md:text-display-lg mb-4 max-w-3xl"
        >
          {headline}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-body-lg text-nv-text-secondary max-w-2xl mb-14"
        >
          {description}
        </motion.p>

        {/* 3-Layer Accordion */}
        <motion.div variants={fadeUp} className="space-y-4 mb-10">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isOpen = openLayer === layer.id;

            return (
              <div
                key={layer.id}
                className={cn(
                  "rounded-nv-xl border overflow-hidden transition-all duration-300",
                  isOpen ? layer.borderColor : "border-white/[0.06]",
                  isOpen ? layer.bgColor : "bg-nv-deep/40"
                )}
              >
                {/* Header — always visible */}
                <button
                  onClick={() => toggleLayer(layer.id)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left group"
                >
                  <div
                    className="w-10 h-10 rounded-nv-md flex items-center justify-center shrink-0 transition-all"
                    style={{ backgroundColor: `${layer.color}15` }}
                  >
                    <Icon size={20} style={{ color: layer.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-label-md block mb-1"
                      style={{ color: layer.color }}
                    >
                      {layer.label}
                    </span>
                    <p className="text-body-md text-nv-text-secondary">
                      {layer.subtitle}
                    </p>
                  </div>
                  <ChevronDown
                    size={20}
                    className={cn(
                      "text-nv-text-muted shrink-0 transition-transform duration-300",
                      isOpen && "rotate-180"
                    )}
                    style={isOpen ? { color: layer.color } : undefined}
                  />
                </button>

                {/* Expanded modules */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                    >
                      <div className="px-5 md:px-6 pb-6 space-y-3">
                        {layer.modules.map((mod, j) => (
                          <div
                            key={j}
                            className="rounded-nv-lg bg-nv-abyss/50 border border-white/[0.04] p-4"
                          >
                            <h4 className="font-display font-semibold text-body-md text-nv-text-primary mb-1">
                              {mod.name}
                            </h4>
                            <p className="text-body-sm text-nv-text-muted leading-relaxed">
                              {mod.outcome}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp}>
          <Link
            href="/systems"
            className="text-nv-teal text-body-md font-medium hover:underline inline-flex items-center gap-1"
          >
            Want to see all the modules? →
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
