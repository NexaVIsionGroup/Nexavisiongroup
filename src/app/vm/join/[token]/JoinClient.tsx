"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const INPUT =
  "w-full px-3.5 py-3 bg-nv-void/60 border border-white/10 rounded-nv-md text-nv-text-primary " +
  "placeholder:text-nv-text-muted text-base focus:outline-none focus:border-nv-teal/50";

// Opened from a one-time link. invite -> create username + password (twice). reset -> new password (twice).
export default function JoinClient({ token }: { token: string }) {
  const [kind, setKind] = useState<"invite" | "reset" | null>(null);
  const [fixedUser, setFixedUser] = useState("");
  const [dead, setDead] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/vm/signup?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.ok) { setDead(d.error || "This link is invalid or has expired."); return; }
        setKind(d.kind);
        setFixedUser(d.username || "");
      })
      .catch(() => setDead("Could not reach the server. Try again."));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("The two passwords do not match."); return; }
    setBusy(true);
    const r = await fetch("/api/vm/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, username, password, confirm }),
    });
    if (r.ok) { window.location.href = "/vm"; return; }
    const d = await r.json().catch(() => ({}));
    setError(d.error || "Could not save. Try again.");
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-display-sm nv-gradient-text-teal">Cloud Phone</h1>
          <p className="text-nv-text-muted text-sm mt-1 font-mono tracking-wider uppercase">
            {kind === "reset" ? "Choose a new password" : "Create your login"}
          </p>
        </div>
        <div className="nv-glass rounded-nv-xl p-6">
          {dead ? (
            <p className="text-nv-error text-sm text-center">{dead}</p>
          ) : !kind ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-nv-teal" /></div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Username</label>
                {kind === "invite" ? (
                  <input className={INPUT} value={username} onChange={(e) => setUsername(e.target.value)}
                    autoCapitalize="none" autoCorrect="off" autoComplete="username" placeholder="pick a username" required />
                ) : (
                  <input className={INPUT + " opacity-60"} value={fixedUser} readOnly />
                )}
              </div>
              <div>
                <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Password</label>
                <input className={INPUT} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password" placeholder="at least 8 characters" minLength={8} required />
              </div>
              <div>
                <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Password again</label>
                <input className={INPUT} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password" minLength={8} required />
              </div>
              {error && (
                <div className="text-nv-error text-sm bg-nv-error/10 border border-nv-error/20 rounded-nv-md px-3 py-2">{error}</div>
              )}
              <button type="submit" disabled={busy}
                className="w-full nv-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {busy ? <Loader2 size={18} className="animate-spin" /> : kind === "reset" ? "Save password" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
