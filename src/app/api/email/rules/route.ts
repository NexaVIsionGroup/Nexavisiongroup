import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getRules, saveRules, normalizePattern } from '@/lib/emailRules';

// Sender rules (blocked senders). Auth: middleware requires a Supabase session for /api/email/*.
//   GET                                   → { blocked: ["user@domain", "@domain"] }
//   POST { action: "block", pattern }     → adds the pattern and moves that sender's existing mail to Spam
//   POST { action: "unblock", pattern }   → removes it (existing mail stays where it is)
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getRules());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pattern = normalizePattern(body.pattern);
  if (!pattern.includes('@') || pattern.length < 3) return NextResponse.json({ error: 'Give an email address or @domain.' }, { status: 400 });
  const rules = await getRules();

  if (body.action === 'unblock') {
    await saveRules({ blocked: rules.blocked.filter((b) => b !== pattern) });
    return NextResponse.json({ ok: true, blocked: (await getRules()).blocked });
  }
  if (body.action !== 'block') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  await saveRules({ blocked: [...rules.blocked, pattern] });
  // existing mail from that sender → Spam (never touch Trash or our own sent mail)
  let q = createAdminClient().from('email_messages').update({ folder: 'spam' }).eq('direction', 'inbound').not('folder', 'in', '("trash","spam")');
  q = pattern.startsWith('@') ? q.ilike('from_email', `%${pattern}`) : q.ilike('from_email', pattern);
  const { data, error } = await q.select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, moved: data?.length || 0, blocked: (await getRules()).blocked });
}
