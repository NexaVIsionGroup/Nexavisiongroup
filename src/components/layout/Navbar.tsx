"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/client";
import { cn } from "@/lib/utils";

interface NavbarProps {
  settings: any;
}

export function Navbar({ settings }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [capacityDismissed, setCapacityDismissed] = useState(false);

  const nav = settings?.navigation;
  const logo = settings?.logo;
  const items = nav?.items || [];
  const cta = nav?.ctaButton;

  // Capacity bar data — pulls from Sanity settings or falls back
  const capacity = settings?.capacityBar || {
    message: "Q2 2026: 2 build slots remaining",
    linkText: "Start your project",
    linkHref: "/contact",
    isActive: true,
    urgencyLevel: "medium",
  };

  const showCapacity = capacity.isActive && !capacityDismissed;

  // Detect scroll past hero for sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const urgencyColors: Record<string, string> = {
    low: "bg-nv-teal/10 text-nv-teal border-nv-teal/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <>
      {/* ═══ G3: Capacity / Scarcity Bar ═══ */}
      <AnimatePresence>
        {showCapacity && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed top-0 left-0 right-0 z-[60] border-b overflow-hidden",
              urgencyColors[capacity.urgencyLevel] || urgencyColors.medium
            )}
          >
            <div className="nv-container flex items-center justify-center gap-3 h-10 md:h-10 text-center">
              <span className="text-[13px] font-medium">
                {capacity.message}
              </span>
              {capacity.linkText && (
                <>
                  <span className="text-current/30">—</span>
                  <Link
                    href={capacity.linkHref || "/contact"}
                    className="text-[13px] font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    {capacity.linkText}
                  </Link>
                </>
              )}
              <button
                onClick={() => setCapacityDismissed(true)}
                className="absolute right-4 p-1 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ G1: Main Navigation ═══ */}
      <header
        className="fixed left-0 right-0 z-50 transition-[top] duration-300"
        style={{ top: showCapacity ? 40 : 0 }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-nv-abyss/70 backdrop-blur-xl border-b border-white/[0.04]" />

        <nav className="relative nv-container flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="relative flex items-center shrink-0">
            {logo?.image?.asset ? (
              <div
                style={{
                  width: logo.width || 180,
                  height: logo.height || "auto",
                  transform: `translate(${logo.offsetX || 0}px, ${logo.offsetY || 0}px)`,
                }}
              >
                <Image
                  src={urlFor(logo.image).url()}
                  alt={settings?.siteName || "NexaVision Group"}
                  width={logo.width || 180}
                  height={logo.height || 48}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <span className="font-display text-xl font-bold tracking-tight">
                <span className="text-nv-text-primary">Nexa</span>
                <span className="nv-gradient-text-teal">Vision</span>
                <span className="text-nv-text-secondary font-normal ml-1.5 text-sm hidden sm:inline">
                  Group
                </span>
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {items.map((item: any, i: number) => (
              <Link
                key={i}
                href={item.href || "#"}
                className={cn(
                  "px-4 py-2 text-body-sm font-medium text-nv-text-secondary",
                  "hover:text-nv-teal transition-colors duration-200",
                  "relative group"
                )}
              >
                {item.label}
                <span className="absolute bottom-0 left-4 right-4 h-px bg-nv-teal scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          {cta && (
            <Link href={cta.href || "/contact"} className="hidden lg:block">
              <button className="nv-btn-primary text-xs px-6 py-2.5">
                {cta.label || "Start Your Build"}
                <ArrowRight size={14} className="ml-1" />
              </button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden relative p-2 text-nv-text-secondary hover:text-nv-teal transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* ═══ G4: Sticky Header CTA ═══ */}
        <AnimatePresence>
          {scrolledPastHero && !mobileOpen && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative border-t border-white/[0.03] bg-nv-abyss/60 backdrop-blur-lg"
            >
              <div className="nv-container flex items-center justify-center gap-4 h-10">
                <span className="hidden sm:inline text-body-xs text-nv-text-muted">
                  {capacity.isActive ? capacity.message : "Ready to stop losing leads?"}
                </span>
                <Link href="/contact">
                  <button className="text-[11px] font-bold tracking-wider uppercase px-4 py-1.5 bg-nv-teal/10 text-nv-teal border border-nv-teal/20 rounded-full hover:bg-nv-teal/20 transition-colors">
                    Start Your Build →
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative lg:hidden overflow-hidden bg-nv-abyss/95 backdrop-blur-2xl border-b border-white/[0.04]"
            >
              <div className="nv-container py-6 space-y-1">
                {items.map((item: any, i: number) => (
                  <Link
                    key={i}
                    href={item.href || "#"}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-body-lg text-nv-text-secondary hover:text-nv-teal hover:bg-white/[0.02] rounded-nv-md transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
                {cta && (
                  <div className="pt-4 px-4">
                    <Link href={cta.href || "/contact"} onClick={() => setMobileOpen(false)}>
                      <button className="nv-btn-primary w-full">
                        {cta.label || "Start Your Build"}
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
