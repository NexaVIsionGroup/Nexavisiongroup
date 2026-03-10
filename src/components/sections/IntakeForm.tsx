"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Wrench,
  Building2,
  Scale,
  Shield,
  Scissors,
  Truck,
  Stethoscope,
  Heart,
  Warehouse,
  HardHat,
  HelpCircle,
  PhoneCall,
  Mail,
  MessageSquare,
  Sun,
  Clock,
  Moon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   NEXAVISION — MULTI-STEP INTAKE FORM
   Mirrors the intake wizard NexaVision builds
   for its clients. The contact page IS the product demo.
   ═══════════════════════════════════════════════════ */

const INDUSTRIES = [
  { id: "hvac", label: "HVAC", icon: Thermometer, color: "#00E5CC" },
  { id: "construction", label: "Construction", icon: HardHat, color: "#00E5CC" },
  { id: "auto-repair", label: "Auto Repair", icon: Wrench, color: "#FF6B35" },
  { id: "property-management", label: "Property Mgmt", icon: Building2, color: "#7B5EA7" },
  { id: "law-firms", label: "Law Firms", icon: Scale, color: "#3B82F6" },
  { id: "insurance", label: "Insurance", icon: Shield, color: "#EAB308" },
  { id: "salons", label: "Salons & Spas", icon: Scissors, color: "#EC4899" },
  { id: "logistics", label: "Logistics", icon: Truck, color: "#F97316" },
  { id: "veterinary", label: "Veterinary", icon: Stethoscope, color: "#22C55E" },
  { id: "home-healthcare", label: "Home Healthcare", icon: Heart, color: "#EF4444" },
  { id: "self-storage", label: "Self-Storage", icon: Warehouse, color: "#8B5CF6" },
  { id: "other", label: "Other", icon: HelpCircle, color: "#6B7280" },
];

const BOTTLENECKS = [
  { id: "lost-leads", label: "Leads going to voicemail / unanswered" },
  { id: "slow-quoting", label: "Quoting is slow or disorganized" },
  { id: "no-followup", label: "No automated follow-up" },
  { id: "no-reviews", label: "Few or no online reviews" },
  { id: "no-visibility", label: "No visibility into pipeline or revenue" },
  { id: "manual-scheduling", label: "Manual scheduling and dispatching" },
  { id: "no-portal", label: "No client portal or online payments" },
  { id: "other", label: "Other" },
];

const TEAM_SIZES = [
  { id: "solo", label: "Just me", subtitle: "Solo operator" },
  { id: "small", label: "2–5", subtitle: "team members" },
  { id: "medium", label: "6–15", subtitle: "team members" },
  { id: "large", label: "15+", subtitle: "team members" },
];

const LEAD_VOLUMES = [
  { id: "10", label: "~10/mo" },
  { id: "25", label: "~25/mo" },
  { id: "50", label: "~50/mo" },
  { id: "100", label: "~100/mo" },
  { id: "200", label: "200+/mo" },
];

const CONTACT_METHODS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: PhoneCall },
  { id: "text", label: "Text", icon: MessageSquare },
];

const TIMES = [
  { id: "morning", label: "Morning", icon: Sun },
  { id: "afternoon", label: "Afternoon", icon: Clock },
  { id: "evening", label: "Evening", icon: Moon },
];

function recommendTier(data: FormData): { tier: string; reason: string } {
  const bottleneckCount = data.bottlenecks.length;
  const isLargeTeam = data.teamSize === "large" || data.teamSize === "medium";
  const highLeads = data.leadVolume === "100" || data.leadVolume === "200";

  if (isLargeTeam && (bottleneckCount >= 4 || highLeads)) {
    return {
      tier: "Ops Stack",
      reason: "Your team size and operational complexity call for the full system.",
    };
  }
  if (bottleneckCount >= 3 || (isLargeTeam && bottleneckCount >= 2) || highLeads) {
    return {
      tier: "Growth",
      reason:
        "You've got multiple bottlenecks to solve — Growth covers the intake-to-payment pipeline.",
    };
  }
  return {
    tier: "Starter",
    reason:
      "A focused system to stop the lead bleed and look professional. You can upgrade anytime.",
  };
}

interface FormData {
  industry: string;
  industryOther: string;
  bottlenecks: string[];
  bottleneckOther: string;
  teamSize: string;
  leadVolume: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  contactMethod: string;
  bestTime: string;
}

