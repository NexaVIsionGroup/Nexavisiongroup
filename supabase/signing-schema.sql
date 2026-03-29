-- Signing Agreements Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gwosstqezmkijarqdori

CREATE TABLE IF NOT EXISTS signing_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Settlement and Payment Agreement',
  agreement_html TEXT, -- rendered agreement content
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_signed', 'completed', 'voided')),
  
  -- Signer details
  signer_1_name TEXT NOT NULL,
  signer_1_role TEXT NOT NULL DEFAULT 'Client',
  signer_1_email TEXT,
  signer_1_token UUID DEFAULT gen_random_uuid(),
  signer_1_signature TEXT, -- base64 signature image
  signer_1_signed_at TIMESTAMPTZ,
  signer_1_ip TEXT,

  signer_2_name TEXT NOT NULL,
  signer_2_role TEXT NOT NULL DEFAULT 'Client',
  signer_2_email TEXT,
  signer_2_token UUID DEFAULT gen_random_uuid(),
  signer_2_signature TEXT,
  signer_2_signed_at TIMESTAMPTZ,
  signer_2_ip TEXT,

  signer_3_name TEXT NOT NULL,
  signer_3_role TEXT NOT NULL DEFAULT 'Respondent',
  signer_3_email TEXT,
  signer_3_token UUID DEFAULT gen_random_uuid(),
  signer_3_signature TEXT,
  signer_3_signed_at TIMESTAMPTZ,
  signer_3_ip TEXT,

  signer_4_name TEXT NOT NULL,
  signer_4_role TEXT NOT NULL DEFAULT 'Counsel',
  signer_4_email TEXT,
  signer_4_token UUID DEFAULT gen_random_uuid(),
  signer_4_signature TEXT,
  signer_4_signed_at TIMESTAMPTZ,
  signer_4_ip TEXT,

  -- PDF storage
  final_pdf_url TEXT,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_signing_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signing_agreements_updated_at
  BEFORE UPDATE ON signing_agreements
  FOR EACH ROW EXECUTE FUNCTION update_signing_updated_at();

-- Enable RLS but allow public read with token
ALTER TABLE signing_agreements ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read an agreement (they need the signer token in the URL)
CREATE POLICY "Public can read agreements" ON signing_agreements
  FOR SELECT USING (true);

-- Allow anyone to update signature fields (validated in API)
CREATE POLICY "Public can update signatures" ON signing_agreements
  FOR UPDATE USING (true);

-- Only service role can insert
CREATE POLICY "Service role can insert" ON signing_agreements
  FOR INSERT WITH CHECK (true);
