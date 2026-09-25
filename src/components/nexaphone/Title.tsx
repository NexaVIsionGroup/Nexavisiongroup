"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Section headline: each word rises out of its own mask as it scrolls in. */
export default function Title({
  text,
  className = "np-display np-h2",
  style,
  as = "h2",
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "h2" | "h3";
}) {
  const Tag = as === "h2" ? motion.h2 : motion.h3;
  const words = text.split(" ");
  return (
    <Tag
      className={className}
      style={style}
      aria-label={text}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ staggerChildren: 0.07 }}
    >
      {words.map((w, i) => (
        <span key={i} aria-hidden className="np-word">
          <motion.span
            className="np-word-in"
            variants={{
              hidden: { y: "110%", rotate: 6 },
              shown: { y: "0%", rotate: 0, transition: { duration: 0.9, ease: EASE } },
            }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
