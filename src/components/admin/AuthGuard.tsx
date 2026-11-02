"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Renders from the session saved on the device right away (getSession = local, no network) so admin pages open
// instantly; the server check (getUser) runs once per app session in the background and bounces to login ONLY
// when Supabase says the session is invalid. A failed/offline check keeps the saved session (the data APIs are
// protected server-side either way), so a bad connection never throws the owner out to the login screen.
let verified = false;                       // per app session — page changes don't re-check over the network

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!alive) return;
      if (!session?.user) { router.replace("/admin/login"); return; }
      setUser(session.user);
      setLoading(false);
      if (!verified) {
        try {
          const { data: { user: real }, error } = await supabase.auth.getUser();
          if (!alive) return;
          if (real) { verified = true; return; }
          // no user: only a definite auth answer (401/403) means "logged out"; network trouble keeps the session
          const status = (error as { status?: number } | null)?.status;
          const definite = status === 401 || status === 403;
          if (definite) router.replace("/admin/login");
        } catch { /* offline — keep the saved session */ }
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { verified = false; router.replace("/admin/login"); }
      else if (session?.user) setUser(session.user);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [router, supabase.auth]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-nv-abyss flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-nv-teal/30 border-t-nv-teal rounded-full animate-spin" />
          <p className="text-nv-text-secondary text-sm font-mono tracking-wider uppercase">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
