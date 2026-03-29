import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SigningClient from './SigningClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function SignPage({ params, searchParams }: { 
  params: { id: string }, 
  searchParams: { token?: string } 
}) {
  const { data: agreement } = await supabase
    .from('signing_agreements')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!agreement) return notFound()

  const token = searchParams.token
  let signerNumber: number | null = null

  if (token) {
    for (let i = 1; i <= 4; i++) {
      if (agreement[`signer_${i}_token`] === token) {
        signerNumber = i
        break
      }
    }
  }

  return (
    <SigningClient 
      agreement={agreement} 
      signerNumber={signerNumber}
      token={token || null}
    />
  )
}
