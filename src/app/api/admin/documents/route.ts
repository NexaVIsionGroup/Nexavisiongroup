import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  DOCS_BUCKET,
  MAX_DOC_BYTES,
  buildSlug,
  extractTitle,
  hashPassword,
} from "@/lib/documents";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nexavisiongroup.com";

// ── GET /api/admin/documents — list every shared document ──────────────
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shared_documents")
    .select(
      "id, slug, title, description, client_name, customer_id, original_name, size_bytes, status, expires_at, show_toolbar, version, view_count, last_viewed_at, created_by, created_at, updated_at, password_hash"
    )
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const documents = (data || []).map(({ password_hash, ...d }: any) => ({
    ...d,
    has_password: !!password_hash,
    url: `${SITE}/d/${d.slug}`,
  }));
  return NextResponse.json({ documents });
}

// ── POST /api/admin/documents — upload a new HTML document ─────────────
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const form = await req.formData();

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_DOC_BYTES) {
    return NextResponse.json({ error: "File exceeds 25MB" }, { status: 400 });
  }
  if (!/\.(html?|htm)$/i.test(file.name)) {
    return NextResponse.json({ error: "Only .html files are supported" }, { status: 400 });
  }

  const html = await file.text();
  const title =
    String(form.get("title") || "").trim() ||
    extractTitle(html) ||
    file.name.replace(/\.html?$/i, "");

  const customSlug = String(form.get("slug") || "").trim();
  let slug = buildSlug(title, customSlug || undefined);

  // Custom slugs must be unique; generated ones already carry a random suffix.
  const { data: clash } = await supabase
    .from("shared_documents")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) {
    if (customSlug) {
      return NextResponse.json({ error: "That link name is already taken" }, { status: 409 });
    }
    slug = buildSlug(title);
  }

  const password = String(form.get("password") || "");
  const expires = String(form.get("expires_at") || "");
  const customerId = String(form.get("customer_id") || "");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${slug}/v1_${Date.now()}_${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(DOCS_BUCKET)
    // Bare "text/html" — the bucket's allowed_mime_types rejects a charset suffix.
    .upload(path, Buffer.from(html, "utf8"), { contentType: "text/html", upsert: false });
  if (upErr) {
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("shared_documents")
    .insert({
      slug,
      title,
      description: String(form.get("description") || "") || null,
      client_name: String(form.get("client_name") || "") || null,
      customer_id: customerId || null,
      storage_path: path,
      original_name: safeName,
      size_bytes: Buffer.byteLength(html, "utf8"),
      password_hash: password ? hashPassword(password) : null,
      expires_at: expires || null,
      show_toolbar: form.get("show_toolbar") !== "false",
      created_by: String(form.get("created_by") || "") || null,
    })
    .select("id, slug, title")
    .single();

  if (error) {
    await supabase.storage.from(DOCS_BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    action: "document_created",
    entity_type: "shared_document",
    entity_id: data.id,
    details: { slug, title },
  });

  return NextResponse.json({ document: data, url: `${SITE}/d/${slug}` });
}
