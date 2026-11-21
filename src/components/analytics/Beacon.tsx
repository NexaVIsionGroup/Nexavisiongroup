"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_KEY = "nv_session_id";

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "nosession";
  }
}

export default function Beacon({ site }: { site: "nexavisiongroup" | "nexaphone" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const body = JSON.stringify({
        site,
        path: pathname,
        referrer: document.referrer || null,
        utm_source: searchParams.get("utm_source"),
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
        session_id: sessionId(),
      });
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    } catch {
      /* never let tracking break the page */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, pathname, searchParams]);

  return null;
}
