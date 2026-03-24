import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function recommendTier(data: any): string {
  const bottleneckCount = data.bottlenecks?.length || 0;
  const isLargeTeam = data.teamSize === "large" || data.teamSize === "medium";
  const highLeads = data.leadVolume === "100" || data.leadVolume === "200";

  if (isLargeTeam && (bottleneckCount >= 4 || highLeads)) return "Ops Stack";
  if (bottleneckCount >= 3 || (isLargeTeam && bottleneckCount >= 2) || highLeads) return "Growth";
  return "Starter";
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const tier = recommendTier(data);

    if (!data.name || !data.email) {
      return NextResponse.json(
        { success: false, message: "Name and email required" },
        { status: 400 }
      );
    }

    // Send to NexaVision inbox
    await resend.emails.send({
      from: "NexaVision Intake <info@nexavisiongroup.com>",
      to: "info@nexavisiongroup.com",
      replyTo: data.email,
      subject: `New Lead: ${data.name} — ${data.industry || "Unknown"} — ${tier}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h2 style="color: #00E5CC; margin-bottom: 4px;">New Intake Submission</h2>
          <p style="color: #5A6A7E; margin-top: 0;">Recommended tier: <strong style="color: #00E5CC;">${tier}</strong></p>
          <hr style="border: none; border-top: 1px solid #1C2D4A; margin: 16px 0;" />

          <h3 style="color: #F0F4F8; margin-bottom: 8px;">Contact</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #5A6A7E; width: 120px;">Name</td><td style="color: #F0F4F8;"><strong>${data.name}</strong></td></tr>
            <tr><td style="padding: 6px 0; color: #5A6A7E;">Email</td><td><a href="mailto:${data.email}" style="color: #00E5CC;">${data.email}</a></td></tr>
            ${data.phone ? `<tr><td style="padding: 6px 0; color: #5A6A7E;">Phone</td><td style="color: #F0F4F8;">${data.phone}</td></tr>` : ""}
            ${data.company ? `<tr><td style="padding: 6px 0; color: #5A6A7E;">Company</td><td style="color: #F0F4F8;">${data.company}</td></tr>` : ""}
            ${data.website ? `<tr><td style="padding: 6px 0; color: #5A6A7E;">Website</td><td><a href="${data.website}" style="color: #00E5CC;">${data.website}</a></td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #5A6A7E;">Contact via</td><td style="color: #F0F4F8;">${data.contactMethod || "email"}</td></tr>
            <tr><td style="padding: 6px 0; color: #5A6A7E;">Best time</td><td style="color: #F0F4F8;">${data.bestTime || "morning"}</td></tr>
          </table>

          <hr style="border: none; border-top: 1px solid #1C2D4A; margin: 16px 0;" />
          <h3 style="color: #F0F4F8; margin-bottom: 8px;">Business Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #5A6A7E; width: 120px;">Industry</td><td style="color: #F0F4F8;">${data.industry}${data.industryOther ? ` (${data.industryOther})` : ""}</td></tr>
            <tr><td style="padding: 6px 0; color: #5A6A7E;">Team size</td><td style="color: #F0F4F8;">${data.teamSize}</td></tr>
            <tr><td style="padding: 6px 0; color: #5A6A7E;">Monthly leads</td><td style="color: #F0F4F8;">~${data.leadVolume}/mo</td></tr>
          </table>

          <hr style="border: none; border-top: 1px solid #1C2D4A; margin: 16px 0;" />
          <h3 style="color: #F0F4F8; margin-bottom: 8px;">Bottlenecks</h3>
          <ul style="color: #F0F4F8; padding-left: 20px;">
            ${(data.bottlenecks || []).map((b: string) => `<li style="padding: 4px 0;">${b}${b === "other" && data.bottleneckOther ? `: ${data.bottleneckOther}` : ""}</li>`).join("")}
          </ul>

          <p style="margin-top: 24px; font-size: 12px; color: #5A6A7E;">
            Submitted via nexavisiongroup.com/contact intake form
          </p>
        </div>
      `,
    });

    // Send confirmation to the lead
    await resend.emails.send({
      from: "NexaVision Group <info@nexavisiongroup.com>",
      to: data.email,
      subject: `We received your intake — ${tier} system recommended`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h2 style="color: #00E5CC;">Thanks, ${data.name.split(" ")[0]}. We've got your details.</h2>
          <p style="color: #8896A6; line-height: 1.6;">
            Based on your industry and bottlenecks, we'd recommend the <strong style="color: #F0F4F8;">${tier}</strong> system.
          </p>
          <p style="color: #8896A6; line-height: 1.6;">
            We'll reach out within 24 hours to schedule your discovery call.
          </p>
          <p style="color: #8896A6; line-height: 1.6;">
            In the meantime, see what a live system looks like:
            <a href="https://arcticsolutionsllc.com" style="color: #00E5CC;">Arctic Solutions Demo →</a>
          </p>
          <hr style="border: none; border-top: 1px solid #1C2D4A; margin: 24px 0;" />
          <p style="font-size: 12px; color: #5A6A7E;">
            NexaVision Group · Revenue infrastructure for service businesses<br />
            <a href="https://nexavisiongroup.com" style="color: #00E5CC;">nexavisiongroup.com</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { success: true, message: "Intake received", tier },
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
