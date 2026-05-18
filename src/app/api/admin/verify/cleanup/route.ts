import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Scheduled cleanup. Protect with CRON_SECRET (Vercel Cron sends it as a
// Bearer token). Deletes Storage objects for decided requests older than
// 90 days, then purges the matching DB rows via purge_old_verifications().
const BUCKET = 'verification-docs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.CRON_SECRET || auth !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: old } = await supabase.from('verification_requests')
    .select('id').in('status', ['approved','rejected','expired'])
    .not('reviewed_at', 'is', null).lt('reviewed_at', cutoff);
  const ids = (old || []).map((o: any) => o.id);
  let removed = 0;
  for (const id of ids) {
    const { data: docs } = await supabase.from('verification_documents')
      .select('storage_path').eq('request_id', id);
    const paths = (docs || []).map((d: any) => d.storage_path);
    if (paths.length) { await supabase.storage.from(BUCKET).remove(paths); removed += paths.length; }
  }
  await supabase.rpc('purge_old_verifications');
  return NextResponse.json({ ok: true, requests: ids.length, files_removed: removed });
}