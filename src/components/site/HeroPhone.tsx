"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, FileSignature, FolderOpen, CreditCard, Star, Inbox, Package } from "lucide-react";
import { heroAlerts } from "./content";

const ICONS: Record<string, typeof Inbox> = {
  Orders: ShoppingBag,
  Quotes: FileSignature,
  Drive: FolderOpen,
  Payments: CreditCard,
  Reviews: Star,
  Inbox: Inbox,
  Store: Package,
};

const TONE: Record<string, string> = {
  sun: "bg-nx-sun text-nx-ink",
  pine: "bg-nx-pine text-white",
  ink: "bg-nx-ink text-white",
};

const VISIBLE = 4;

/** The hero's one moment of motion: business alerts arriving on the owner's phone. */
export function HeroPhone() {
  const reduce = useReducedMotion();
  const [start, setStart] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStart((s) => (s + 1) % heroAlerts.length), 2600);
    return () => clearInterval(id);
  }, [reduce]);

  // Newest on top: walk backwards from `start`.
  const shown = Array.from({ length: VISIBLE }, (_, i) => {
    const idx = (start - i + heroAlerts.length * 2) % heroAlerts.length;
    return { ...heroAlerts[idx], key: `${idx}` };
  });

  return (
    <div className="relative mx-auto w-full max-w-[340px]" aria-label="Example business app alerts on a phone" role="img">
      <div className="rounded-[2.75rem] border-[10px] border-nx-ink bg-nx-ink shadow-[0_40px_80px_-30px_rgba(15,92,85,0.45)]">
        <div className="overflow-hidden rounded-[2.1rem] bg-nx-paper">
          {/* status bar */}
          <div className="flex items-center justify-between px-6 pt-3 font-nx-display text-[12px] font-bold text-nx-ink">
            <span>9:41</span>
            <span className="h-5 w-20 rounded-full bg-nx-ink" />
            <span>100%</span>
          </div>
          {/* app header */}
          <div className="px-5 pb-3 pt-5">
            <p className="text-[13px] text-nx-soft">Good evening</p>
            <p className="font-nx-display text-[22px] font-bold leading-tight text-nx-ink">Your Business</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ["Today", "$1,962"],
                ["New leads", "7"],
                ["To reply", "2"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white px-2 py-2 ring-1 ring-nx-line">
                  <p className="font-nx-display text-[17px] font-bold text-nx-ink">{v}</p>
                  <p className="text-[11px] text-nx-soft">{k}</p>
                </div>
              ))}
            </div>
          </div>
          {/* alerts */}
          <div className="h-[334px] space-y-2.5 bg-nx-mint/70 px-3 pt-3">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((a) => {
                const Icon = ICONS[a.app] ?? Inbox;
                return (
                  <motion.div
                    key={a.key}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: -24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_0_rgba(23,35,33,0.06)] ring-1 ring-nx-line"
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE[a.tone]}`}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[14px] font-bold text-nx-ink">{a.title}</span>
                        {a.amount && <span className="shrink-0 font-nx-display text-[14px] font-bold text-nx-pine">{a.amount}</span>}
                      </span>
                      <span className="block truncate text-[12.5px] text-nx-soft">{a.detail}</span>
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
