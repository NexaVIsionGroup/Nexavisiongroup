"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { urlFor } from "@/sanity/lib/client";
import { cn } from "@/lib/utils";

interface NavbarProps {
  settings: any;
}

export function Navbar({ settings }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = settings?.navigation;
  const logo = settings?.logo;
  const items = nav?.items || [];
  const cta = nav?.ctaButton;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
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
              <span className="text-nv-text-secondary font-normal ml-1.5 text-sm">Group</span>
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
              {cta.label || "Get a Quote"}
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
                      {cta.label || "Get a Quote"}
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
