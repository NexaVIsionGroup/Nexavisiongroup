import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { logEmail, buildEmailHtml, stripHtml, getFromHeader, fetchEmailAccounts, DEFAULT_FROM_EMAIL } from '@/lib/email';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { thread_id, to_email, to_name, subject, reply_body, reply_html, lead_id, from_email, attachments } = body;
    const accounts = await fetchEmailAccounts();

    if (!thread_id || !to_email || (!reply_body && !reply_html)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const senderEmail = from_email || DEFAULT_FROM_EMAIL;
    const customerName = to_name || to_email.split('@')[0];
    const replySubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your inquiry'}`;
    const html = buildEmailHtml(customerName, reply_html || (reply_body || '').replace(/\n/g, '<br>'), subject || 'Your inquiry', senderEmail);

    let inReplyToHeader: string | undefined;
    const { data: lastMsg } = await supabase
      .from('email_messages').select('resend_message_id')
      .eq('thread_id', thread_id).not('resend_message_id', 'is', null)
      .order('created_at', { ascending: false }).limit(1).single();
    if (lastMsg?.resend_message_id) {
      inReplyToHeader = `<${lastMsg.resend_message_id}@resend.dev>`;
    }

    const r = getResend();
    const params: Parameters<typeof r.emails.send>[0] = {
      from: getFromHeader(senderEmail, accounts),
      to: [to_email],
      subject: replySubject,
      html,
    };
    if (inReplyToHeader) {
      params.headers = { 'In-Reply-To': inReplyToHeader, 'References': inReplyToHeader };
    }
    if (attachments?.length) {
      params.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        content_type: att.type,
      }));
    }

    const { data, error } = await r.emails.send(params);
    if (error) return NextResponse.json({ error: 'Failed to send', detail: error }, { status: 500 });

    const logged = await logEmail({
      thread_id,
      lead_id: lead_id || null,
      direction: 'outbound',
      from_email: senderEmail,
      to_email,
      subject: replySubject,
      body_html: html,
      body_text: reply_body || stripHtml(reply_html || ''),
      resend_message_id: data?.id,
      folder: 'sent',
    });

    return NextResponse.json({ success: true, message_id: logged?.id, resend_id: data?.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Server error', detail: msg }, { status: 500 });
  }
}
