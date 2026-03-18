import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { DEFAULT_FROM_EMAIL } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { draft_id, to_email, subject, body_html, body_text, cc_emails, bcc_emails, from_email } = body;

  if (draft_id) {
    const { data, error } = await supabase
      .from('email_messages')
      .update({
        to_email: to_email || '',
        subject: subject || '(no subject)',
        body_html, body_text,
        cc_emails: cc_emails || [],
        bcc_emails: bcc_emails || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft_id).eq('is_draft', true).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ draft: data });
  }

  const thread_id = randomUUID();
  const { data, error } = await supabase
    .from('email_messages')
    .insert({
      thread_id,
      direction: 'outbound',
      from_email: from_email || DEFAULT_FROM_EMAIL,
      to_email: to_email || '',
      subject: subject || '(no subject)',
      body_html, body_text,
      folder: 'drafts',
      is_draft: true,
      read: true,
      cc_emails: cc_emails || [],
      bcc_emails: bcc_emails || [],
    }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data });
}
