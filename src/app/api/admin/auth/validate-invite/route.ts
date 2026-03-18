import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("invite_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 404 }
      );
    }

    // Check expiry (30 days)
    const expires = new Date(data.created_at);
    expires.setDate(expires.getDate() + 30);
    if (new Date() > expires) {
      return NextResponse.json(
        { error: "This invite link has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      role: data.role,
      created_by: data.created_by,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
