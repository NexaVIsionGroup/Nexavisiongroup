"use client";

import { type Variants } from "framer-motion";

/* ═══════════════════════════════════════════════════
   NEXAVISION — ANIMATION PRESETS
   Centralized motion config for consistency.
   Import these into any component using framer-motion.
   ═══════════════════════════════════════════════════ */

// ── Fade up (default section reveal) ──
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  },
};

// ── Fade in (simple opacity) ──
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// ── Slide in from right ──
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

// ── Slide in from left ──
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

// ── Scale up (cards, modules) ──
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

// ── Stagger container (wrap children) ──
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// ── Stagger container (faster, for chips/tags) ──
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// ── Glow pulse (for decorative elements) ──
export const glowPulse: Variants = {
  hidden: { opacity: 0.3 },
  visible: {
    opacity: [0.3, 0.8, 0.3],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// ── Viewport trigger settings (reuse across sections) ──
export const viewportOnce = {
  once: true,
  amount: 0.15 as const,
  margin: "-50px" as const,
};

// ── Card hover effect ──
export const cardHover = {
  y: -4,
  transition: { duration: 0.25, ease: [0.25, 0.4, 0.25, 1] },
};

// ── Button tap ──
export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.1 },
};
