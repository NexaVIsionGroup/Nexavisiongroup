"use client";

import { useEffect, useState } from "react";
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
  // A phone that nobody is using sleeps (it costs the rack ~5 GB of memory while it runs). Signing in
  // wakes it: ask the backend to start it, then wait until it has booted before loading the stream.
  const [phoneState, setPhoneState] = useState<"checking" | "starting" | "ready" | "full" | "error">("checking");
  const live = !!user && !!phoneUrl && !trial?.expired;

  useEffect(() => {
    if (!live) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (stop) return;
      try {
        const r = await fetch("/api/vm/phone", { cache: "no-store" });
        const d = await r.json().catch(() => ({}));
        if (d.state === "ready") { setPhoneState("ready"); return; }
        if (d.state === "off") { await start(); return; }
        setPhoneState("starting");
      } catch { /* keep trying */ }
      timer = setTimeout(poll, 4000);
    };
    const start = async () => {
      const r = await fetch("/api/vm/phone", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (d.state === "ready") { setPhoneState("ready"); return; }
      if (!r.ok) { setPhoneState(d.code === "rack_full" ? "full" : "error"); timer = setTimeout(poll, 20000); return; }
      setPhoneState("starting");
      timer = setTimeout(poll, 4000);
    };
    poll();
    return () => { stop = true; clearTimeout(timer); };
  }, [live]);

  // Usage heartbeat: once a minute, only while the phone is on screen and the tab is visible.
  useEffect(() => {
    if (!live || phoneState !== "ready") return;
    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/vm/ping", { method: "POST" }).catch(() => {});
      // came back after the phone went to sleep? reload -> the waking screen takes over
      try { const d = await (await fetch("/api/vm/phone", { cache: "no-store" })).json(); if (d.state === "off") window.location.reload(); } catch {}
    };
    document.addEventListener("visibilitychange", beat);
    beat();
    const id = setInterval(beat, 60000);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", beat); };
  }, [live, phoneState]);

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

  // ---------- signed in, phone asleep or waking ----------
  if (live && phoneState !== "ready") {
    const waiting = phoneState === "checking" || phoneState === "starting";
    return (
      <CloudShell subtitle={waiting ? "Waking your phone. This takes about half a minute." : `Hi ${user!.username}.`}>
        {waiting ? (
          <div className="flex flex-col items-center gap-3 py-6 text-white/70">
            <Loader2 size={30} className="animate-spin text-[#7CFFEA]" />
            <span className="text-[14px]">{phoneState === "checking" ? "Checking your phone" : "Starting up"}</span>
          </div>
        ) : (
          <div className="nc-note">
            {phoneState === "full"
              ? "Every phone slot on the server is busy right now. This page keeps trying and will open your phone as soon as there is room."
              : "Your phone did not start. This page keeps trying. If it stays like this, contact your administrator."}
          </div>
        )}
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
