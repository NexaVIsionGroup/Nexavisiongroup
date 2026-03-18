"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate invite token
      const res = await fetch("/api/admin/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid or expired invite link");
      }

      const invite = await res.json();

      // Create account
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: invite.role || "team_member",
            invited_by: invite.created_by,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Mark invite as used
      await fetch("/api/admin/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim() }),
      });

      setStep("success");
      setTimeout(() => router.replace("/admin"), 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-nv-void flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-nv-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-nv-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="font-display font-bold text-xl text-nv-text-primary">
            Account Created
          </h2>
          <p className="text-nv-text-secondary text-sm mt-2">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nv-void flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-nv-gradient-hero" />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-display-sm nv-gradient-text-teal">
            NexaVision
          </h1>
          <p className="text-nv-text-muted text-sm mt-1 font-mono tracking-wider uppercase">
            Join the Team
          </p>
        </div>

        <div className="nv-glass rounded-nv-xl p-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 bg-nv-void/60 border border-white/10 rounded-nv-md text-nv-text-primary placeholder:text-nv-text-muted text-sm focus:outline-none focus:border-nv-teal/50 focus:shadow-nv-glow-sm transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 pr-10 bg-nv-void/60 border border-white/10 rounded-nv-md text-nv-text-primary placeholder:text-nv-text-muted text-sm focus:outline-none focus:border-nv-teal/50 focus:shadow-nv-glow-sm transition-all"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nv-text-muted hover:text-nv-teal transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-nv-error text-sm bg-nv-error/10 border border-nv-error/20 rounded-nv-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full nv-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
