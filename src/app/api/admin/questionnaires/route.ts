import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getTemplate, newToken, totals } from "@/lib/questionnaires";

// Admin (middleware-protected): list + create client questionnaires.

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nexavisiongroup.com";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_questionnaires")
    .select("id, token, template, title, client_name, status, answers, extra_questions, current_section, open_count, last_opened_at, last_saved_at, submitted_at, created_at, updated_at")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const questionnaires = (data || []).map((q: any) => {
    const t = getTemplate(q.template);
    const tot = totals(t, q.answers || {}, q.extra_questions);
    const { answers, ...rest } = q;
    return {
      ...rest,
      url: `${SITE}/q/${q.token}`,
      answered: Object.keys(answers || {}).length,
      income: tot.income,
      expenses: tot.expenses,
      gap: tot.gap,
    };
  });
  return NextResponse.json({ questionnaires });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const template = getTemplate(body.template).id;
  const prefill: Record<string, any> = {};
  if (body.address) prefill.address = String(body.address).trim();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_questionnaires")
    .insert({
      token: newToken(),
      template,
      title,
      client_name: String(body.client_name || "").trim() || null,
      client_email: String(body.client_email || "").trim() || null,
      client_phone: String(body.client_phone || "").trim() || null,
      created_by: String(body.created_by || "").trim() || null,
      answers: prefill,
    })
    .select("id, token")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    action: "questionnaire_created",
    entity_type: "client_questionnaire",
    entity_id: data.id,
    details: { title, template },
  });

  return NextResponse.json({ id: data.id, url: `${SITE}/q/${data.token}` });
}
