import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { token, signerNumber, signature } = await req.json()
    
    if (!token || !signerNumber || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the token matches this signer
    const { data: agreement, error: fetchErr } = await supabase
      .from('signing_agreements')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchErr || !agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    // Validate token
    const tokenField = `signer_${signerNumber}_token`
    if (agreement[tokenField] !== token) {
      return NextResponse.json({ error: 'Invalid signing token' }, { status: 403 })
    }

    // Check if already signed
    if (agreement[`signer_${signerNumber}_signature`]) {
      return NextResponse.json({ error: 'Already signed' }, { status: 400 })
    }

    // Get IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Save signature
    const updateData: Record<string, any> = {
      [`signer_${signerNumber}_signature`]: signature,
      [`signer_${signerNumber}_signed_at`]: new Date().toISOString(),
      [`signer_${signerNumber}_ip`]: ip,
    }

    // Check if all signers have now signed
    let allSigned = true
    for (let i = 1; i <= 4; i++) {
      if (i === signerNumber) continue // this one is signing now
      if (!agreement[`signer_${i}_signature`]) {
        allSigned = false
        break
      }
    }

    updateData.status = allSigned ? 'completed' : 'partially_signed'

    const { error: updateErr } = await supabase
      .from('signing_agreements')
      .update(updateData)
      .eq('id', params.id)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
    }

    // Send notification email to attorney
    try {
      const signerName = agreement[`signer_${signerNumber}_name`]
      await resend.emails.send({
        from: 'Belanger & Associates <signing@nexavisiongroup.com>',
        to: 'pierce@belangerassociates.com',
        replyTo: 'pierce@belangerassociates.com',
        subject: allSigned 
          ? `✓ All Signatures Complete — ${agreement.title}`
          : `Signature Received — ${signerName} signed ${agreement.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background: #1B2A4A; color: white; padding: 16px 24px;">
              <h2 style="margin: 0; font-size: 18px;">Belanger & Associates</h2>
              <p style="margin: 4px 0 0; color: #C9A84C; font-size: 12px;">ATTORNEYS AT LAW</p>
            </div>
            <div style="padding: 24px; border: 1px solid #ddd;">
              <p><strong>${signerName}</strong> has signed the <em>${agreement.title}</em>.</p>
              <p>Status: <strong>${allSigned ? 'ALL SIGNATURES COMPLETE' : 'Partially Signed'}</strong></p>
              <p style="margin-top: 16px;">
                <a href="https://nexavisiongroup.com/sign/${params.id}" 
                   style="background: #1B2A4A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                  View Agreement
                </a>
              </p>
              <p style="font-size: 12px; color: #888; margin-top: 16px;">
                Signed at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST<br/>
                IP: ${ip}
              </p>
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr)
      // Don't fail the signature save if email fails
    }

    return NextResponse.json({ 
      success: true, 
      allSigned,
      message: allSigned ? 'All signatures complete' : 'Signature saved' 
    })
  } catch (err: any) {
    console.error('Sign API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
