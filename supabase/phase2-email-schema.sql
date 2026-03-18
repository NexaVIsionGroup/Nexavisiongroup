-- ═══════════════════════════════════════════════════════════
-- NexaVision Admin — Phase 2: Email System Schema
-- ═══════════════════════════════════════════════════════════

CREATE TABLE email_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#00E5CC',
  initials TEXT NOT NULL DEFAULT 'NV',
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE email_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID DEFAULT gen_random_uuid(),
  lead_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '(no subject)',
  body_html TEXT,
  body_text TEXT,
  resend_message_id TEXT,
  read BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'inbox' CHECK (folder IN ('inbox', 'sent', 'drafts', 'trash', 'spam')),
  has_attachments BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  cc_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  bcc_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE email_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  s3_key TEXT,
  s3_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE email_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('customer', 'vendor', 'contractor', 'subcontractor', 'other')),
  notes TEXT,
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX idx_email_messages_folder ON email_messages(folder);
CREATE INDEX idx_email_messages_from ON email_messages(from_email);
CREATE INDEX idx_email_messages_to ON email_messages(to_email);
CREATE INDEX idx_email_messages_created ON email_messages(created_at DESC);
CREATE INDEX idx_email_attachments_message ON email_attachments(message_id);
CREATE INDEX idx_email_contacts_email ON email_contacts(email);

-- RLS
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_accounts_auth ON email_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY email_messages_auth ON email_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY email_attachments_auth ON email_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY email_contacts_auth ON email_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default email account
INSERT INTO email_accounts (email, display_name, color, initials, is_default)
VALUES ('hello@nexavisiongroup.com', 'NexaVision Group', '#00E5CC', 'NV', true);
