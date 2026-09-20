"use client";

import { useState } from "react";
import { Loader2, LogOut, RefreshCw, Smartphone, Maximize } from "lucide-react";

type Props = { user: { username: string; hasPhone: boolean } | null; phoneUrl: string | null };

const INPUT =
  "w-full px-3.5 py-3 bg-nv-void/60 border border-white/10 rounded-nv-md text-nv-text-primary " +
  "placeholder:text-nv-text-muted text-base focus:outline-none focus:border-nv-teal/50";

export default function VmClient({ user, phoneUrl }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [frameKey, setFrameKey] = useState(0);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/vm/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (r.ok) { window.location.reload(); return; }
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
            Signed in as <span className="text-nv-text-primary font-medium">{user.username}</span>
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

  // ---------- signed out ----------
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-display-sm nv-gradient-text-teal">Cloud Phone</h1>
          <p className="text-nv-text-muted text-sm mt-1 font-mono tracking-wider uppercase">Sign in to your phone</p>
        </div>
        <div className="nv-glass rounded-nv-xl p-6">
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Username</label>
              <input className={INPUT} value={username} onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none" autoCorrect="off" autoComplete="username" required />
            </div>
            <div>
              <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Password</label>
              <input className={INPUT} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" required />
            </div>
            {error && (
              <div className="text-nv-error text-sm bg-nv-error/10 border border-nv-error/20 rounded-nv-md px-3 py-2">{error}</div>
            )}
            <button type="submit" disabled={busy}
              className="w-full nv-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {busy ? <Loader2 size={18} className="animate-spin" /> : "Sign in"}
            </button>
          </form>
        </div>
        <p className="text-center text-nv-text-muted text-xs mt-4">
          No account? Ask your administrator for a sign-up link.
        </p>
      </div>
    </div>
  );
}
