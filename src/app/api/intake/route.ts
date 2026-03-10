import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Log the submission (you can later add email notification, Sanity write, webhook, etc.)
    console.log("=== NEW INTAKE SUBMISSION ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=============================");

    // TODO: Add email notification via SendGrid/Resend
    // TODO: Add Sanity document creation for lead tracking
    // TODO: Add webhook for CRM integration

    return NextResponse.json(
      { success: true, message: "Intake received" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Intake submission error:", error);
    return NextResponse.json(
      { success: false, message: "Submission failed" },
      { status: 500 }
    );
  }
}
