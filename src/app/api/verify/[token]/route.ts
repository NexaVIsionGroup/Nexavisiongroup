import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'verification-docs';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  'image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf',
]);
const DOC_TYPES = ['gov_id','selfie','supporting'] as const;
type DocType = typeof DOC_TYPES[number];

async function getRequest(supabase: ReturnType<typeof createAdminClient>, token: string) {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, customer_id, status, expires_at')
    .eq('token', token).single();
  if (error || !data) return null;
  return { ...data, expired: new Date(data.expires_at) < new Date() };
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const r = await getRequest(supabase, params.token);
  if (!r) return NextResponse.json({ error: 'invalid' }, { status: 404 });
  if (r.expired || r.status === 'expired') return NextResponse.json({ status: 'expired' }, { status: 410 });
  let firstName = '';
  if (r.customer_id) {
    const { data: c } = await supabase.from('customers').select('first_name').eq('id', r.customer_id).single();
    firstName = c?.first_name || '';
  }
  return NextResponse.json({ status: r.status, firstName });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const r = await getRequest(supabase, params.token);
  if (!r) return NextResponse.json({ error: 'invalid' }, { status: 404 });
  if (r.expired) {
    await supabase.from('verification_requests').update({ status: 'expired' }).eq('id', r.id);
    return NextResponse.json({ error: 'expired' }, { status: 410 });
  }
  if (r.status !== 'pending') return NextResponse.json({ error: 'already submitted' }, { status: 409 });

  const form = await req.formData();
  const uploads: { type: DocType; file: File }[] = [];
  for (const type of DOC_TYPES) {
    for (const e of form.getAll(type)) {
      if (e instanceof File && e.size > 0) uploads.push({ type, file: e });
    }
  }
  if (!uploads.some(u => u.type === 'gov_id') || !uploads.some(u => u.type === 'selfie')) {
    return NextResponse.json({ error: 'Government ID and selfie are required' }, { status: 400 });
  }

  const rows: any[] = [];
  for (const { type, file } of uploads) {
    if (file.size > MAX_BYTES) return NextResponse.json({ error: file.name + ' exceeds 10MB' }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: file.name + ': unsupported type' }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const path = r.id + '/' + type + '/' + Date.now() + '_' + safe;
    const { error: upErr } = await supabase.storage.from(BUCKET)
      .upload(path, buf, { contentType: file.type, upsert: false });
    if (upErr) return NextResponse.json({ error: 'upload failed' }, { status: 500 });
    rows.push({ request_id: r.id, doc_type: type, storage_path: path,
      original_name: safe, content_type: file.type, size_bytes: file.size });
  }
  await supabase.from('verification_documents').insert(rows);
  await supabase.from('verification_requests')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', r.id);
  await supabase.from('activity_log').insert({
    action: 'verification_submitted', entity_type: 'verification_request',
    entity_id: r.id, details: { documents: rows.length } });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'NexaVision Verification <info@nexavisiongroup.com>',
      to: 'info@nexavisiongroup.com',
      subject: 'Identity verification submitted — review required',
      html: '<p>A customer submitted identity documents. Review request ' + r.id + ' in the admin portal.</p>',
    });
  } catch {}
  return NextResponse.json({ ok: true });
}