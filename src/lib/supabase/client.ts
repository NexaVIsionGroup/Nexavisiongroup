"use client";

import { createBrowserClient } from "@supabase/ssr";

// Scope the auth cookie to the whole domain in production so it is also sent to
// term./phone.nexavisiongroup.com, where the `nexa-gate` Cloudflare Worker uses it
// to put the rack terminal + OP3 live view behind this same login. Left unset on
// localhost / preview hosts (a mismatched Domain attribute would drop the cookie).
function cookieDomain() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return host.endsWith("nexavisiongroup.com") ? ".nexavisiongroup.com" : undefined;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { domain: cookieDomain() } }
  );
}
