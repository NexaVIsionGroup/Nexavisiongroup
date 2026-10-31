import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { unseal } from "@/lib/questionnaires/secrets";

// Admin (middleware-protected): decrypt one saved password from an access card.
// Body: { field: string }. Each reveal is written to the activity log.

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  const field = String(body.field || "");
  if (!field) return NextResponse.json({ error: "field is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("client_questionnaires").select("answers, title").eq("id", params.id).maybeSingle();
  const sealed = data?.answers?.[field]?.pass_enc;
  if (!sealed) return NextResponse.json({ error: "No saved password" }, { status: 404 });

  let pass: string;
  try {
    pass = unseal(sealed);
  } catch {
    return NextResponse.json({ error: "Could not decrypt" }, { status: 500 });
  }
  await supabase.from("activity_log").insert({
    action: "questionnaire_secret_revealed",
    entity_type: "client_questionnaire",
    entity_id: params.id,
    details: { field, title: data?.title },
  });
  return NextResponse.json({ pass }, { headers: { "Cache-Control": "no-store" } });
}
