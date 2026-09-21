"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Link2, Copy, Check, Loader2, Power, Trash2, KeyRound, ExternalLink, RotateCcw,
  UserPlus, RefreshCw, Shuffle, Pencil, Unlock, AlertTriangle, Clock, CalendarPlus, BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Nexa Cloud users. "New sign-up link" reserves a free slot, builds a factory-fresh phone in
// it, boots it, and copies a one-time link. The person opens it, picks a username + password,
// and from then on signs in at nexavisiongroup.com/vm — the account decides which phone opens.

type VmUser = {
  id: string; label: string; username: string | null; phone_id: string | null; enabled: boolean;
  signed_up: boolean; pending_link: "invite" | "reset" | null; link_expires: string | null;
  locked: boolean; created_at: string; last_login_at: string | null;
  plan: "full" | "trial"; trial_days: number | null; trial_ends_at: string | null;
  trial_expired: boolean; trial_days_left: number | null;
};
type VmPhone = {
  id: string; label: string; url: string; assigned: boolean;
  state: { power?: boolean; running?: boolean; booted?: boolean } | null;
};

const BTN =
  "inline-flex items-center gap-1.5 rounded-nv-md px-2.5 py-1.5 text-[12.5px] nv-glass border border-nv-teal/15 " +
  "text-nv-text-secondary hover:border-nv-teal/40 hover:text-nv-text-primary transition-all disabled:opacity-40";

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
function ago(s: string | null) {
  if (!s) return "never";
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export default function VmUsersPanel() {
  const [users, setUsers] = useState<VmUser[]>([]);
  const [phones, setPhones] = useState<VmPhone[]>([]);
  const [backendOk, setBackendOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [label, setLabel] = useState("");
  const [isTrial, setIsTrial] = useState(false);
  const [trialDays, setTrialDays] = useState("3");
  const [lastLink, setLastLink] = useState<{ link: string; note: string; copied: boolean } | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/vm", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setUsers(d.users || []); setPhones(d.phones || []); setBackendOk(d.backend_ok !== false); }
    else setMsg(d.error || "Could not load cloud phone users.");
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(key: string, body: Record<string, unknown>) {
    setBusy(key);
    setMsg("");
    const r = await fetch("/api/admin/vm", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
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

  const free = phones.filter((p) => !p.assigned).length;
  const phoneOf = (id: string | null) => phones.find((p) => p.id === id);

  return (
    <section className="nv-glass rounded-nv-xl border border-nv-teal/10 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-nv-text-primary flex items-center gap-2">
            <UserPlus size={17} className="text-nv-teal" /> Nexa Cloud users
          </h2>
          <p className="text-[12px] text-nv-text-muted mt-0.5">
            People sign in at <span className="font-mono text-nv-text-secondary">nexavisiongroup.com/vm</span>. {free} of {phones.length || 3} phone slots free.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Who is it for? (optional)"
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
          <button disabled={busy !== "" || free === 0}
            onClick={async () => { const d = await act("invite", { action: "invite", label, trial_days: isTrial ? trialDays : null }); if (d) { setLabel(""); await showLink(d, isTrial ? `New phone is being built and started. ${trialDays}-day free-trial link` : "New phone is being built and started. Sign-up link"); } }}
            className="nv-btn-primary px-4 py-2 text-[13px] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {busy === "invite" ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
            {busy === "invite" ? "Building phone…" : isTrial ? "New free-trial link" : "New sign-up link"}
          </button>
          <button onClick={load} className={BTN} title="Refresh"><RefreshCw size={13} className="text-nv-teal" /></button>
        </div>
      </div>

      {!backendOk && (
        <div className="flex items-center gap-2 text-[12.5px] text-nv-warning bg-nv-warning/10 border border-nv-warning/20 rounded-nv-md px-3 py-2">
          <AlertTriangle size={14} /> The rack backend did not answer, so phone power states are unknown right now.
        </div>
      )}
      {msg && <div className="text-[12.5px] text-nv-error bg-nv-error/10 border border-nv-error/20 rounded-nv-md px-3 py-2">{msg}</div>}
      {lastLink && (
        <div className="rounded-nv-md border border-nv-teal/30 bg-nv-teal/5 px-3 py-2.5 space-y-1.5">
          <div className="text-[12.5px] text-nv-text-secondary">
            {lastLink.note} {lastLink.copied ? "copied to your clipboard." : "is ready. Copy it below."} It works once.
          </div>
          <div className="flex items-center gap-2">
            <input readOnly value={lastLink.link} onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 px-2.5 py-1.5 bg-nv-void/60 border border-white/10 rounded-nv-md text-[12px] font-mono text-nv-text-primary" />
            <button className={BTN} onClick={async () => setLastLink({ ...lastLink, copied: await copyText(lastLink.link) })}>
              {lastLink.copied ? <Check size={13} className="text-nv-success" /> : <Copy size={13} />} Copy
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-nv-text-muted text-sm"><Loader2 size={16} className="animate-spin text-nv-teal" /> Loading…</div>
      ) : users.length === 0 ? (
        <p className="text-[13px] text-nv-text-muted">No users yet. Create a sign-up link and send it to someone.</p>
      ) : (
        <div className="space-y-2.5">
          {users.map((u) => {
            const p = phoneOf(u.phone_id);
            const st = p?.state;
            const phoneState = !p ? "no phone" : !st ? "unknown" : st.booted ? "running" : st.running ? "starting" : st.power ? "starting" : "off";
            const freeTargets = phones.filter((x) => !x.assigned);
            return (
              <div key={u.id} className={cn("rounded-nv-lg border p-3 space-y-2.5", u.enabled ? "border-white/10 bg-nv-void/30" : "border-nv-error/20 bg-nv-error/5")}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[14px] font-semibold text-nv-text-primary">
                    {u.username || <span className="text-nv-warning font-normal">waiting for sign-up</span>}
                  </span>
                  {u.label && <span className="text-[12.5px] text-nv-text-secondary">({u.label})</span>}
                  <span className="text-[11.5px] px-2 py-0.5 rounded-full border border-nv-teal/25 text-nv-teal">{p?.label || "unassigned"}</span>
                  <span className={cn("text-[11.5px] px-2 py-0.5 rounded-full border",
                    phoneState === "running" ? "border-nv-success/30 text-nv-success" :
                    phoneState === "off" ? "border-white/15 text-nv-text-muted" : "border-nv-warning/30 text-nv-warning")}>
                    phone {phoneState}
                  </span>
                  {u.plan === "trial" && (
                    <span className={cn("inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-full border",
                      u.trial_expired ? "border-nv-error/40 text-nv-error" : "border-nv-warning/40 text-nv-warning")}>
                      <Clock size={11} />
                      {u.trial_expired ? "trial ended" : u.trial_ends_at ? `trial: ${u.trial_days_left} ${u.trial_days_left === 1 ? "day" : "days"} left` : `${u.trial_days}-day trial, starts at sign-up`}
                    </span>
                  )}
                  {!u.enabled && <span className="text-[11.5px] px-2 py-0.5 rounded-full border border-nv-error/30 text-nv-error">turned off</span>}
                  {u.locked && <span className="text-[11.5px] px-2 py-0.5 rounded-full border border-nv-error/30 text-nv-error">locked out</span>}
                  {u.pending_link && <span className="text-[11.5px] text-nv-text-muted">{u.pending_link} link active</span>}
                  <span className="ml-auto text-[11.5px] text-nv-text-muted">last sign-in {ago(u.last_login_at)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p && (
                    <a className={BTN} href={p.url} target="_blank" rel="noopener noreferrer" title="Open this phone as admin">
                      <ExternalLink size={13} className="text-nv-teal" /> Open phone
                    </a>
                  )}
                  <button className={BTN} disabled={busy !== ""}
                    onClick={async () => showLink(await act(`link-${u.id}`, { action: u.signed_up ? "reset_link" : "new_link", id: u.id }), u.signed_up ? "Password-reset link" : "New sign-up link")}>
                    {busy === `link-${u.id}` ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                    {u.signed_up ? "Password reset link" : "New sign-up link"}
                  </button>
                  <button className={BTN} disabled={busy !== ""} title={u.plan === "trial" ? "Add time to this trial (reactivates it if it ended)" : "Put this user on a timed trial"}
                    onClick={() => { const v = window.prompt(u.plan === "trial" ? (u.trial_expired ? "Reactivate for how many days?" : "Add how many days?") : "Put on a trial of how many days (from now)?", "3"); if (v === null) return; act(`days-${u.id}`, u.plan === "trial" ? { action: "add_days", id: u.id, days: v } : { action: "set_plan", id: u.id, plan: "trial", days: v }); }}>
                    {busy === `days-${u.id}` ? <Loader2 size={13} className="animate-spin" /> : <CalendarPlus size={13} className="text-nv-warning" />}
                    {u.plan === "trial" ? (u.trial_expired ? "Reactivate" : "Add days") : "Set trial"}
                  </button>
                  {u.plan === "trial" && (
                    <button className={BTN} disabled={busy !== ""} title="No expiry. This is what a paid invoice will do automatically later."
                      onClick={() => act(`full-${u.id}`, { action: "set_plan", id: u.id, plan: "full" })}>
                      {busy === `full-${u.id}` ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} className="text-nv-success" />} Make full access
                    </button>
                  )}
                  <button className={BTN} disabled={busy !== ""} onClick={() => act(`tog-${u.id}`, { action: "toggle", id: u.id, enabled: !u.enabled })}>
                    {busy === `tog-${u.id}` ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} className={u.enabled ? "text-nv-success" : "text-nv-error"} />}
                    {u.enabled ? "Turn off" : "Turn on"}
                  </button>
                  {u.locked && (
                    <button className={BTN} disabled={busy !== ""} onClick={() => act(`unl-${u.id}`, { action: "unlock", id: u.id })}>
                      <Unlock size={13} /> Unlock
                    </button>
                  )}
                  <button className={BTN} disabled={busy !== ""}
                    onClick={() => { const v = window.prompt("Note for this user (who is it for?)", u.label); if (v !== null) act(`lab-${u.id}`, { action: "label", id: u.id, label: v }); }}>
                    <Pencil size={13} /> Note
                  </button>
                  {(freeTargets.length > 0 || u.phone_id) && (
                    <select disabled={busy !== ""} value="" title="Reassign"
                      onChange={(e) => { const v = e.target.value; if (!v) return; if (window.confirm(v === "none" ? "Unassign this user from their phone? The phone keeps its data." : `Move this user to ${v}? Their current phone keeps its data but they will no longer see it.`)) act(`re-${u.id}`, { action: "reassign", id: u.id, phone_id: v === "none" ? "" : v }); }}
                      className={cn(BTN, "bg-transparent pr-6")}>
                      <option value="">Reassign…</option>
                      {freeTargets.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                      {u.phone_id && <option value="none">Unassign</option>}
                    </select>
                  )}
                  {p && (
                    <>
                      <button className={BTN} disabled={busy !== ""} onClick={() => act(`pw-${u.id}`, { action: "power", phone: p.id, on: phoneState === "off" })}>
                        {busy === `pw-${u.id}` ? <Loader2 size={13} className="animate-spin" /> : <Shuffle size={13} />}
                        {phoneState === "off" ? "Start phone" : "Stop phone"}
                      </button>
                      <button className={cn(BTN, "hover:border-nv-error/50")} disabled={busy !== ""}
                        onClick={() => { if (window.confirm(`Factory reset ${p.label}? Everything signed in on that phone is erased. The user account stays.`)) act(`wipe-${u.id}`, { action: "wipe", phone: p.id }); }}>
                        {busy === `wipe-${u.id}` ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} className="text-nv-warning" />} Factory reset
                      </button>
                    </>
                  )}
                  <button className={cn(BTN, "hover:border-nv-error/50 ml-auto")} disabled={busy !== ""}
                    onClick={() => { if (window.confirm(`Delete ${u.username || "this pending user"}? Their phone is erased and the slot becomes free.`)) act(`del-${u.id}`, { action: "delete", id: u.id }); }}>
                    {busy === `del-${u.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} className="text-nv-error" />} Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
