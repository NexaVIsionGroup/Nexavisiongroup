import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

// nexaphone.com serves the Nexa Pro store (the `(nexaphone)` route group) with
// clean URLs: `/` → `/nexaphone`, `/phones/x` → `/nexaphone/phones/x`. Prefixed
// page URLs on that host are redirected to the clean form. Assets and APIs pass
// through untouched. nexavisiongroup.com/nexaphone keeps working as before.
// Temporary until the store gets its own project; then this block goes away.
const STORE_HOSTS = new Set(["nexaphone.com", "www.nexaphone.com"]);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];

  if (STORE_HOSTS.has(host)) {
    const path = url.pathname;
    if (host.startsWith("www.")) {
      return NextResponse.redirect(`https://nexaphone.com${path}${url.search}`, 308);
    }
    const isAsset = path.startsWith("/_next") || path.startsWith("/api/") || /\.[a-z0-9]{2,5}$/i.test(path);
    if (isAsset) return NextResponse.next();
    if (path === "/nexaphone" || path.startsWith("/nexaphone/")) {
      const clean = path.replace(/^\/nexaphone/, "") || "/";
      return NextResponse.redirect(`https://nexaphone.com${clean}${url.search}`, 308);
    }
    const target = url.clone();
    target.pathname = path === "/" ? "/nexaphone" : `/nexaphone${path}`;
    return NextResponse.rewrite(target);
  }

  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) {
    return await updateSession(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
