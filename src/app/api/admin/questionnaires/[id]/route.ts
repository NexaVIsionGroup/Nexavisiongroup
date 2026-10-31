import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getTemplate, totals } from "@/lib/questionnaires";
import { analyze } from "@/lib/questionnaires/analyze";
import { stripSecrets } from "@/lib/questionnaires/secrets";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nexavisiongroup.com";
type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("client_questionnaires").select("*").eq("id", params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const t = getTemplate(data.template);
  return NextResponse.json({
    questionnaire: { ...data, answers: stripSecrets(data.answers || {}), url: `${SITE}/q/${data.token}` },
    totals: totals(t, data.answers || {}, data.extra_questions),
    flags: analyze(data.answers || {}, t.id),
    kind: t.kind || "household",
  });
}

// Body may include: admin_notes, status, title, client_name, client_email,
// client_phone, extra_questions (full array), answers_patch (merged).
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  const supabase = createAdminClient();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  for (const k of ["admin_notes", "title", "client_name", "client_email", "client_phone"]) {
    if (k in body) updates[k] = body[k] === "" ? null : body[k];
  }
  if (body.status && ["pending", "in_progress", "submitted", "reviewed", "archived"].includes(body.status)) {
    updates.status = body.status;
  }
  if (Array.isArray(body.extra_questions)) {
    updates.extra_questions = body.extra_questions
      .filter((q: any) => q && q.id && String(q.label || "").trim())
      .map((q: any) => ({
        id: String(q.id).replace(/[^a-z0-9_]/gi, "").slice(0, 40),
        label: String(q.label).slice(0, 500),
        help: q.help ? String(q.help).slice(0, 500) : undefined,
        type: ["text", "textarea", "money", "yesno"].includes(q.type) ? q.type : "textarea",
        created_at: q.created_at || new Date().toISOString(),
      }));
  }
  if (body.answers_patch && typeof body.answers_patch === "object") {
    const { data: cur } = await supabase.from("client_questionnaires").select("answers").eq("id", params.id).single();
    // never let an admin patch overwrite a sealed password with nothing
    const patch: Record<string, any> = {};
    for (const [k, v] of Object.entries(body.answers_patch)) {
      const prev = (cur?.answers || {})[k];
      patch[k] = prev && typeof prev === "object" && prev.pass_enc && v && typeof v === "object" ? { ...(v as object), pass_enc: prev.pass_enc } : v;
    }
    updates.answers = { ...(cur?.answers || {}), ...patch };
  }

  const { error } = await supabase.from("client_questionnaires").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
