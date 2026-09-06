import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { docCookieName, isExpired, signDocAccess, verifyPassword } from "@/lib/documents";

export const dynamic = "force-dynamic";

// Password gate for protected share links. Sets a signed, HttpOnly cookie
// valid for 12 hours so the client isn't re-prompted while reading.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createAdminClient();
  const { password } = await req.json().catch(() => ({ password: "" }));

  const { data: doc } = await supabase
    .from("shared_documents")
    .select("id, status, expires_at, password_hash")
    .eq("slug", params.slug)
    .single();

  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (doc.status !== "active") return NextResponse.json({ error: "disabled" }, { status: 403 });
  if (isExpired(doc.expires_at)) return NextResponse.json({ error: "expired" }, { status: 410 });

  if (!verifyPassword(String(password || ""), doc.password_hash)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(docCookieName(doc.id), signDocAccess(doc.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return res;
}
