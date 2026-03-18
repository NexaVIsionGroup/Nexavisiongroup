import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') || 'inbox';
  const account = searchParams.get('account') || null;

  const { threads, folderCounts } = await buildThreadQuery(supabase, folder, account);
  return NextResponse.json({ threads, folderCounts });
}

async function buildThreadQuery(
  supabase: ReturnType<typeof createAdminClient>,
  folder: string,
  account: string | null
) {
  let query = supabase
    .from('email_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (folder === 'trash') query = query.eq('folder', 'trash');
  else if (folder === 'drafts') query = query.eq('is_draft', true).neq('folder', 'trash');
  else if (folder === 'starred') query = query.eq('starred', true).neq('folder', 'trash');
  else if (folder === 'sent') query = query.eq('direction', 'outbound').eq('is_draft', false).neq('folder', 'trash');
  else if (folder === 'spam') query = query.eq('folder', 'spam');
  else query = query.eq('is_draft', false).not('folder', 'in', '("trash","spam")');

  const { data: rawMessages, error } = await query;
  if (error) return { threads: [], folderCounts: {} };

  const messages = account
    ? (rawMessages || []).filter(msg => {
        if (folder === 'inbox') return msg.to_email === account;
        if (folder === 'sent') return msg.from_email === account;
        return msg.from_email === account || msg.to_email === account;
      })
    : (rawMessages || []);

  // Folder counts
  const { data: allMessages } = await supabase
    .from('email_messages')
    .select('folder, is_draft, starred, read, direction, from_email, to_email');

  const countMessages = account
    ? (allMessages || []).filter(msg => {
        if (msg.direction === 'inbound') return msg.to_email === account;
        if (msg.direction === 'outbound') return msg.from_email === account;
        return msg.from_email === account || msg.to_email === account;
      })
    : (allMessages || []);

  const folderCounts: Record<string, number> = { inbox: 0, sent: 0, starred: 0, drafts: 0, trash: 0, spam: 0 };
  for (const msg of countMessages) {
    if (msg.is_draft && msg.folder !== 'trash') folderCounts.drafts++;
    if (msg.starred && msg.folder !== 'trash') folderCounts.starred++;
    if (msg.folder === 'trash') folderCounts.trash++;
    if (msg.folder === 'spam') folderCounts.spam++;
    if (!msg.read && msg.folder === 'inbox' && !msg.is_draft) folderCounts.inbox++;
    if (msg.direction === 'outbound' && !msg.is_draft && msg.folder !== 'trash') folderCounts.sent++;
  }

  type ThreadEntry = {
    thread_id: string; subject: string; to_email: string; from_email: string;
    latest_message: string; latest_body_preview: string; latest_direction: string;
    message_count: number; unread_count: number; starred: boolean;
    has_attachments: boolean; lead_id: string | null; created_at: string;
    has_inbound: boolean;
  };
  const threadMap = new Map<string, ThreadEntry>();

  for (const msg of messages) {
    if (!threadMap.has(msg.thread_id)) {
      const plainText = msg.body_text || (msg.body_html || '').replace(/<[^>]+>/g, '');
      threadMap.set(msg.thread_id, {
        thread_id: msg.thread_id,
        subject: msg.subject,
        to_email: msg.direction === 'outbound' ? msg.to_email : msg.from_email,
        from_email: msg.direction === 'outbound' ? msg.from_email : msg.to_email,
        latest_message: msg.created_at,
        latest_body_preview: plainText.substring(0, 120),
        latest_direction: msg.direction,
        message_count: 0, unread_count: 0,
        starred: !!msg.starred, has_attachments: !!msg.has_attachments,
        lead_id: msg.lead_id, created_at: msg.created_at,
        has_inbound: msg.direction === 'inbound',
      });
    }
    const thread = threadMap.get(msg.thread_id)!;
    thread.message_count++;
    if (!msg.read) thread.unread_count++;
    if (msg.starred) thread.starred = true;
    if (msg.has_attachments) thread.has_attachments = true;
    if (msg.direction === 'inbound') thread.has_inbound = true;
  }

  if (folder === 'inbox') {
    for (const [id, t] of threadMap) {
      if (!t.has_inbound) threadMap.delete(id);
    }
  }

  const threads = [...threadMap.values()].sort(
    (a, b) => new Date(b.latest_message).getTime() - new Date(a.latest_message).getTime()
  );
  return { threads, folderCounts };
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { thread_id, account } = body;
  if (!thread_id) return NextResponse.json({ error: 'Missing thread_id' }, { status: 400 });

  if (account) {
    const { data: msgs } = await supabase
      .from('email_messages').select('id, from_email, to_email').eq('thread_id', thread_id);
    const ids = (msgs || []).filter(m => m.from_email === account || m.to_email === account).map(m => m.id);
    if (ids.length) await supabase.from('email_messages').update({ read: true }).in('id', ids);
  } else {
    await supabase.from('email_messages').update({ read: true }).eq('thread_id', thread_id);
  }

  const { data: allMsgs } = await supabase
    .from('email_messages').select('*').eq('thread_id', thread_id).order('created_at', { ascending: true });

  const messages = account
    ? (allMsgs || []).filter(m => m.from_email === account || m.to_email === account)
    : (allMsgs || []);

  const messageIds = messages.map(m => m.id);
  const { data: attachments } = await supabase.from('email_attachments').select('*').in('message_id', messageIds);
  const attMap = new Map<string, typeof attachments>();
  for (const att of attachments || []) {
    if (!attMap.has(att.message_id)) attMap.set(att.message_id, []);
    attMap.get(att.message_id)!.push(att);
  }
  return NextResponse.json({ messages: messages.map(m => ({ ...m, attachments: attMap.get(m.id) || [] })) });
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const { thread_ids, action, value, account } = await req.json();
  if (!thread_ids?.length || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const updateMap: Record<string, Record<string, unknown>> = {
    star: { starred: true }, unstar: { starred: false },
    trash: { folder: 'trash' }, restore: { folder: 'inbox' },
    spam: { folder: 'spam' }, mark_read: { read: true }, mark_unread: { read: false },
  };
  const update = action === 'move' && value ? { folder: value } : (updateMap[action] || {});

  if (account) {
    const { data: msgs } = await supabase
      .from('email_messages').select('id, from_email, to_email').in('thread_id', thread_ids);
    const ids = (msgs || []).filter(m => m.from_email === account || m.to_email === account).map(m => m.id);
    if (ids.length) await supabase.from('email_messages').update(update).in('id', ids);
  } else {
    await supabase.from('email_messages').update(update).in('thread_id', thread_ids);
  }
  return NextResponse.json({ updated: thread_ids.length });
}

export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { thread_ids, account } = await req.json();
  if (!thread_ids?.length) return NextResponse.json({ error: 'No thread_ids' }, { status: 400 });

  if (account) {
    const { data: msgs } = await supabase
      .from('email_messages').select('id, from_email, to_email').in('thread_id', thread_ids);
    const ids = (msgs || []).filter(m => m.from_email === account || m.to_email === account).map(m => m.id);
    if (ids.length) await supabase.from('email_messages').delete().in('id', ids);
  } else {
    await supabase.from('email_messages').delete().in('thread_id', thread_ids);
  }
  return NextResponse.json({ deleted: thread_ids.length });
}
