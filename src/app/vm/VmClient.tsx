"use client";

import { useState } from "react";
import { Loader2, LogOut, RefreshCw, Smartphone, Maximize } from "lucide-react";
import CloudShell, { CLOUD_INPUT, CLOUD_LABEL } from "./CloudShell";

type Props = { user: { username: string; hasPhone: boolean } | null; phoneUrl: string | null };

export default function VmClient({ user, phoneUrl }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [frameKey, setFrameKey] = useState(0);
  const [unlocking, setUnlocking] = useState(false);

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
    setError(d.error || "Sign-in failed.");
    setBusy(false);
  }
  async function logout() {
    await fetch("/api/vm/logout", { method: "POST" });
    window.location.reload();
  }

  // ---------- signed in: the phone fills the screen ----------
  if (user) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-nv-void" style={{ height: "100dvh" }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-nv-deep/80">
          <Smartphone size={16} className="text-nv-teal shrink-0" />
          <span className="text-sm text-nv-text-secondary truncate">
            <span className="text-nv-text-primary font-semibold">Nexa Cloud</span> <span className="opacity-50 mx-1">/</span> <span className="text-nv-text-primary font-medium">{user.username}</span>
          </span>
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
      <p className="nc-foot">No account yet? Ask your administrator for a sign-up link.</p>
    </CloudShell>
  );
}
