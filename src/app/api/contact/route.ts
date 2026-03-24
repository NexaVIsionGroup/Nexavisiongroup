import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Log the message
    console.log("=== NEW CONTACT MESSAGE ===");
    console.log(`From: ${data.name} <${data.email}>`);
    console.log(`Phone: ${data.phone || "not provided"}`);
    console.log(`Subject: ${data.subject || "No subject"}`);
    console.log(`Message: ${data.message}`);
    console.log("===========================");

    // TODO: Send email via Resend/SendGrid to info@nexavisiongroup.com
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'NexaVision Site <noreply@nexavisiongroup.com>',
    //   to: 'info@nexavisiongroup.com',
    //   subject: `New Message: ${data.subject || 'Website Contact'}`,
    //   html: `<p><strong>From:</strong> ${data.name} (${data.email})</p>
    //          <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
    //          <p><strong>Message:</strong></p><p>${data.message}</p>`,
    // });

    return NextResponse.json(
      { success: true, message: "Message received" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send" },
      { status: 500 }
    );
  }
}
