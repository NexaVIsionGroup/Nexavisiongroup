-- Customer proposals: one private link that takes a customer from proposal to signed contract.
-- Run once. Later phases add project tables that reference proposals(id).
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','signed','declined')),
  division TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  client_name TEXT,
  client_company TEXT,
  client_email TEXT,
  client_phone TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  link_enabled BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  seconds_viewed INTEGER NOT NULL DEFAULT 0,
  -- Signature: written once, never edited.
  signed_at TIMESTAMPTZ,
  signed_name TEXT,
  signed_title TEXT,
  signature_data TEXT,
  signer_ip TEXT,
  signer_user_agent TEXT,
  signed_snapshot JSONB,
  signed_hash TEXT,
  selected_package_id TEXT,
  -- Payment (only when the proposal asks for money at signing)
  due_amount NUMERIC(12,2),
  invoice_number TEXT,
  pay_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS proposal_events_idx ON proposal_events(proposal_id, created_at DESC);

-- Service role only. The public pages go through the API, which sends a whitelisted copy.
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;
