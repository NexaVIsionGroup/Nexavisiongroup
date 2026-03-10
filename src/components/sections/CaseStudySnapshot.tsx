"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, scaleUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { Clock, Zap, Shield, ExternalLink, ArrowRight } from "lucide-react";

interface CaseStudySnapshotProps {
  data?: any;
}

export function CaseStudySnapshot({ data }: CaseStudySnapshotProps) {
  const company = data?.company || "Arctic Solutions";
  const headline = data?.headline || "Arctic Solutions: From Kickoff to Live in 3 Weeks";
  const body =
    data?.body ||
    "Arctic Solutions is a commercial refrigeration and HVAC company in Pennsylvania. They needed an emergency intake system that could capture after-hours calls, route urgent requests instantly, and automate follow-up. We built it.";
  const demoLink = data?.demoLink || "https://arcticsolutionsllc.com";

  const stats = data?.stats || [
    { value: "3 weeks", label: "from kickoff to live deployment", icon: Clock },
    { value: "48 hours", label: "first emergency lead captured after launch", icon: Zap },
    { value: "24/7", label: "intake running around the clock without staff", icon: Shield },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative py-24 md:py-32 bg-nv-void/50"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nv-teal/20 to-transparent" />

      <div className="nv-container">
        <motion.div variants={fadeUp} className="mb-4">
          <span className="nv-section-label">Proof</span>
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="font-display text-display-md md:text-display-lg mb-6 max-w-3xl"
        >
          {headline}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-body-lg text-nv-text-secondary max-w-2xl mb-12 leading-relaxed"
        >
          {body}
        </motion.p>

        {/* Stats row */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {stats.map((stat: any, i: number) => {
            const FallbackIcon = [Clock, Zap, Shield][i] || Clock;
            const Icon = FallbackIcon;
            return (
              <motion.div
                key={i}
                variants={scaleUp}
                className="nv-glass-elevated rounded-nv-xl p-6 text-center"
              >
                <Icon size={22} className="text-nv-teal mx-auto mb-3" />
                <div className="font-display font-bold text-display-sm nv-gradient-text-teal mb-1">
                  {stat.value || stat.number}
                </div>
                <div className="text-body-xs text-nv-text-muted">{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
          <a
            href={demoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="nv-btn-ghost flex items-center gap-2 px-6 py-3"
          >
            See the Live Demo <ExternalLink size={16} />
          </a>
          <Link
            href="/contact"
            className="nv-btn-primary flex items-center gap-2 px-6 py-3"
          >
            Build One Like This <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
