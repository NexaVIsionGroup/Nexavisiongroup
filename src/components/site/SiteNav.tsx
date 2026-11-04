"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { nav, CHECKUP_HREF } from "./content";
import { Logo } from "./Logo";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <header className="nxs-nav" data-solid={solid || open}>
        <div className="nxs-wrap nxs-nav-inner">
          <Logo uid="nav" onClick={() => setOpen(false)} />
          <nav className="nxs-nav-links" aria-label="Main">
            {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
            <Link href={CHECKUP_HREF} className="nxs-btn nxs-btn-glow nxs-nav-cta">Get a free check-up</Link>
          </nav>
          <button type="button" className="nxs-burger" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>
      {open && (
        <nav className="nxs-sheet" aria-label="Main">
          {nav.map((n) => <Link key={n.href} href={n.href} className="nxs-sheet-link" onClick={() => setOpen(false)}>{n.label}</Link>)}
          <Link href={CHECKUP_HREF} className="nxs-btn nxs-btn-glow" style={{ width: "100%", marginTop: 22 }} onClick={() => setOpen(false)}>Get a free check-up</Link>
        </nav>
      )}
    </>
  );
}
