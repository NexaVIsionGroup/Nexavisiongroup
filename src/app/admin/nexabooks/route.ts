import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notifyDb } from "@/lib/notify";
import { nexaBooksConfig, nexaBooksLaunchUrl } from "@/lib/nexabooks/token";

export const dynamic = "force-dynamic";

// GET /admin/nexabooks: opens NexaBooks (bookkeeping, books.nexavisiongroup.com) for the signed-in admin.
// Checks the Supabase login on the server (getUser, not the cookie alone), then only a full admin
// (admin_users.role = "admin") gets in, as NexaBooks "owner". Everyone else goes back to the dashboard.
// The one-time link is built here at click time and is valid for 60 seconds.
export async function GET(req: NextRequest) {
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), { headers: { "Cache-Control": "no-store" } });

  const jar = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return to("/admin/login");

  const { data: admin } = await notifyDb()
    .from("admin_users")
    .select("role, display_name")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  const config = nexaBooksConfig();
  if (!config || admin?.role !== "admin") return to("/admin");

  const launch = nexaBooksLaunchUrl(config, {
    id: user.id,
    email: user.email,
    name: admin.display_name || (user.user_metadata?.full_name as string | undefined) || null,
    role: "owner",
  });
  return NextResponse.redirect(launch, { headers: { "Cache-Control": "no-store" } });
}
