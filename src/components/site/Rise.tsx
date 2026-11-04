"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Headline whose words rise out of their own masks when scrolled into view. */
export function Rise({
  text,
  as = "h2",
  className = "",
  delay = 0,
  immediate = false,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "span";
  className?: string;
  delay?: number;
  /** Animate on mount (hero) instead of on scroll. */
  immediate?: boolean;
}) {
  const Tag = motion[as];
  const words = text.split(" ");
  const trigger = immediate
    ? { initial: "hidden", animate: "shown" }
    : { initial: "hidden", whileInView: "shown", viewport: { once: true, margin: "0px 0px -10% 0px" } };
  return (
    <Tag className={className} aria-label={text} {...trigger} transition={{ staggerChildren: 0.06, delayChildren: delay }}>
      {words.map((w, i) => (
        <Fragment key={i}>
        <span aria-hidden className="nxs-word">
          <motion.span
            className="nxs-word-in"
            variants={{
              hidden: { y: "112%", rotate: 5 },
              shown: { y: "0%", rotate: 0, transition: { duration: 0.95, ease: EASE } },
            }}
          >
            {w}
          </motion.span>
        </span>
        {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
