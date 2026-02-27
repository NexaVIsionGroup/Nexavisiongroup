"use client";

import * as LucideIcons from "lucide-react";
import { type LucideProps } from "lucide-react";

interface IconResolverProps extends LucideProps {
  /** Lucide icon name string from Sanity, e.g. "Wrench", "Building2", "Thermometer" */
  name: string;
}

/**
 * Resolves a Lucide icon name string (from Sanity) to an actual component.
 * Falls back to Box icon if the name doesn't match.
 *
 * Usage: <IconResolver name="Wrench" size={20} className="text-nv-teal" />
 */
export function IconResolver({ name, ...props }: IconResolverProps) {
  const Icon = (LucideIcons as any)[name] || LucideIcons.Box;
  return <Icon {...props} />;
}
