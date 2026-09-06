-- ═══════════════════════════════════════════════════════════
-- NexaVision Admin — Shared Client Documents (HTML) Schema
-- Run in Supabase SQL Editor AFTER phase1-schema.sql
-- ═══════════════════════════════════════════════════════════
-- WHAT THIS IS:
--  Fancy interactive HTML documents (proposals, reports, case studies)
--  uploaded in the admin app and shared with clients at
--  https://nexavisiongroup.com/d/<slug>
--
-- SECURITY:
--  * Create a PRIVATE Storage bucket named 'client-docs' (NOT public).
--    The HTML never has a public storage URL — it is streamed by
--    /d/[slug]/view server-side so links can be revoked, expired and counted.
--  * The served HTML runs under a CSP `sandbox` (opaque origin), so a
--    document can never read admin cookies or call /api/admin/* .
--  * RLS is ON with no anon/authenticated policies — all access is
--    server-side via the service role, like the rest of this admin app.

CREATE TABLE shared_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  original_name TEXT,
  content_type TEXT DEFAULT 'text/html',
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','disabled')),
  password_hash TEXT,                     -- scrypt$<salt>$<hash>, NULL = no password
  expires_at TIMESTAMPTZ,                 -- NULL = never expires
  show_toolbar BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shared_document_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES shared_documents(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_shared_docs_slug ON shared_documents(slug);
CREATE INDEX idx_shared_docs_status ON shared_documents(status);
CREATE INDEX idx_shared_docs_customer ON shared_documents(customer_id);
CREATE INDEX idx_shared_doc_views_doc ON shared_document_views(document_id);
CREATE INDEX idx_shared_doc_views_time ON shared_document_views(viewed_at DESC);

ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_document_views ENABLE ROW LEVEL SECURITY;
-- Intentionally NO anon/authenticated policies.

-- Atomic view counter (called by /d/[slug]/view)
CREATE OR REPLACE FUNCTION increment_document_view(doc_id UUID) RETURNS void AS $$
  UPDATE shared_documents
     SET view_count = view_count + 1,
         last_viewed_at = now()
   WHERE id = doc_id;
$$ LANGUAGE sql;

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_shared_document() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_shared_document
  BEFORE UPDATE ON shared_documents
  FOR EACH ROW EXECUTE FUNCTION touch_shared_document();
