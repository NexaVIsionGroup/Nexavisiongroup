import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("active", true)
    .order("is_default", { ascending: false })
    .order("email");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { action, account } = body;

  if (action === "delete") {
    const { error } = await supabase
      .from("email_accounts")
      .update({ active: false })
      .eq("id", account.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "update") {
    const { data, error } = await supabase
      .from("email_accounts")
      .update({
        email: account.email,
        display_name: account.display_name,
        color: account.color,
        initials: account.initials,
        is_default: account.is_default || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ account: data });
  }

  if (action === "set_default") {
    // Unset all defaults first
    await supabase.from("email_accounts").update({ is_default: false }).eq("is_default", true);
    const { error } = await supabase
      .from("email_accounts")
      .update({ is_default: true })
      .eq("id", account.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Create
  const initials =
    account.initials ||
    account.display_name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const { data, error } = await supabase
    .from("email_accounts")
    .insert({
      email: account.email,
      display_name: account.display_name,
      color: account.color || "#00E5CC",
      initials,
      is_default: account.is_default || false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data });
}