const INITIAL_DATA: FormData = {
  industry: "",
  industryOther: "",
  bottlenecks: [],
  bottleneckOther: "",
  teamSize: "",
  leadVolume: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  contactMethod: "email",
  bestTime: "morning",
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

interface IntakeFormProps {
  settings: any;
}

export function IntakeForm({ settings }: IntakeFormProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const TOTAL_STEPS = 4;

  const canProceed = useCallback(() => {
    switch (step) {
      case 0:
        return data.industry !== "" && (data.industry !== "other" || data.industryOther.trim() !== "");
      case 1:
        return data.bottlenecks.length > 0;
      case 2:
        return data.teamSize !== "" && data.leadVolume !== "";
      case 3:
        return data.name.trim() !== "" && data.email.trim() !== "";
      default:
        return false;
    }
  }, [step, data]);

  const next = () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setSubmitting(true);

    // Simulate submission — replace with real API route
    try {
      await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {
        // Silently fail — we'll still show confirmation
      });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const toggleBottleneck = (id: string) => {
    setData((prev) => ({
      ...prev,
      bottlenecks: prev.bottlenecks.includes(id)
        ? prev.bottlenecks.filter((b) => b !== id)
        : prev.bottlenecks.length < 3
          ? [...prev.bottlenecks, id]
          : prev.bottlenecks,
    }));
  };

  const recommendation = recommendTier(data);

  // ─── Confirmation Screen ───
  if (submitted) {
    return (
      <div className="nv-container max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="w-20 h-20 rounded-full bg-nv-teal/10 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} className="text-nv-teal" />
          </div>

          <h1 className="font-display text-display-md md:text-display-lg mb-4">
            Thanks, <span className="nv-gradient-text-teal">{data.name.split(" ")[0]}</span>.
          </h1>
          <p className="text-body-lg text-nv-text-secondary mb-10">
            We&apos;ve got your details. Here&apos;s what we&apos;d recommend:
          </p>

          {/* Recommendation Card */}
          <div className="nv-glass-elevated rounded-nv-xl p-8 text-left mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-nv-teal/10 text-nv-teal text-label-md rounded-full">
                RECOMMENDED
              </span>
            </div>
            <h2 className="font-display text-display-sm nv-gradient-text-teal mb-2">
              {recommendation.tier}
            </h2>
            <p className="text-body-md text-nv-text-secondary">{recommendation.reason}</p>
          </div>

          <p className="text-body-md text-nv-text-secondary mb-8">
            We&apos;ll reach out within 24 hours to schedule your discovery call.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://arcticsolutionsllc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nv-btn-ghost inline-flex items-center gap-2 px-6 py-3"
            >
              See a Live System <ExternalLink size={16} />
            </a>
            <a href="/pricing" className="nv-btn-primary px-6 py-3">
              View Pricing
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Form ───
  return (
    <div className="nv-container">
      <div className="grid lg:grid-cols-[1fr,320px] gap-12 lg:gap-16 max-w-5xl mx-auto">
        {/* Main Form Area */}
        <div>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="font-display text-display-md md:text-display-lg mb-3">
              Tell Us About Your Business
            </h1>
            <p className="text-body-lg text-nv-text-secondary">
              10 questions. 2 minutes. We&apos;ll recommend the right system.
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-md text-nv-text-muted">
                STEP {step + 1} OF {TOTAL_STEPS}
              </span>
              <span className="text-body-xs text-nv-text-muted">
                {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
              </span>
            </div>
            <div className="h-1 bg-nv-deep rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-nv-teal to-nv-teal-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="relative min-h-[420px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
              >
                {/* ─── Step 0: Industry ─── */}
                {step === 0 && (
                  <div>
                    <h2 className="font-display text-display-sm mb-2">What&apos;s your industry?</h2>
                    <p className="text-body-md text-nv-text-secondary mb-8">
                      We build systems tailored to how your industry wins customers.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {INDUSTRIES.map((ind) => {
                        const Icon = ind.icon;
                        const selected = data.industry === ind.id;
                        return (
                          <button
                            key={ind.id}
                            onClick={() => setData((d) => ({ ...d, industry: ind.id }))}
                            className={cn(
                              "relative p-4 rounded-nv-lg border text-left transition-all duration-200",
                              "hover:border-nv-teal/30 group",
                              selected
                                ? "border-nv-teal/50 bg-nv-teal/[0.06] shadow-nv-glow-sm"
                                : "border-white/[0.06] bg-nv-deep/60"
                            )}
                          >
                            <Icon
                              size={22}
                              className={cn(
                                "mb-2 transition-colors",
                                selected ? "text-nv-teal" : "text-nv-text-muted group-hover:text-nv-teal"
                              )}
                              style={selected ? {} : { color: ind.color }}
                            />
                            <span
                              className={cn(
                                "block text-body-sm font-medium",
                                selected ? "text-nv-text-primary" : "text-nv-text-secondary"
                              )}
                            >
                              {ind.label}
                            </span>
                            {selected && (
                              <motion.div
                                layoutId="industry-check"
                                className="absolute top-2 right-2"
                              >
                                <CheckCircle2 size={16} className="text-nv-teal" />
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {data.industry === "other" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-4"
                      >
                        <input
                          type="text"
                          placeholder="Tell us your industry..."
                          value={data.industryOther}
                          onChange={(e) => setData((d) => ({ ...d, industryOther: e.target.value }))}
                          className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-4 py-3 text-body-md text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ─── Step 1: Bottlenecks ─── */}
                {step === 1 && (
                  <div>
                    <h2 className="font-display text-display-sm mb-2">
                      What&apos;s your biggest bottleneck?
                    </h2>
                    <p className="text-body-md text-nv-text-secondary mb-8">
                      Pick up to 3. These help us scope the right system.
                    </p>
                    <div className="space-y-3">
                      {BOTTLENECKS.map((bn) => {
                        const selected = data.bottlenecks.includes(bn.id);
                        const atLimit = data.bottlenecks.length >= 3 && !selected;
                        return (
                          <button
                            key={bn.id}
                            onClick={() => toggleBottleneck(bn.id)}
                            disabled={atLimit}
                            className={cn(
                              "w-full p-4 rounded-nv-lg border text-left transition-all duration-200 flex items-center gap-4",
                              atLimit && "opacity-40 cursor-not-allowed",
                              selected
                                ? "border-nv-teal/50 bg-nv-teal/[0.06]"
                                : "border-white/[0.06] bg-nv-deep/60 hover:border-nv-teal/20"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                selected
                                  ? "border-nv-teal bg-nv-teal"
                                  : "border-nv-text-muted"
                              )}
                            >
                              {selected && (
                                <motion.svg
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                >
                                  <path
                                    d="M2 6l3 3 5-5"
                                    stroke="#0A1628"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </motion.svg>
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-body-md",
                                selected ? "text-nv-text-primary" : "text-nv-text-secondary"
                              )}
                            >
                              {bn.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {data.bottlenecks.includes("other") && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-4"
                      >
                        <input
                          type="text"
                          placeholder="Tell us more..."
                          value={data.bottleneckOther}
                          onChange={(e) =>
                            setData((d) => ({ ...d, bottleneckOther: e.target.value }))
                          }
                          className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-4 py-3 text-body-md text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ─── Step 2: Business Size ─── */}
                {step === 2 && (
                  <div>
                    <h2 className="font-display text-display-sm mb-2">
                      How big is your operation?
                    </h2>
                    <p className="text-body-md text-nv-text-secondary mb-8">
                      This helps us recommend the right tier.
                    </p>

                    <div className="mb-8">
                      <span className="text-label-md text-nv-text-muted block mb-4">
                        TEAM SIZE
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {TEAM_SIZES.map((ts) => {
                          const selected = data.teamSize === ts.id;
                          return (
                            <button
                              key={ts.id}
                              onClick={() => setData((d) => ({ ...d, teamSize: ts.id }))}
                              className={cn(
                                "p-4 rounded-nv-lg border text-center transition-all duration-200",
                                selected
                                  ? "border-nv-teal/50 bg-nv-teal/[0.06]"
                                  : "border-white/[0.06] bg-nv-deep/60 hover:border-nv-teal/20"
                              )}
                            >
                              <span
                                className={cn(
                                  "block font-display text-display-sm mb-1",
                                  selected ? "nv-gradient-text-teal" : "text-nv-text-primary"
                                )}
                              >
                                {ts.label}
                              </span>
                              <span className="text-body-xs text-nv-text-muted">
                                {ts.subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-label-md text-nv-text-muted block mb-4">
                        APPROXIMATE MONTHLY LEADS
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {LEAD_VOLUMES.map((lv) => {
                          const selected = data.leadVolume === lv.id;
                          return (
                            <button
                              key={lv.id}
                              onClick={() => setData((d) => ({ ...d, leadVolume: lv.id }))}
                              className={cn(
                                "px-5 py-3 rounded-nv-lg border text-body-sm font-medium transition-all duration-200",
                                selected
                                  ? "border-nv-teal/50 bg-nv-teal/[0.06] text-nv-teal"
                                  : "border-white/[0.06] bg-nv-deep/60 text-nv-text-secondary hover:border-nv-teal/20"
                              )}
                            >
                              {lv.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Step 3: Contact Info ─── */}
                {step === 3 && (
                  <div>
                    <h2 className="font-display text-display-sm mb-2">How do we reach you?</h2>
                    <p className="text-body-md text-nv-text-secondary mb-8">
                      We&apos;ll follow up within 24 hours.
                    </p>

                    <div className="space-y-4 mb-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-label-md text-nv-text-muted block mb-2">
                            NAME *
                          </label>
                          <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                            placeholder="Your name"
                            className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-4 py-3 text-body-md text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-label-md text-nv-text-muted block mb-2">
                            EMAIL *
                          </label>
                          <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                            placeholder="you@company.com"
                            className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-4 py-3 text-body-md text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-label-md text-nv-text-muted block mb-2">
                            PHONE
                          </label>
                          <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                            placeholder="(555) 000-0000"
                            className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-4 py-3 text-body-md text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-label-md text-nv-text-muted block mb-2">
                            COMPANY
                          </label>
                          <input
                            type="text"
                            value={data.company}
                            onChange={(e) => setData((d) => ({ ...d, company: e.target.value }))}
                            placeholder="Company name"
                            className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-4 py-3 text-body-md text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-label-md text-nv-text-muted block mb-2">
                          WEBSITE URL
                        </label>
                        <input
                          type="url"
                          value={data.website}
                          onChange={(e) => setData((d) => ({ ...d, website: e.target.value }))}
                          placeholder="https://yourcompany.com"
                          className="w-full bg-nv-deep border border-white/[0.08] rounded-nv-md px-4 py-3 text-body-md text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Contact Preferences */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <span className="text-label-md text-nv-text-muted block mb-3">
                          PREFERRED CONTACT METHOD
                        </span>
                        <div className="flex gap-2">
                          {CONTACT_METHODS.map((cm) => {
                            const Icon = cm.icon;
                            const selected = data.contactMethod === cm.id;
                            return (
                              <button
                                key={cm.id}
                                onClick={() =>
                                  setData((d) => ({ ...d, contactMethod: cm.id }))
                                }
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2.5 rounded-nv-md border text-body-sm transition-all",
                                  selected
                                    ? "border-nv-teal/50 bg-nv-teal/[0.06] text-nv-teal"
                                    : "border-white/[0.06] text-nv-text-muted hover:border-nv-teal/20"
                                )}
                              >
                                <Icon size={14} />
                                {cm.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-label-md text-nv-text-muted block mb-3">
                          BEST TIME TO TALK
                        </span>
                        <div className="flex gap-2">
                          {TIMES.map((t) => {
                            const Icon = t.icon;
                            const selected = data.bestTime === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => setData((d) => ({ ...d, bestTime: t.id }))}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2.5 rounded-nv-md border text-body-sm transition-all",
                                  selected
                                    ? "border-nv-teal/50 bg-nv-teal/[0.06] text-nv-teal"
                                    : "border-white/[0.06] text-nv-text-muted hover:border-nv-teal/20"
                                )}
                              >
                                <Icon size={14} />
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04]">
            <button
              onClick={prev}
              disabled={step === 0}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-nv-md text-body-sm font-medium transition-all",
                step === 0
                  ? "opacity-0 pointer-events-none"
                  : "text-nv-text-secondary hover:text-nv-teal hover:bg-white/[0.03]"
              )}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={next}
                disabled={!canProceed()}
                className={cn(
                  "nv-btn-primary flex items-center gap-2 px-6 py-3",
                  !canProceed() && "opacity-50 cursor-not-allowed"
                )}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className={cn(
                  "nv-btn-primary flex items-center gap-2 px-8 py-3",
                  (!canProceed() || submitting) && "opacity-50 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Get My System Recommendation
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ─── Side Panel (Desktop) ─── */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <div className="nv-glass-elevated rounded-nv-xl p-6">
              <h3 className="font-display font-semibold text-body-lg mb-6">What happens next?</h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-nv-teal/10 flex items-center justify-center shrink-0">
                    <span className="font-mono font-bold text-nv-teal text-body-xs">1</span>
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-nv-text-primary">We review your intake</p>
                    <p className="text-body-xs text-nv-text-muted">
                      Your answers help us scope the right modules.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-nv-teal/10 flex items-center justify-center shrink-0">
                    <span className="font-mono font-bold text-nv-teal text-body-xs">2</span>
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-nv-text-primary">15-min discovery call</p>
                    <p className="text-body-xs text-nv-text-muted">
                      Quick call to map your workflow and confirm fit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-nv-teal/10 flex items-center justify-center shrink-0">
                    <span className="font-mono font-bold text-nv-teal text-body-xs">3</span>
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-nv-text-primary">Custom proposal in 48 hours</p>
                    <p className="text-body-xs text-nv-text-muted">
                      Modules, timeline, and investment — all laid out.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <p className="text-body-xs text-nv-text-muted mb-1">Prefer to talk?</p>
                <p className="text-body-sm text-nv-text-secondary">
                  Email{" "}
                  <a href="mailto:hello@nexavisiongroup.com" className="text-nv-teal hover:underline">
                    hello@nexavisiongroup.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
