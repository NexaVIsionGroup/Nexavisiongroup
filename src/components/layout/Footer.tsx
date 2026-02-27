"use client";

import Link from "next/link";
import { Linkedin, Twitter, Instagram, Facebook, Youtube, Github } from "lucide-react";

interface FooterProps {
  settings: any;
}

const socialIcons: Record<string, any> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  github: Github,
};

export function Footer({ settings }: FooterProps) {
  const footer = settings?.footer;
  const socials = settings?.socialLinks || [];

  return (
    <footer className="relative border-t border-white/[0.04]">
      {/* Gradient fade */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nv-teal/20 to-transparent" />

      <div className="nv-container py-16 md:py-20">
        {/* Top: Logo + Tagline + Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-xl font-bold tracking-tight">
                <span className="text-nv-text-primary">Nexa</span>
                <span className="nv-gradient-text-teal">Vision</span>
              </span>
            </Link>
            {footer?.tagline && (
              <p className="text-body-sm text-nv-text-muted max-w-sm leading-relaxed">
                {footer.tagline}
              </p>
            )}

            {/* Social icons */}
            {footer?.showSocials && socials.length > 0 && (
              <div className="flex gap-3 mt-6">
                {socials.map((social: any, i: number) => {
                  const Icon = socialIcons[social.platform];
                  if (!Icon) return null;
                  return (
                    <a
                      key={i}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/[0.03] transition-all"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link columns */}
          {footer?.columns?.map((col: any, i: number) => (
            <div key={i}>
              <h4 className="nv-section-label text-nv-text-muted mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links?.map((link: any, j: number) => (
                  <li key={j}>
                    <Link
                      href={link.href || "#"}
                      className="text-body-sm text-nv-text-secondary hover:text-nv-teal transition-colors duration-200"
                      {...(link.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.04]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-body-xs text-nv-text-muted">
              {footer?.bottomText || `© ${new Date().getFullYear()} NexaVision Group. All rights reserved.`}
            </p>
            <p className="text-body-xs text-nv-text-muted/50">
              Engineered with precision. Built for revenue.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
