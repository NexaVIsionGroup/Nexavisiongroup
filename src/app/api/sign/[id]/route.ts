import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// GET - fetch current agreement state (for polling)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data: agreement, error } = await supabase
    .from('signing_agreements')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !agreement) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const res = NextResponse.json({ agreement })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return res
}

// POST - submit a signature
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { signerNumber, signature } = await req.json()

    if (!signerNumber || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: agreement, error: fetchErr } = await supabase
      .from('signing_agreements')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchErr || !agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    if (agreement[`signer_${signerNumber}_signature`]) {
      return NextResponse.json({ error: 'This party has already signed' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const updateData: Record<string, any> = {
      [`signer_${signerNumber}_signature`]: signature,
      [`signer_${signerNumber}_signed_at`]: new Date().toISOString(),
      [`signer_${signerNumber}_ip`]: ip,
    }

    // Check if all will be signed after this
    let allSigned = true
    for (let i = 1; i <= 4; i++) {
      if (i === signerNumber) continue
      if (!agreement[`signer_${i}_signature`]) { allSigned = false; break }
    }
    updateData.status = allSigned ? 'completed' : 'partially_signed'

    const { data: updated, error: updateErr } = await supabase
      .from('signing_agreements')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
    }

    // Email notification
    try {
      const signerName = agreement[`signer_${signerNumber}_name`]
      await resend.emails.send({
        from: 'Belanger & Associates <signing@nexavisiongroup.com>',
        to: 'pierce@belangerassociates.com',
        subject: allSigned 
          ? `All Signatures Complete - ${agreement.title}`
          : `Signature Received - ${signerName}`,
        html: `<div style="font-family:Arial;max-width:600px">
          <div style="background:#1B2A4A;color:white;padding:16px 24px">
            <h2 style="margin:0;font-size:18px">Belanger &amp; Associates</h2>
            <p style="margin:4px 0 0;color:#C9A84C;font-size:12px">ATTORNEYS AT LAW</p>
          </div>
          <div style="padding:24px;border:1px solid #ddd">
            <p><strong>${signerName}</strong> has signed the Settlement Agreement.</p>
            <p>Status: <strong>${allSigned ? 'ALL SIGNATURES COMPLETE' : 'Partially Signed'}</strong></p>
            <p style="font-size:12px;color:#888;margin-top:16px">
              Signed at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
            </p>
          </div></div>`,
      })
    } catch (emailErr) {
      console.error('Email failed:', emailErr)
    }

    return NextResponse.json({ success: true, allSigned, agreement: updated })
  } catch (err: any) {
    console.error('Sign API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
