import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Simple auth check — require a secret header
    const authHeader = req.headers.get('x-admin-key')
    if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const { data, error } = await supabase
      .from('signing_agreements')
      .insert({
        title: body.title || 'Settlement and Payment Agreement',
        signer_1_name: body.signer1Name || 'Richard Robertson',
        signer_1_role: body.signer1Role || 'Client',
        signer_1_email: body.signer1Email || null,
        signer_2_name: body.signer2Name || 'Linda Alton',
        signer_2_role: body.signer2Role || 'Client',
        signer_2_email: body.signer2Email || null,
        signer_3_name: body.signer3Name || 'Mitchell Carolan',
        signer_3_role: body.signer3Role || 'Respondent',
        signer_3_email: body.signer3Email || null,
        signer_4_name: body.signer4Name || 'Michael Pierce, Esq.',
        signer_4_role: body.signer4Role || 'Counsel for Clients',
        signer_4_email: body.signer4Email || null,
        created_by: 'admin',
      })
      .select()
      .single()

    if (error) {
      console.error('Create agreement error:', error)
      return NextResponse.json({ error: 'Failed to create agreement' }, { status: 500 })
    }

    // Build signing links
    const baseUrl = 'https://nexavisiongroup.com/sign'
    const links = {
      agreementId: data.id,
      viewOnly: `${baseUrl}/${data.id}`,
      signer1: `${baseUrl}/${data.id}?token=${data.signer_1_token}`,
      signer2: `${baseUrl}/${data.id}?token=${data.signer_2_token}`,
      signer3: `${baseUrl}/${data.id}?token=${data.signer_3_token}`,
      signer4: `${baseUrl}/${data.id}?token=${data.signer_4_token}`,
    }

    return NextResponse.json({ success: true, agreement: data, links })
  } catch (err: any) {
    console.error('Create API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
