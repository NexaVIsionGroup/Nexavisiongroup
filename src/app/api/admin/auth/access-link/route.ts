import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Look up access token
    const { data, error } = await supabase
      .from("access_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid or expired access link" },
        { status: 404 }
      );
    }

    // Check 24-hour expiry
    const expires = new Date(data.created_at);
    expires.setHours(expires.getHours() + 24);
    if (new Date() > expires) {
      return NextResponse.json(
        { error: "This access link has expired" },
        { status: 410 }
      );
    }

    // Mark as used
    await supabase
      .from("access_tokens")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("token", token);

    // Generate a magic link sign-in for the user
    // The client will need to handle the auth session
    return NextResponse.json({
      success: true,
      email: data.email,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
