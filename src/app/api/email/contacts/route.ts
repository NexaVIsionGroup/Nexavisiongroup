import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  let query = supabase.from('email_contacts').select('*').order('name');
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { action, contact } = body;

  if (action === 'delete') {
    const { error } = await supabase.from('email_contacts').delete().eq('id', contact.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'update') {
    const { data, error } = await supabase
      .from('email_contacts')
      .update({ name: contact.name, email: contact.email, phone: contact.phone || null, company: contact.company || null, category: contact.category, notes: contact.notes || null, updated_at: new Date().toISOString() })
      .eq('id', contact.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data });
  }

  const { data, error } = await supabase
    .from('email_contacts')
    .insert({ name: contact.name, email: contact.email, phone: contact.phone || null, company: contact.company || null, category: contact.category || 'other', notes: contact.notes || null })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}
