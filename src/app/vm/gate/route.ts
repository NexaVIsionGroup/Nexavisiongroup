import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { VM_PHONES, VM_COOKIE, userFromCookie, mintGateToken } from "@/lib/vm";

// Token minter for the nexa-gate Worker on vmN.nexavisiongroup.com. Allowed callers:
//   (a) the VM user that phone is assigned to, or
//   (b) a logged-in Nexa admin (troubleshooting any phone).
// The token names the phone; the Worker refuses it on any other hostname, and it is signed
// with VM_GATE_SECRET (never GATE_SECRET) so it cannot open term. or phone.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const home = new URL("/vm", req.url);
  let dest: URL;
  try {
    dest = new URL(req.nextUrl.searchParams.get("next") || "");
  } catch {
    return NextResponse.redirect(home);
  }
  const phone = Object.keys(VM_PHONES).find((p) => VM_PHONES[p].host === dest.hostname);
  if (!phone || dest.protocol !== "https:") return NextResponse.redirect(home);
  if (!process.env.VM_GATE_SECRET) {
    return NextResponse.json({ error: "vm gate not configured" }, { status: 500 });
  }

  const jar = await cookies();
  let allowed = false;
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  if (u && u.phone_id === phone) allowed = true;
  if (!allowed) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => jar.getAll(), setAll: () => {} } },
    );
    const { data } = await supabase.auth.getUser();
    if (data.user) allowed = true;
  }
  if (!allowed) return NextResponse.redirect(home);

  dest.searchParams.set("vmtoken", mintGateToken(phone));
  return NextResponse.redirect(dest.toString());
}
