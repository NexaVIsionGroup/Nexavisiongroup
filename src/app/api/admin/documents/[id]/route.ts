import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  DOCS_BUCKET,
  MAX_DOC_BYTES,
  extractTitle,
  hashPassword,
  slugify,
} from "@/lib/documents";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nexavisiongroup.com";

type Ctx = { params: { id: string } };

// ── PATCH — edit title / description / client / slug / status / password / expiry ──
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createAdminClient();
  const body = await req.json();

  const { data: doc } = await supabase
    .from("shared_documents")
    .select("id, slug")
    .eq("id", params.id)
    .single();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const patch: Record<string, any> = {};

  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if ("description" in body) patch.description = body.description?.trim() || null;
  if ("client_name" in body) patch.client_name = body.client_name?.trim() || null;
  if ("customer_id" in body) patch.customer_id = body.customer_id || null;
  if ("expires_at" in body) patch.expires_at = body.expires_at || null;
  if ("show_toolbar" in body) patch.show_toolbar = !!body.show_toolbar;
  if (body.status === "active" || body.status === "disabled") patch.status = body.status;

  if (typeof body.slug === "string" && body.slug.trim()) {
    const next = slugify(body.slug);
    if (!next) return NextResponse.json({ error: "Invalid link name" }, { status: 400 });
    if (next !== doc.slug) {
      const { data: clash } = await supabase
        .from("shared_documents")
        .select("id")
        .eq("slug", next)
        .maybeSingle();
      if (clash) return NextResponse.json({ error: "That link name is already taken" }, { status: 409 });
      patch.slug = next;
    }
  }

  // password: "" or null clears it, a string sets it, omitted leaves it alone
  if ("password" in body) {
    patch.password_hash = body.password ? hashPassword(String(body.password)) : null;
  }

  if (!Object.keys(patch).length) return NextResponse.json({ ok: true });

  const { data, error } = await supabase
    .from("shared_documents")
    .update(patch)
    .eq("id", params.id)
    .select("id, slug, title, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    action: "document_updated",
    entity_type: "shared_document",
    entity_id: params.id,
    details: { fields: Object.keys(patch) },
  });

  return NextResponse.json({ document: data, url: `${SITE}/d/${data.slug}` });
}

// ── PUT — replace the HTML file, keeping the same public link ──────────
export async function PUT(req: NextRequest, { params }: Ctx) {
  const supabase = createAdminClient();

  const { data: doc } = await supabase
    .from("shared_documents")
    .select("id, slug, storage_path, version, title")
    .eq("id", params.id)
    .single();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

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
  const version = (doc.version || 1) + 1;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${doc.slug}/v${version}_${Date.now()}_${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(DOCS_BUCKET)
    // Bare "text/html" — the bucket's allowed_mime_types rejects a charset suffix.
    .upload(path, Buffer.from(html, "utf8"), { contentType: "text/html", upsert: false });
  if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });

  const patch: Record<string, any> = {
    storage_path: path,
    original_name: safeName,
    size_bytes: Buffer.byteLength(html, "utf8"),
    version,
  };
  if (form.get("retitle") === "true") {
    patch.title = extractTitle(html) || doc.title;
  }

  const { error } = await supabase.from("shared_documents").update(patch).eq("id", params.id);
  if (error) {
    await supabase.storage.from(DOCS_BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Drop the superseded file — the link always serves the current version.
  if (doc.storage_path) {
    await supabase.storage.from(DOCS_BUCKET).remove([doc.storage_path]);
  }

  await supabase.from("activity_log").insert({
    action: "document_replaced",
    entity_type: "shared_document",
    entity_id: params.id,
    details: { version },
  });

  return NextResponse.json({ ok: true, version });
}

// ── DELETE — remove the document and its file ──────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createAdminClient();

  const { data: doc } = await supabase
    .from("shared_documents")
    .select("id, slug, storage_path")
    .eq("id", params.id)
    .single();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Remove every object under this document's folder, not just the current one.
  const { data: files } = await supabase.storage.from(DOCS_BUCKET).list(doc.slug);
  const paths = (files || []).map((f: any) => `${doc.slug}/${f.name}`);
  if (doc.storage_path && !paths.includes(doc.storage_path)) paths.push(doc.storage_path);
  if (paths.length) await supabase.storage.from(DOCS_BUCKET).remove(paths);

  const { error } = await supabase.from("shared_documents").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    action: "document_deleted",
    entity_type: "shared_document",
    entity_id: params.id,
    details: { slug: doc.slug },
  });

  return NextResponse.json({ ok: true });
}
