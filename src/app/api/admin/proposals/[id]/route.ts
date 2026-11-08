import { NextResponse } from "next/server";
import { db, previewUrl, projectUrl, syncPaid } from "@/lib/proposals/server";
import { normalizeContent } from "@/lib/proposals/types";

export const dynamic = "force-dynamic";

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = db();
  const { data: row, error } = await supabase.from("proposals").select("*").eq("id", params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = await syncPaid(row);
  const { data: events } = await supabase.from("proposal_events").select("id,event,meta,ip,user_agent,created_at").eq("proposal_id", p.id).order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({ proposal: { ...p, content: normalizeContent(p.content), url: projectUrl(p.token), preview_url: previewUrl(p.token) }, events: events || [] });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => ({}));
  const supabase = db();
  const { data: cur } = await supabase.from("proposals").select("id,signed_at").eq("id", params.id).maybeSingle();
  if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };
  // The link switch works at any stage. Everything else locks once it's signed.
  if (typeof b.link_enabled === "boolean") patch.link_enabled = b.link_enabled;
  const editing = ["title", "division", "client_name", "client_company", "client_email", "client_phone", "content", "expires_at", "status"].some((k) => k in b);
  if (editing && cur.signed_at) return NextResponse.json({ error: "This proposal is signed, so it can't be changed." }, { status: 409 });
  if ("title" in b) { const t = str(b.title); if (!t) return NextResponse.json({ error: "Title can't be empty." }, { status: 400 }); patch.title = t; }
  if ("division" in b) patch.division = str(b.division, 60) || null;
  if ("client_name" in b) patch.client_name = str(b.client_name, 120) || null;
  if ("client_company" in b) patch.client_company = str(b.client_company, 160) || null;
  if ("client_email" in b) patch.client_email = str(b.client_email, 200).toLowerCase() || null;
  if ("client_phone" in b) patch.client_phone = str(b.client_phone, 40) || null;
  if ("content" in b) patch.content = normalizeContent(b.content);
  if ("expires_at" in b) patch.expires_at = b.expires_at ? new Date(b.expires_at).toISOString() : null;
  if (b.status === "declined" || b.status === "sent") patch.status = b.status;

  const { data, error } = await supabase.from("proposals").update(patch).eq("id", params.id).select("updated_at,link_enabled,status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = db();
  const { data: cur } = await supabase.from("proposals").select("signed_at").eq("id", params.id).maybeSingle();
  if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cur.signed_at) return NextResponse.json({ error: "A signed proposal is a contract, so it can't be deleted." }, { status: 409 });
  const { error } = await supabase.from("proposals").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
