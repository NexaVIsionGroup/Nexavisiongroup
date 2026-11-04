"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { nav, CHECKUP_HREF } from "./content";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled || open ? "border-b border-nx-line bg-nx-paper/95 backdrop-blur" : "border-b border-transparent bg-nx-paper"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="font-nx-display text-[22px] font-extrabold tracking-[-0.02em] text-nx-ink" onClick={() => setOpen(false)}>
          NexaVision<span className="font-semibold text-nx-pine"> Group</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-[17px] text-nx-ink hover:bg-nx-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-nx-pine">
              {n.label}
            </Link>
          ))}
          <Link href={CHECKUP_HREF} className="ml-3 rounded-full bg-nx-pine px-5 py-3 text-[16px] font-bold text-white hover:bg-nx-pine-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nx-pine">
            Get a free check-up
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-nx-ink hover:bg-nx-mint lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-nx-line bg-nx-paper px-5 pb-6 pt-2 lg:hidden" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block border-b border-nx-line py-4 text-[19px] text-nx-ink">
              {n.label}
            </Link>
          ))}
          <Link href={CHECKUP_HREF} onClick={() => setOpen(false)} className="mt-5 block rounded-full bg-nx-pine px-5 py-4 text-center text-[18px] font-bold text-white">
            Get a free check-up
          </Link>
        </nav>
      )}
    </header>
  );
}
