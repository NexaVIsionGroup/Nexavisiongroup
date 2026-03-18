import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();
    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Mark invite as used
    const { error: updateError } = await supabase
      .from("invite_tokens")
      .update({ used: true, used_by: email, used_at: new Date().toISOString() })
      .eq("token", token);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to accept invite" },
        { status: 500 }
      );
    }

    // Get invite details for role
    const { data: invite } = await supabase
      .from("invite_tokens")
      .select("role")
      .eq("token", token)
      .single();

    // Create admin_users record
    const { data: authUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();

    if (!authUser) {
      await supabase.from("admin_users").insert({
        email,
        role: invite?.role || "team_member",
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
