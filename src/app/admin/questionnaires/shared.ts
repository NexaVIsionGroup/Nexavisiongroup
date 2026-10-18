// Shared helpers for the admin questionnaire pages.

export const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Not opened", cls: "text-nv-text-muted bg-white/5 border-white/10" },
  in_progress: { label: "In progress", cls: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
  submitted: { label: "Submitted", cls: "text-nv-ember bg-nv-ember/10 border-nv-ember/20" },
  reviewed: { label: "Reviewed", cls: "text-nv-teal bg-nv-teal/10 border-nv-teal/20" },
  archived: { label: "Archived", cls: "text-nv-text-muted bg-white/5 border-white/10" },
};

export function ago(d: string | null) {
  if (!d) return "never";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
