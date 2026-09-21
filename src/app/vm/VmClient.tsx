"use client";

import { useState } from "react";
import { Loader2, LogOut, RefreshCw, Smartphone, Maximize, CreditCard, ArrowLeft, Clock } from "lucide-react";
import CloudShell, { CLOUD_INPUT, CLOUD_LABEL } from "./CloudShell";

type Props = {
  user: { username: string; hasPhone: boolean } | null;
  phoneUrl: string | null;
  trial: { expired: boolean; daysLeft: number | null } | null;
  // Where "Pay" goes. Not wired yet: it will point at the Nexa invoice/payment flow (same style as
  // the JHPS admin invoices). Until NEXT_PUBLIC_VM_PAY_URL is set, the button shows a holding note.
  payUrl: string | null;
};

function PayPanel({ payUrl, onBack, note }: { payUrl: string | null; onBack?: () => void; note?: string }) {
  return (
    <div className="space-y-3.5">
      {note && <div className="nc-error" role="alert">{note}</div>}
      {payUrl ? (
        <a href={payUrl} className="nc-btn" style={{ textDecoration: "none" }}>
          <CreditCard size={18} /> Continue to payment
        </a>
      ) : (
        <div className="nc-note">
          Online payment is being set up. For now, ask your administrator for an invoice and your
          phone will be switched on as soon as it is paid.
        </div>
      )}
      {onBack && (
        <button type="button" onClick={onBack} className="nc-link">
          <ArrowLeft size={15} /> Back to sign in
        </button>
      )}
    </div>
  );
}

export default function VmClient({ user, phoneUrl, trial, payUrl }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [frameKey, setFrameKey] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [endedNote, setEndedNote] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/vm/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (r.ok) { setUnlocking(true); setTimeout(() => window.location.reload(), 520); return; }
    const d = await r.json().catch(() => ({}));
    if (d.code === "trial_expired") { setEndedNote(d.error); setPayOpen(true); }
    else setError(d.error || "Sign-in failed.");
    setBusy(false);
  }
  async function logout() {
    await fetch("/api/vm/logout", { method: "POST" });
    window.location.reload();
  }

  // ---------- signed in, but the free trial has run out ----------
  if (user && trial?.expired) {
    return (
      <CloudShell subtitle={`Hi ${user.username}. Your phone is saved and waiting.`}>
        <PayPanel payUrl={payUrl} note="Your free trial has ended. Pay to pick your phone back up. Everything on it is kept." />
        <button type="button" onClick={logout} className="nc-link" style={{ marginTop: 14 }}>
          <LogOut size={15} /> Sign out
        </button>
      </CloudShell>
    );
  }

  // ---------- signed in: the phone fills the screen ----------
  if (user) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-nv-void" style={{ height: "100dvh" }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-nv-deep/80">
          <Smartphone size={16} className="text-nv-teal shrink-0" />
          <span className="text-sm text-nv-text-secondary truncate">
            <span className="text-nv-text-primary font-semibold">Nexa Cloud</span>{" "}
            <span className="opacity-50 mx-1">/</span>{" "}
            <span className="text-nv-text-primary font-medium">{user.username}</span>
          </span>
          {trial && trial.daysLeft !== null && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full border border-nv-warning/40 text-nv-warning"
              title="Free trial">
              <Clock size={12} /> {trial.daysLeft} {trial.daysLeft === 1 ? "day" : "days"} left
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {phoneUrl && (
              <>
                <button onClick={() => setFrameKey((k) => k + 1)} title="Reconnect"
                  className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})} title="Fullscreen"
                  className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
                  <Maximize size={16} />
                </button>
              </>
            )}
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-nv-md text-sm text-nv-text-muted hover:text-nv-error hover:bg-white/5">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
        {phoneUrl ? (
          <iframe key={frameKey} src={phoneUrl} title="Cloud phone" className="flex-1 w-full border-0 bg-black"
            allow="autoplay; fullscreen; clipboard-read; clipboard-write; microphone; camera" />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-nv-text-secondary">
            No phone is assigned to this account yet. Contact your administrator.
          </div>
        )}
      </div>
    );
  }

  // ---------- signed out: payment panel ----------
  if (payOpen) {
    return (
      <CloudShell subtitle="Pay for your phone, or renew it.">
        <PayPanel payUrl={payUrl} note={endedNote || undefined}
          onBack={() => { setPayOpen(false); setEndedNote(""); }} />
      </CloudShell>
    );
  }

  // ---------- signed out: the phone's lock screen ----------
  return (
    <CloudShell subtitle="Your phone is on. Sign in to pick it up." unlocking={unlocking}>
      <form onSubmit={login} className="space-y-3.5">
        <div>
          <label className={CLOUD_LABEL} htmlFor="nc-user">Username</label>
          <input id="nc-user" className={CLOUD_INPUT} value={username} onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" required />
        </div>
        <div>
          <label className={CLOUD_LABEL} htmlFor="nc-pass">Password</label>
          <input id="nc-pass" className={CLOUD_INPUT} type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <div className="nc-error" role="alert">{error}</div>}
        <button type="submit" disabled={busy} className="nc-btn">
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Unlock my phone"}
        </button>
      </form>
      <div className="nc-row">
        <span className="nc-foot" style={{ margin: 0, textAlign: "left" }}>No account yet? Ask for a sign-up link.</span>
        <button type="button" onClick={() => setPayOpen(true)} className="nc-pay">
          <CreditCard size={14} /> Pay
        </button>
      </div>
    </CloudShell>
  );
}
