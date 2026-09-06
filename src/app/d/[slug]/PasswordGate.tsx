"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function PasswordGate({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch(`/api/d/${slug}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (r.ok) {
      router.refresh();
      return;
    }
    const j = await r.json().catch(() => ({}));
    setError(j.error || "Incorrect password");
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-nv-void flex items-center justify-center p-6">
      <div className="w-full max-w-sm nv-glass-elevated rounded-nv-xl p-7 text-center">
        <div className="w-12 h-12 rounded-full bg-nv-teal/10 border border-nv-teal/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-nv-teal" />
        </div>
        <h1 className="font-display font-semibold text-lg text-nv-text-primary mb-1">{title}</h1>
        <p className="text-sm text-nv-text-muted mb-5">
          This document is protected. Enter the password you were given.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2.5 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all text-center"
          />
          {error && <p className="text-xs text-nv-error">{error}</p>}
          <button
            type="submit"
            disabled={busy || !password}
            className="w-full nv-btn-primary py-2.5 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : "View document"}
          </button>
        </form>

        <p className="text-[11px] text-nv-text-muted mt-6">
          Shared by <span className="nv-gradient-text-teal font-medium">NexaVision Group</span>
        </p>
      </div>
    </div>
  );
}
