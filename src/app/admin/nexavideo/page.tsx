"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/admin/AppShell";
import { Link2, Copy, Check, Loader2, Power, Trash2, KeyRound, RefreshCw, Unlock, Film, ExternalLink, Package, CalendarPlus, BadgeCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Nexa Video (private Android media-center app) — invite friends, see who uses it, turn accounts off.
// An invite link lets the person pick a username + password at /nexavideo/i/<code>; they download the APK at
// /nexavideo and sign in inside the app. Turning an account off signs the app out at its next launch.

type NvUser = {
  id: string; label: string; username: string | null; enabled: boolean; signed_up: boolean;
  pending_link: "invite" | "reset" | null; link_expires: string | null; locked: boolean;
  created_at: string; last_login_at: string | null; last_seen_at: string | null;
  app_version: string | null; device: string | null; downloads: number;
  plan: "full" | "trial"; trial_days: number | null; trial_ends_at: string | null;
  trial_expired: boolean; trial_days_left: number | null;
};
type AccessRequest = { id: string; name: string; contact: string; note: string; username: string; created_at: string };
type Release = { version_code: number; version_name: string; notes: string; size_bytes: number | null; created_at: string };

const BTN =
  "inline-flex items-center gap-1.5 rounded-nv-md px-2.5 py-1.5 text-[12.5px] nv-glass border border-nv-teal/15 " +
  "text-nv-text-secondary hover:border-nv-teal/40 hover:text-nv-text-primary transition-all disabled:opacity-40";

async function copyText(text: string) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }
function ago(s: string | null) {
  if (!s) return "never";
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export default function NexaVideoAdmin() {
  const [users, setUsers] = useState<NvUser[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [downloads, setDownloads] = useState<{ paused: boolean; allow: string[] }>({ paused: false, allow: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [label, setLabel] = useState("");
  const [isTrial, setIsTrial] = useState(true);
  const [trialDays, setTrialDays] = useState("10");
  const [msg, setMsg] = useState("");
  const [lastLink, setLastLink] = useState<{ link: string; note: string; copied: boolean } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/nexavideo", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setUsers(d.users || []); setReleases(d.releases || []); setRequests(d.requests || []); setDownloads(d.downloads || { paused: false, allow: [] }); } else setMsg(d.error || "Could not load.");
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(key: string, body: Record<string, unknown>) {
    setBusy(key); setMsg("");
    const r = await fetch("/api/admin/nexavideo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) { setMsg(d.error || "That did not work."); return null; }
    await load();
    return d as Record<string, unknown>;
  }
  async function showLink(d: Record<string, unknown> | null, note: string) {
    if (!d?.link) return;
    const link = String(d.link);
    setLastLink({ link, note, copied: await copyText(link) });
  }

  const latest = releases[0];
  const active = users.filter((u) => u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 7 * 86400_000).length;

  return (
    <AppShell title="Nexa Video">
      <div className="space-y-4 max-w-5xl">
        {requests.length > 0 && (
          <section className="nv-glass rounded-nv-xl border border-nv-warning/30 p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-nv-text-primary flex items-center gap-2">
              <Clock size={17} className="text-nv-warning" /> Access requests <span className="text-nv-warning">({requests.length})</span>
            </h2>
            <p className="text-[12px] text-nv-text-muted mt-0.5">
              They already chose a username and password — approving switches the account on right away (they get an email if they left one).
            </p>
            <div className="mt-2 divide-y divide-white/5">
              {requests.map((q) => (
                <div key={q.id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-nv-text-primary font-medium">
                      {q.name} <span className="text-[12.5px] text-nv-text-muted">· {q.contact} · username <span className="font-mono">{q.username}</span></span>
                    </div>
                    {q.note && <div className="text-[12.5px] text-nv-text-secondary mt-0.5">“{q.note}”</div>}
                    <div className="text-[11.5px] text-nv-text-muted mt-0.5">asked {ago(q.created_at)}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button className="nv-btn-primary px-3 py-1.5 text-[12.5px] flex items-center gap-1.5 disabled:opacity-40" disabled={busy !== ""}
                      onClick={async () => { const d = await act("ok" + q.id, { action: "approve_request", id: q.id, plan: "trial", days: trialDays }); if (d) setMsg(""); }}>
                      <Clock size={13} /> Start {trialDays}-day trial
                    </button>
                    <button className={BTN} disabled={busy !== ""} onClick={() => act("okf" + q.id, { action: "approve_request", id: q.id, plan: "full" })}>
                      <BadgeCheck size={13} /> Approve permanent
                    </button>
                    <button className={BTN} disabled={busy !== ""} onClick={() => act("no" + q.id, { action: "dismiss_request", id: q.id })}>
                      <Trash2 size={13} /> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="nv-glass rounded-nv-xl border border-nv-teal/10 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-nv-text-primary flex items-center gap-2">
                <Film size={17} className="text-nv-teal" /> Nexa Video users
              </h2>
              <p className="text-[12px] text-nv-text-muted mt-0.5">
                Private app for invited friends. Download page:{" "}
                <a href="/nexavideo" target="_blank" className="font-mono text-nv-text-secondary hover:text-nv-teal">nexavisiongroup.com/nexavideo</a>
                {" "}· {users.length} accounts, {active} used the app this week.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Who is it for?"
                className="w-52 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-[13px] text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
              <label className="flex items-center gap-2 text-[13px] text-nv-text-secondary select-none cursor-pointer">
                <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} className="accent-[#00E5CC] w-4 h-4" />
                Free trial
              </label>
              {isTrial && (
                <span className="flex items-center gap-1.5 text-[13px] text-nv-text-secondary">
                  <input type="number" min={1} max={365} value={trialDays} onChange={(e) => setTrialDays(e.target.value)}
                    className="w-16 px-2 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-[13px] text-nv-text-primary focus:outline-none focus:border-nv-teal/50" />
                  days
                </span>
              )}
              <button disabled={busy !== ""}
                onClick={async () => {
                  const d = await act("invite", { action: "invite", label, trial_days: isTrial ? trialDays : null });
                  if (d) { setLabel(""); await showLink(d, isTrial ? `${trialDays}-day free-trial invite (link valid 7 days, one use; the trial starts when they sign up)` : "Permanent invite link (7 days, one use)"); }
                }}
                className="nv-btn-primary px-4 py-2 text-[13px] flex items-center gap-2 disabled:opacity-40">
                {busy === "invite" ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />} {isTrial ? "New trial invite" : "New invite link"}
              </button>
              <button onClick={load} className={BTN} title="Refresh"><RefreshCw size={13} className="text-nv-teal" /></button>
            </div>
          </div>

          {msg && <div className="text-[12.5px] text-nv-error bg-nv-error/10 border border-nv-error/20 rounded-nv-md px-3 py-2">{msg}</div>}
          {lastLink && (
            <div className="rounded-nv-md border border-nv-teal/30 bg-nv-teal/5 px-3 py-2.5 space-y-1.5">
              <div className="text-[12px] text-nv-text-muted">{lastLink.note} {lastLink.copied ? "— copied to clipboard" : ""}</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate text-[13px] text-nv-teal font-mono">{lastLink.link}</code>
                <button className={BTN} onClick={async () => setLastLink({ ...lastLink, copied: await copyText(lastLink.link) })}>
                  {lastLink.copied ? <Check size={13} /> : <Copy size={13} />} Copy
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-nv-text-muted text-[13px]"><Loader2 size={15} className="animate-spin" /> Loading…</div>
          ) : users.length === 0 ? (
            <div className="text-[13px] text-nv-text-muted">No accounts yet — make an invite link and send it to someone.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((u) => (
                <div key={u.id} className={cn("py-3 flex flex-wrap items-center gap-3", !u.enabled && "opacity-50")}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-nv-text-primary font-medium">
                      {u.username || <span className="text-nv-text-muted italic">not signed up yet</span>}
                      {u.label && <span className="ml-2 text-[12.5px] text-nv-text-muted">· {u.label}</span>}
                      {!u.enabled && <span className="ml-2 text-[11px] text-nv-error">OFF</span>}
                      {u.plan === "trial" ? (
                        <span className={cn("ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                          u.trial_expired ? "bg-nv-error/15 text-nv-error" : "bg-nv-warning/15 text-nv-warning")}>
                          <Clock size={11} />
                          {u.trial_expired ? "Trial ended" : u.trial_ends_at ? `Trial · ${u.trial_days_left} day${u.trial_days_left === 1 ? "" : "s"} left` : `${u.trial_days}-day trial (starts at sign-up)`}
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-nv-teal/10 px-2 py-0.5 text-[11px] text-nv-teal"><BadgeCheck size={11} /> Permanent</span>
                      )}
                      {u.locked && <span className="ml-2 text-[11px] text-nv-warning">locked (too many tries)</span>}
                    </div>
                    <div className="text-[12px] text-nv-text-muted mt-0.5">
                      {u.signed_up
                        ? <>App seen {ago(u.last_seen_at)}{u.app_version ? ` · v${u.app_version}` : ""}{u.device ? ` · ${u.device}` : ""} · {u.downloads} download{u.downloads === 1 ? "" : "s"}</>
                        : u.pending_link ? <>Invite waiting · expires {new Date(u.link_expires!).toLocaleDateString()}</> : <>Invite expired — make a new link</>}
                      {u.pending_link === "reset" && <> · password-reset link waiting</>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button className={BTN} disabled={busy !== ""}
                      onClick={async () => { const d = await act("link" + u.id, { action: "new_link", id: u.id }); await showLink(d, u.signed_up ? `Password-reset link for ${u.username} (48 h)` : "New invite link (7 days)"); }}>
                      <KeyRound size={13} /> {u.signed_up ? "Reset password" : "New invite link"}
                    </button>
                    {u.locked && <button className={BTN} onClick={() => act("unlock" + u.id, { action: "unlock", id: u.id })}><Unlock size={13} /> Unlock</button>}
                    <button className={BTN} disabled={busy !== ""}
                      onClick={() => { const n = prompt(u.plan === "trial" ? "Add how many days?" : "Put on a trial of how many days (from now)?", "10"); if (n) act("days" + u.id, u.plan === "trial" ? { action: "add_days", id: u.id, days: n } : { action: "set_plan", id: u.id, plan: "trial", days: n }); }}>
                      <CalendarPlus size={13} /> {u.plan === "trial" ? (u.trial_expired ? "Reactivate" : "Add days") : "Make trial"}
                    </button>
                    {u.plan === "trial" && (
                      <button className={BTN} disabled={busy !== ""} onClick={() => act("perm" + u.id, { action: "set_plan", id: u.id, plan: "full" })}>
                        <BadgeCheck size={13} /> Make permanent
                      </button>
                    )}
                    <button className={BTN} disabled={busy !== ""} onClick={() => act("toggle" + u.id, { action: "toggle", id: u.id, enabled: !u.enabled })}>
                      <Power size={13} /> {u.enabled ? "Turn off" : "Turn on"}
                    </button>
                    <button className={BTN} disabled={busy !== ""}
                      onClick={() => { if (confirm(`Delete ${u.username || "this invite"}? Their app will be signed out.`)) act("del" + u.id, { action: "delete", id: u.id }); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="nv-glass rounded-nv-xl border border-nv-teal/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[15px] font-semibold text-nv-text-primary flex items-center gap-2"><Package size={17} className="text-nv-teal" /> Builds</h2>
            {downloads.paused && <span className="rounded-full bg-nv-warning/15 px-2 py-0.5 text-[11.5px] text-nv-warning">Downloads + updates PAUSED (still allowed: {downloads.allow.join(", ") || "nobody"})</span>}
            <button className={cn(BTN, "ml-auto")} disabled={busy !== ""}
              onClick={() => act("dl", { action: "set_downloads", paused: !downloads.paused })}>
              <Power size={13} /> {downloads.paused ? "Resume downloads" : "Pause downloads"}
            </button>
          </div>
          <p className="text-[12px] text-nv-text-muted mt-0.5">
            The newest build is what the download page and the in-app update hand out. Published from the rack with
            <span className="font-mono"> node scripts/nexavideo.mjs release …</span>
          </p>
          {releases.length === 0 ? (
            <div className="mt-3 text-[13px] text-nv-text-muted">No build published yet.</div>
          ) : (
            <div className="mt-3 divide-y divide-white/5">
              {releases.map((r) => (
                <div key={r.version_code} className="py-2.5 flex items-start gap-3">
                  <div className="text-[14px] text-nv-text-primary font-medium w-28">v{r.version_name}{r === latest && <span className="ml-1.5 text-[10.5px] text-nv-teal">LATEST</span>}</div>
                  <div className="flex-1 text-[12.5px] text-nv-text-muted whitespace-pre-line">{r.notes || "—"}</div>
                  <div className="text-[12px] text-nv-text-muted whitespace-nowrap">{r.size_bytes ? `${Math.round(r.size_bytes / 1048576)} MB · ` : ""}{ago(r.created_at)}</div>
                </div>
              ))}
            </div>
          )}
          <a href="/nexavideo" target="_blank" className={cn(BTN, "mt-3")}><ExternalLink size={13} /> Open the download page</a>
        </section>
      </div>
    </AppShell>
  );
}
