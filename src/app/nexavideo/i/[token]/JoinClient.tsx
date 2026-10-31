"use client";

import { useEffect, useState } from "react";

// Invite / password-reset link for Nexa Video: pick a username + password (invite) or a new password (reset),
// then on to the download page, already signed in.
export default function JoinClient({ token }: { token: string }) {
  const [state, setState] = useState<{ kind: "invite" | "reset"; username: string | null } | null>(null);
  const [dead, setDead] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/nexavideo/signup?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => (j.ok ? setState({ kind: j.kind, username: j.username }) : setDead(j.error || "This link is not valid.")))
      .catch(() => setDead("Could not check this link. Try again."));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await fetch("/api/nexavideo/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, username, password, confirm }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { window.location.href = "/nexavideo"; return; }
    setError(j.error || "Could not save."); setBusy(false);
  }

  const input = "mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60";
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#07080b] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[1000px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
          style={{ background: "radial-gradient(closest-side, #2563eb 0%, #7c3aed 45%, transparent 75%)" }} />
      </div>
      <div className="relative mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-16">
        <div className="text-center">
          <span className="text-3xl font-black tracking-[0.2em] text-[#4FA3FF]">NEXA</span>
          <span className="ml-2 text-sm font-semibold tracking-[0.4em] text-white/50">VIDEO</span>
        </div>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl">
          {dead ? (
            <>
              <div className="text-xl font-bold">Link not valid</div>
              <div className="mt-2 text-white/60">{dead}</div>
              <a href="/nexavideo" className="mt-6 block text-center text-[#4FA3FF]">Already have an account? Sign in</a>
            </>
          ) : !state ? (
            <div className="text-white/60">Checking your link…</div>
          ) : (
            <form onSubmit={submit}>
              <div className="text-2xl font-black">{state.kind === "invite" ? "You're invited 🎬" : "Set a new password"}</div>
              <div className="mt-2 text-white/60">
                {state.kind === "invite"
                  ? "Pick a username and password. You'll use them on the download page and inside the app."
                  : `New password for ${state.username}.`}
              </div>
              {state.kind === "invite" && (
                <input className={input} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"
                  autoCapitalize="none" autoComplete="username" />
              )}
              <input className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)"
                type="password" autoComplete="new-password" />
              <input className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Password again"
                type="password" autoComplete="new-password" />
              {error && <div className="mt-3 text-sm text-rose-400">{error}</div>}
              <button disabled={busy}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-6 py-4 text-lg font-bold transition hover:brightness-110 disabled:opacity-50">
                {busy ? "Saving…" : state.kind === "invite" ? "Create my account" : "Save password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
