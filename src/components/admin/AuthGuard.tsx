"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Renders from the session saved on the device right away (getSession = local, no network) so admin pages open
// instantly; the server check (getUser) runs once per app session in the background and bounces to login if the
// session is no longer valid. Data stays protected by the /api/admin middleware either way.
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
        const { data: { user: real } } = await supabase.auth.getUser();
        if (!alive) return;
        if (!real) { router.replace("/admin/login"); return; }
        verified = true;
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { verified = false; router.replace("/admin/login"); }
      else setUser(session.user);
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
