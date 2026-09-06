import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  DOCS_BUCKET,
  SANDBOX_CSP,
  docCookieName,
  hashIp,
  isExpired,
  prepareHtml,
  verifyDocAccess,
} from "@/lib/documents";

export const dynamic = "force-dynamic";

// Streams the document HTML for a public share link. This is also a valid
// top-level URL (used by the "open full / print" action), which is safe
// because the CSP `sandbox` header gives the document an opaque origin.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createAdminClient();

  const { data: doc } = await supabase
    .from("shared_documents")
    .select("id, storage_path, status, expires_at, password_hash")
    .eq("slug", params.slug)
    .single();

  if (!doc) return new NextResponse("Not found", { status: 404 });
  if (doc.status !== "active") return new NextResponse("This link has been turned off", { status: 403 });
  if (isExpired(doc.expires_at)) return new NextResponse("This link has expired", { status: 410 });

  if (doc.password_hash) {
    const cookie = req.cookies.get(docCookieName(doc.id))?.value;
    if (!verifyDocAccess(doc.id, cookie)) {
      return NextResponse.redirect(new URL(`/d/${params.slug}`, req.url));
    }
  }

  const { data: blob, error } = await supabase.storage.from(DOCS_BUCKET).download(doc.storage_path);
  if (error || !blob) return new NextResponse("Document unavailable", { status: 500 });

  const html = prepareHtml(await blob.text());

  // Record the view (best-effort — never block the document on analytics).
  try {
    await supabase.rpc("increment_document_view", { doc_id: doc.id });
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    await supabase.from("shared_document_views").insert({
      document_id: doc.id,
      ip_hash: ip ? hashIp(ip) : null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) || null,
      referrer: req.headers.get("referer")?.slice(0, 300) || null,
    });
  } catch {}

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": SANDBOX_CSP,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
