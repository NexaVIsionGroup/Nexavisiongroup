import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DOCS_BUCKET, SANDBOX_CSP, prepareHtml } from "@/lib/documents";

export const dynamic = "force-dynamic";

// Admin-only preview — serves the document regardless of status, password or
// expiry so it can be checked before (or after) it goes out to a client.
// Auth comes from the /api/admin/* middleware guard; the HTML itself is still
// CSP-sandboxed, so it cannot touch the admin session it is previewed from.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: doc } = await supabase
    .from("shared_documents")
    .select("id, storage_path")
    .eq("id", params.id)
    .single();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: blob, error } = await supabase.storage.from(DOCS_BUCKET).download(doc.storage_path);
  if (error || !blob) return NextResponse.json({ error: "file missing" }, { status: 500 });

  const html = prepareHtml(await blob.text());

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": SANDBOX_CSP,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
