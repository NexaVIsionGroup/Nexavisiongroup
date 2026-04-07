import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { logEmail, buildEmailHtml, stripHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL } from '@/lib/email';
import { randomUUID } from 'crypto';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { to_email, to_name, subject, body: emailBody, body_html: richHtml, lead_id, draft_id, cc_emails, bcc_emails, from_email, attachments } = body;

    const accounts = await fetchEmailAccounts();
    if (!to_email || !subject || (!emailBody && !richHtml)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const senderEmail = from_email || DEFAULT_FROM_EMAIL;
    const thread_id = randomUUID();
    const customerName = to_name || to_email.split('@')[0];
    const html = buildEmailHtml(customerName, richHtml || (emailBody || '').replace(/\n/g, '<br>'), subject, senderEmail);

    const r = getResend();
    const params: Parameters<typeof r.emails.send>[0] = {
      from: getFromHeader(senderEmail, accounts),
      to: [to_email],
      subject,
      html,
    };
    if (cc_emails?.length) params.cc = cc_emails;
    if (bcc_emails?.length) params.bcc = bcc_emails;
    if (attachments?.length) {
      params.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content,
      }));
    }
    if (attachments?.length) {
      params.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content,
      }));
    }

    const { data, error } = await r.emails.send(params);
    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return NextResponse.json({ error: 'Failed to send', detail: error }, { status: 500 });
    }

    if (draft_id) {
      await supabase.from('email_messages').delete().eq('id', draft_id).eq('is_draft', true);
    }

    const logged = await logEmail({
      thread_id,
      lead_id: lead_id || null,
      direction: 'outbound',
      from_email: senderEmail,
      to_email,
      subject,
      body_html: html,
      body_text: emailBody || stripHtml(richHtml || ''),
      resend_message_id: data?.id,
      folder: 'sent',
      cc_emails: cc_emails || [],
      bcc_emails: bcc_emails || [],
    });

    return NextResponse.json({ success: true, thread_id, message_id: logged?.id, resend_id: data?.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Server error', detail: msg }, { status: 500 });
  }
}
