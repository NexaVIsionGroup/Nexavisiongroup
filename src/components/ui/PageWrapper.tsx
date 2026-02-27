"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={cn("min-h-screen pt-20 md:pt-24", className)}
    >
      {children}
    </motion.main>
  );
}
