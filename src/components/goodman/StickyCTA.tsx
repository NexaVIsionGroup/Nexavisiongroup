"use client";

import { GOODMAN } from "./data";

/** Persistent Call / Quote bar — mobile only. */
export default function StickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="gd-glass gd-topglow flex gap-2 border-t border-[var(--gd-line-strong)] p-3">
        <a href={GOODMAN.phoneHref} className="gd-cta-ghost flex-1 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 11.5a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Call
        </a>
        <a href="#contact" className="gd-cta flex-[1.4] py-3 text-sm">Get a Free Quote</a>
      </div>
    </div>
  );
}
