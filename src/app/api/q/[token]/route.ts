import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sealPatch, stripSecrets } from "@/lib/questionnaires/secrets";
import { getTemplate } from "@/lib/questionnaires";
import { notifyProspect } from "@/lib/questionnaires/notify";

// PUBLIC client endpoint for /q/[token]. The token is the only credential,
// so responses never include admin notes or internal fields.

export const dynamic = "force-dynamic";

type Ctx = { params: { token: string } };

const PUBLIC_FIELDS =
  "id, token, template, title, client_name, status, answers, extra_questions, current_section, expires_at, submitted_at";

async function load(token: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("client_questionnaires")
    .select(PUBLIC_FIELDS + ", open_count")
    .eq("token", token)
    .maybeSingle();
  return { supabase, row: data as any };
}

function closed(row: any) {
  if (!row || row.status === "archived") return "This link is no longer active.";
  if (row.expires_at && new Date(row.expires_at) < new Date()) return "This link has expired.";
  return null;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { supabase, row } = await load(params.token);
  const why = closed(row);
  if (why) return NextResponse.json({ error: why }, { status: 404 });

  await supabase
    .from("client_questionnaires")
    .update({ open_count: (row.open_count || 0) + 1, last_opened_at: new Date().toISOString() })
    .eq("id", row.id);

  // client_name is an internal label, keep it out of the public response
  const { open_count, id, client_name, ...pub } = row;
  pub.answers = stripSecrets(pub.answers || {});
  return NextResponse.json(pub, { headers: { "Cache-Control": "no-store" } });
}

// Autosave. Body: { answers?: object (merged by key), current_section?: number }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { supabase, row } = await load(params.token);
  const why = closed(row);
  if (why) return NextResponse.json({ error: why }, { status: 404 });

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
    last_saved_at: new Date().toISOString(),
  };
  if (row.status === "pending") updates.status = "in_progress";

  if (body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)) {
    const size = JSON.stringify(body.answers).length;
    if (size > 400_000) return NextResponse.json({ error: "Too much data" }, { status: 413 });
    // merge so two open tabs don't wipe each other's sections
    let sealed: Record<string, any>;
    try {
      sealed = sealPatch(body.answers, row.answers || {});
    } catch {
      return NextResponse.json({ error: "Could not save securely" }, { status: 500 });
    }
    updates.answers = { ...(row.answers || {}), ...sealed };
  }
  if (Number.isInteger(body.current_section)) updates.current_section = body.current_section;

  const { error } = await supabase.from("client_questionnaires").update(updates).eq("id", row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, saved_at: updates.last_saved_at });
}

// "Send it in". They can keep editing afterwards; each send notifies admin.
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { supabase, row } = await load(params.token);
  const why = closed(row);
  if (why) return NextResponse.json({ error: why }, { status: 404 });

  const now = new Date().toISOString();
  const first = !row.submitted_at;
  await supabase
    .from("client_questionnaires")
    .update({ status: "submitted", submitted_at: now, updated_at: now })
    .eq("id", row.id);

  const who = row.client_name || row.answers?.p1_first || row.answers?.owner_first || "A client";
  const t = getTemplate(row.template);
  if (t.kind === "prospect") await notifyProspect(first ? "submitted" : "resubmitted", row, t);
  await supabase.from("admin_notifications").insert({
    type: "questionnaire_submitted",
    title: first ? "Questionnaire submitted" : "Questionnaire updated",
    message: `${who} ${first ? "sent in" : "updated"} “${row.title}”`,
    entity_type: "client_questionnaire",
    entity_id: row.id,
    action_url: `/admin/questionnaires/${row.id}`,
  });
  await supabase.from("activity_log").insert({
    action: first ? "questionnaire_submitted" : "questionnaire_resubmitted",
    entity_type: "client_questionnaire",
    entity_id: row.id,
    details: { title: row.title },
  });

  return NextResponse.json({ ok: true, submitted_at: now });
}
