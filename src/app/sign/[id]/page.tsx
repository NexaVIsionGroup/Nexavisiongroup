import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import SigningClient from './SigningClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function SignPage({ params }: { params: { id: string } }) {
  // Force dynamic by reading headers
  headers()
  
  const { data: agreement } = await supabase
    .from('signing_agreements')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!agreement) return notFound()

  return <SigningClient agreement={agreement} />
}
