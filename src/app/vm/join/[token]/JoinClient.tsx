"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import CloudShell, { CLOUD_INPUT, CLOUD_LABEL } from "../../CloudShell";

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
  const [unlocking, setUnlocking] = useState(false);

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
    if (r.ok) { setUnlocking(true); setTimeout(() => { window.location.href = "/vm"; }, 520); return; }
    const d = await r.json().catch(() => ({}));
    setError(d.error || "Could not save. Try again.");
    setBusy(false);
  }

  const subtitle = dead ? "This link can't be used." : kind === "reset"
    ? "Choose a new password for your phone."
    : "A new phone is waiting. Create your login to claim it.";

  return (
    <CloudShell subtitle={subtitle} unlocking={unlocking}>
      {dead ? (
        <div className="nc-error" role="alert">{dead}</div>
      ) : !kind ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-white/70" /></div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className={CLOUD_LABEL} htmlFor="nc-user">Username</label>
            {kind === "invite" ? (
              <input id="nc-user" className={CLOUD_INPUT} value={username} onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username"
                placeholder="Pick a username" required />
            ) : (
              <input id="nc-user" className={CLOUD_INPUT + " opacity-60"} value={fixedUser} readOnly />
            )}
          </div>
          <div>
            <label className={CLOUD_LABEL} htmlFor="nc-pass">Password</label>
            <input id="nc-pass" className={CLOUD_INPUT} type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
              placeholder="At least 8 characters" minLength={8} required />
          </div>
          <div>
            <label className={CLOUD_LABEL} htmlFor="nc-pass2">Password again</label>
            <input id="nc-pass2" className={CLOUD_INPUT} type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} required />
          </div>
          {error && <div className="nc-error" role="alert">{error}</div>}
          <button type="submit" disabled={busy} className="nc-btn">
            {busy ? <Loader2 size={18} className="animate-spin" /> : kind === "reset" ? "Save password" : "Create my login"}
          </button>
        </form>
      )}
    </CloudShell>
  );
}
