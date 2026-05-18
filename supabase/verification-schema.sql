-- ═══════════════════════════════════════════════════════════
-- NexaVision Admin — Customer Identity Verification Schema
-- Run in Supabase SQL Editor AFTER phase1-schema.sql
-- ═══════════════════════════════════════════════════════════
-- SECURITY:
--  * Create a PRIVATE Storage bucket named 'verification-docs' (NOT public).
--  * Documents are reached only server-side (service role) via short-lived
--    signed URLs for admin review. RLS is ON with no anon/auth policies,
--    so the public keys cannot read these tables at all.
--  * Retention: purge_old_verifications() removes decided requests after
--    90 days; delete the matching Storage objects in the same scheduled job.
--  * Every create / submit / view / decision is written to activity_log.

CREATE TABLE verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','submitted','approved','rejected','expired')),
  created_by TEXT,
  reviewed_by TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE TABLE verification_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('gov_id','selfie','supporting')),
  storage_path TEXT NOT NULL,
  original_name TEXT,
  content_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_verif_req_token ON verification_requests(token);
CREATE INDEX idx_verif_req_customer ON verification_requests(customer_id);
CREATE INDEX idx_verif_req_status ON verification_requests(status);
CREATE INDEX idx_verif_docs_request ON verification_documents(request_id);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
-- Intentionally NO anon/authenticated policies: all access is server-side
-- via the service role, exactly like the rest of this admin app.

CREATE OR REPLACE FUNCTION purge_old_verifications() RETURNS void AS $$
  DELETE FROM verification_requests
  WHERE status IN ('approved','rejected','expired')
    AND reviewed_at IS NOT NULL
    AND reviewed_at < now() - interval '90 days';
$$ LANGUAGE sql;