import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - list all agreements
export async function GET() {
  const { data, error } = await supabase
    .from('signing_agreements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agreements: data })
}

// POST - create new agreement
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('signing_agreements')
    .insert({
      title: body.title || 'Settlement and Payment Agreement',
      signer_1_name: body.signer1Name,
      signer_1_role: body.signer1Role || 'Client',
      signer_2_name: body.signer2Name,
      signer_2_role: body.signer2Role || 'Client',
      signer_3_name: body.signer3Name,
      signer_3_role: body.signer3Role || 'Respondent',
      signer_4_name: body.signer4Name,
      signer_4_role: body.signer4Role || 'Counsel',
      created_by: 'admin',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agreement: data, link: `https://nexavisiongroup.com/sign/${data.id}` })
}

// DELETE - remove agreement
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('signing_agreements')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
