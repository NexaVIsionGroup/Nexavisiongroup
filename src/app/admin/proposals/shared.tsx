export const field =
  "w-full min-h-[46px] px-3 py-2.5 rounded-nv-md border border-white/10 bg-nv-deep/80 text-nv-text-primary placeholder:text-nv-text-muted outline-none focus:border-nv-teal/50";
export const label = "block text-sm font-medium text-nv-text-secondary mb-1";

export const when = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

type Stat = { status: string; signed_at?: string | null; paid_at?: string | null; due_amount?: number | string | null; link_enabled?: boolean; expires_at?: string | null };

export function statusOf(p: Stat): string {
  if (p.signed_at) {
    if (Number(p.due_amount) > 0) return p.paid_at ? "paid" : "payment due";
    return "signed";
  }
  if (p.link_enabled === false) return "paused";
  if (p.status !== "draft" && p.status !== "declined" && p.expires_at && new Date(p.expires_at) < new Date()) return "expired";
  return p.status;
}

const TONE: Record<string, string> = {
  draft: "bg-white/10 text-nv-text-secondary",
  sent: "bg-sky-400/15 text-sky-300",
  viewed: "bg-violet-400/15 text-violet-300",
  signed: "bg-nv-teal/15 text-nv-teal",
  paid: "bg-nv-teal/15 text-nv-teal",
  "payment due": "bg-amber-400/15 text-amber-300",
  paused: "bg-white/10 text-nv-text-secondary",
  expired: "bg-red-400/15 text-red-300",
  declined: "bg-red-400/15 text-red-300",
};
const LABEL: Record<string, string> = { sent: "Sent, not opened", viewed: "Opened" };

export function StatusChip({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-medium capitalize ${TONE[status] || TONE.draft}`}>{LABEL[status] || status}</span>;
}
