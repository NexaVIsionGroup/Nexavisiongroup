import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logEmail } from '@/lib/email';

function parseEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : raw.toLowerCase().trim();
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Resend webhook signature if secret is set
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
      const { Webhook } = await import('svix');
      const svixId = req.headers.get('svix-id');
      const svixTimestamp = req.headers.get('svix-timestamp');
      const svixSignature = req.headers.get('svix-signature');
      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
      }
      try {
        const wh = new Webhook(secret);
        wh.verify(rawBody, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature });
      } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let event;
    try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    if (event.type !== 'email.received') {
      return NextResponse.json({ success: true, skipped: true });
    }

    const { email_id, from, to, subject } = event.data as {
      email_id: string; from: string; to: string | string[]; subject: string;
    };

    let body_html: string | null = null;
    let body_text: string | null = null;
    let in_reply_to: string | null = null;

    try {
      const resp = await fetch(`https://api.resend.com/emails/receiving/${email_id}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (resp.ok) {
        const full = await resp.json();
        body_html = full.html || null;
        body_text = full.text || null;
        const headers = full.headers || {};
        in_reply_to = headers['in-reply-to'] || headers['In-Reply-To'] || null;
        if (in_reply_to) in_reply_to = in_reply_to.replace(/[<>]/g, '').trim();
      }
    } catch (err) {
      console.error('Failed to fetch full email from Resend:', err);
    }

    const from_email = parseEmail(typeof from === 'string' ? from : String(from));
    const to_email = parseEmail(typeof to === 'string' ? to : Array.isArray(to) ? to[0] : 'hello@nexavisiongroup.com');
    const subjectStr = subject || '(no subject)';

    const supabase = createAdminClient();

    // Try to find existing thread via In-Reply-To
    let threadId: string | undefined;
    if (in_reply_to) {
      const resendUuid = in_reply_to.includes('@') ? in_reply_to.split('@')[0] : in_reply_to;
      const { data: original } = await supabase
        .from('email_messages').select('thread_id')
        .eq('resend_message_id', resendUuid).single();
      if (original) threadId = original.thread_id;
    }

    // Fallback: match by sender + subject
    if (!threadId) {
      const cleanSubject = subjectStr.replace(/^(Re:|Fwd?:)\s*/gi, '').trim();
      const { data: match } = await supabase
        .from('email_messages').select('thread_id')
        .eq('to_email', from_email).ilike('subject', `%${cleanSubject}%`)
        .order('created_at', { ascending: false }).limit(1).single();
      if (match) threadId = match.thread_id;
    }

    const logged = await logEmail({
      thread_id: threadId,
      direction: 'inbound',
      from_email,
      to_email,
      subject: subjectStr,
      body_html: body_html ?? undefined,
      body_text: body_text ?? undefined,
    });

    return NextResponse.json({ success: true, message_id: logged?.id, thread_id: logged?.thread_id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Server error', detail: msg }, { status: 500 });
  }
}
