import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

// IMPORTANT: protect this route with the same admin auth as your other
// /api/admin/* routes (middleware / AuthGuard). It uses the service role.

const BUCKET = 'verification-docs';

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { customer_id, email, send_email, created_by } = await req.json();
  if (!customer_id) return NextResponse.json({ error: 'customer_id required' }, { status: 400 });
  const token = randomBytes(24).toString('base64url');
  const { data, error } = await supabase.from('verification_requests')
    .insert({ customer_id, token, created_by: created_by || null }).select('id').single();
  if (error) return NextResponse.json({ error: 'create failed' }, { status: 500 });
  await supabase.from('activity_log').insert({
    action: 'verification_requested', entity_type: 'verification_request',
    entity_id: data.id, user_email: created_by || null });
  const link = (process.env.NEXT_PUBLIC_SITE_URL || '') + '/verify/' + token;
  if (send_email && email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'NexaVision Group <info@nexavisiongroup.com>',
        to: email,
        subject: 'Identity verification for your NexaVision account',
        html: '<p>Please verify your identity using the secure link below. It expires in 7 days.</p><p><a href="' + link + '">' + link + '</a></p>',
      });
    } catch {}
  }
  return NextResponse.json({ id: data.id, token, link });
}

export async function GET() {
  const supabase = createAdminClient();
  const { data: requests } = await supabase.from('verification_requests')
    .select('id, customer_id, status, created_at, submitted_at, reviewed_at, expires_at')
    .order('created_at', { ascending: false }).limit(200);
  const rows = requests || [];
  const ids = Array.from(new Set(rows.map((r: any) => r.customer_id).filter(Boolean)));
  const map: Record<string, { name: string; email: string }> = {};
  if (ids.length) {
    const { data: cs } = await supabase.from('customers')
      .select('id, first_name, last_name, company_name, email').in('id', ids as string[]);
    for (const c of cs || []) {
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.company_name || '';
      map[c.id] = { name, email: c.email || '' };
    }
  }
  const enriched = rows.map((r: any) => ({
    ...r,
    customer_name: r.customer_id ? (map[r.customer_id]?.name || '') : '',
    customer_email: r.customer_id ? (map[r.customer_id]?.email || '') : '',
  }));
  return NextResponse.json({ requests: enriched });
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const { id, decision, review_notes, reviewed_by, want_urls } = await req.json();
  if (want_urls) {
    const { data: docs } = await supabase.from('verification_documents')
      .select('id, doc_type, storage_path, original_name, content_type, size_bytes')
      .eq('request_id', id);
    const documents = await Promise.all((docs || []).map(async (d: any) => {
      const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 300);
      const { data: dl } = await supabase.storage.from(BUCKET)
        .createSignedUrl(d.storage_path, 300, { download: d.original_name || true });
      return { ...d, url: s?.signedUrl || null, downloadUrl: dl?.signedUrl || null };
    }));
    await supabase.from('activity_log').insert({
      action: 'verification_docs_viewed', entity_type: 'verification_request',
      entity_id: id, user_email: reviewed_by || null });
    return NextResponse.json({ documents });
  }
  if (!['approved','rejected'].includes(decision))
    return NextResponse.json({ error: 'bad decision' }, { status: 400 });
  await supabase.from('verification_requests').update({
    status: decision, review_notes: review_notes || null,
    reviewed_by: reviewed_by || null, reviewed_at: new Date().toISOString() }).eq('id', id);
  await supabase.from('activity_log').insert({
    action: 'verification_' + decision, entity_type: 'verification_request',
    entity_id: id, user_email: reviewed_by || null, details: { review_notes } });
  return NextResponse.json({ ok: true });
}