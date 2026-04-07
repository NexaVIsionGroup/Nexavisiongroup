import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, phone, subject, message, attachments } = data;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Build Resend attachments array
    const resendAttachments = (attachments || []).map((att: any) => ({
      filename: att.filename,
      content: att.content,
    }));

    const hasAttachments = resendAttachments.length > 0;
    const attachmentNote = hasAttachments
      ? `<p style="margin-top: 16px; padding: 12px; background: #162238; border-radius: 8px; color: #8896A6; font-size: 13px;">📎 ${resendAttachments.length} file${resendAttachments.length > 1 ? "s" : ""} attached: ${(attachments || []).map((a: any) => a.filename).join(", ")}</p>`
      : "";

    // Send to NexaVision inbox
    await resend.emails.send({
      from: "NexaVision Site <info@nexavisiongroup.com>",
      to: "info@nexavisiongroup.com",
      replyTo: email,
      subject: `New Message: ${subject || "Website Contact"} — from ${name}${hasAttachments ? " 📎" : ""}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 100%; width: 600px; box-sizing: border-box;">
          <h2 style="color: #00E5CC; margin-bottom: 4px; font-size: 18px;">New Message from NexaVision Site</h2>
          <hr style="border: none; border-top: 1px solid #1C2D4A; margin: 16px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #5A6A7E; width: 80px; font-size: 13px;">Name</td><td style="padding: 8px 0; color: #F0F4F8; font-size: 14px;"><strong>${name}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #5A6A7E; font-size: 13px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #00E5CC;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding: 8px 0; color: #5A6A7E; font-size: 13px;">Phone</td><td style="padding: 8px 0; color: #F0F4F8; font-size: 14px;">${phone}</td></tr>` : ""}
            ${subject ? `<tr><td style="padding: 8px 0; color: #5A6A7E; font-size: 13px;">Subject</td><td style="padding: 8px 0; color: #F0F4F8; font-size: 14px;">${subject}</td></tr>` : ""}
          </table>
          <hr style="border: none; border-top: 1px solid #1C2D4A; margin: 16px 0;" />
          <div style="padding: 16px; background: #0F1D32; border-radius: 8px; color: #F0F4F8; line-height: 1.6; font-size: 14px; word-wrap: break-word; overflow-wrap: break-word;">
            ${message.replace(/\n/g, "<br />")}
          </div>
          ${attachmentNote}
          <p style="margin-top: 16px; font-size: 11px; color: #5A6A7E;">
            Sent via nexavisiongroup.com contact modal · Reply directly to respond to ${name}
          </p>
        </div>
      `,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });

    // Send confirmation to the visitor
    await resend.emails.send({
      from: "NexaVision Group <info@nexavisiongroup.com>",
      to: email,
      subject: "We got your message — NexaVision Group",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 100%; width: 600px; box-sizing: border-box;">
          <h2 style="color: #00E5CC; font-size: 18px;">Thanks for reaching out, ${name.split(" ")[0]}.</h2>
          <p style="color: #8896A6; line-height: 1.6; font-size: 14px;">
            We received your message${hasAttachments ? ` and ${resendAttachments.length} attachment${resendAttachments.length > 1 ? "s" : ""}` : ""} and will get back to you within 24 hours.
          </p>
          <p style="color: #8896A6; line-height: 1.6; font-size: 14px;">
            In the meantime, check out a live system we built:
            <a href="https://arcticsolutionsllc.com" style="color: #00E5CC;">Arctic Solutions Demo →</a>
          </p>
          <hr style="border: none; border-top: 1px solid #1C2D4A; margin: 24px 0;" />
          <p style="font-size: 11px; color: #5A6A7E;">
            NexaVision Group · Revenue infrastructure for service businesses<br />
            <a href="https://nexavisiongroup.com" style="color: #00E5CC;">nexavisiongroup.com</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Message sent" }, { status: 200 });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ success: false, message: "Failed to send" }, { status: 500 });
  }
}
