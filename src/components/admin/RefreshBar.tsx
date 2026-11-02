"use client";

import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Thin status strip for lists that render from the device's saved copy.
 *   refreshing → "Updating…"
 *   error      → "Couldn't refresh — showing saved copy" + Retry
 * Nothing is rendered when the data is fresh and idle.
 */
export default function RefreshBar({
  refreshing, error, savedAt, onRetry, className,
}: { refreshing: boolean; error: string | null; savedAt: number | null; onRetry: () => void; className?: string }) {
  if (!refreshing && !error) return null;
  return (
    <div className={cn("flex items-center gap-2 px-5 py-1.5 text-xs", error ? "text-nv-warning" : "text-nv-text-muted", className)}>
      {error ? <WifiOff size={13} /> : <Loader2 size={13} className="animate-spin" />}
      <span className="flex-1 truncate">
        {error ? `Couldn't refresh — showing ${savedAt ? `copy from ${ago(savedAt)}` : "saved copy"}` : "Updating…"}
      </span>
      {error && (
        <button onClick={onRetry} className="flex items-center gap-1 font-semibold text-nv-teal">
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}
