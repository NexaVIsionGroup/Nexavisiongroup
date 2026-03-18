import { createAdminClient } from '@/lib/supabase/server';

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';

export interface EmailMessage {
  id: string;
  thread_id: string;
  lead_id: string | null;
  direction: 'outbound' | 'inbound';
  from_email: string;
  to_email: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  resend_message_id: string | null;
  read: boolean;
  starred: boolean;
  folder: EmailFolder;
  has_attachments: boolean;
  is_draft: boolean;
  cc_emails: string[];
  bcc_emails: string[];
  created_at: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  s3_key: string;
  s3_url: string;
  created_at: string;
}

export interface EmailContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  category: 'customer' | 'vendor' | 'contractor' | 'subcontractor' | 'other';
  notes: string | null;
  starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailAccount {
  id?: string;
  email: string;
  display_name: string;
  color: string;
  initials: string;
}

const FALLBACK_ACCOUNTS: EmailAccount[] = [
  { email: 'hello@nexavisiongroup.com', display_name: 'NexaVision Group', color: '#00E5CC', initials: 'NV' },
];

let _cachedAccounts: EmailAccount[] | null = null;
let _cacheTime = 0;

export async function fetchEmailAccounts(): Promise<EmailAccount[]> {
  if (_cachedAccounts && Date.now() - _cacheTime < 60000) return _cachedAccounts;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('active', true)
      .order('is_default', { ascending: false })
      .order('email');
    if (error || !data?.length) return FALLBACK_ACCOUNTS;
    _cachedAccounts = data;
    _cacheTime = Date.now();
    return data;
  } catch {
    return FALLBACK_ACCOUNTS;
  }
}

export function getEmailAccountsCached(): EmailAccount[] {
  return _cachedAccounts || FALLBACK_ACCOUNTS;
}

export const DEFAULT_FROM_EMAIL = 'hello@nexavisiongroup.com';

export function getAccountConfig(email: string, accounts?: EmailAccount[]): EmailAccount {
  const list = accounts || _cachedAccounts || FALLBACK_ACCOUNTS;
  return list.find(a => a.email === email) || list[0];
}

export function getFromHeader(fromEmail: string, accounts?: EmailAccount[]): string {
  const account = getAccountConfig(fromEmail, accounts);
  return `${account.display_name} <${account.email}>`;
}

export async function logEmail(params: {
  thread_id?: string;
  lead_id?: string | null;
  direction: 'outbound' | 'inbound';
  from_email: string;
  to_email: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  resend_message_id?: string;
  folder?: EmailFolder;
  is_draft?: boolean;
  has_attachments?: boolean;
  cc_emails?: string[];
  bcc_emails?: string[];
  read?: boolean;
}): Promise<EmailMessage | null> {
  const supabase = createAdminClient();
  const folder = params.folder || (params.is_draft ? 'drafts' : params.direction === 'outbound' ? 'sent' : 'inbox');
  const { data, error } = await supabase
    .from('email_messages')
    .insert({
      thread_id: params.thread_id || undefined,
      lead_id: params.lead_id || null,
      direction: params.direction,
      from_email: params.from_email,
      to_email: params.to_email,
      subject: params.subject,
      body_html: params.body_html || null,
      body_text: params.body_text || null,
      resend_message_id: params.resend_message_id || null,
      read: params.read ?? (params.direction === 'outbound'),
      folder,
      is_draft: params.is_draft || false,
      has_attachments: params.has_attachments || false,
      cc_emails: params.cc_emails || [],
      bcc_emails: params.bcc_emails || [],
    })
    .select()
    .single();
  if (error) { console.error('Failed to log email:', error); return null; }
  return data as EmailMessage;
}

// NexaVision branded HTML email template
// Colors: void #050B18, teal #00E5CC, violet #7B5EA7, text #F0F4F8
export function buildEmailHtml(toName: string, bodyHtml: string, subject: string, fromEmail?: string): string {
  const account = getAccountConfig(fromEmail || DEFAULT_FROM_EMAIL);
  const sigEmail = account.email;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050B18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #050B18; }
      .body-cell { background-color: #0A1628 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#050B18;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050B18;">
  <tr>
    <td align="center" style="padding:32px 12px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Teal accent line -->
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#00E5CC,#7B5EA7);font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <!-- Header -->
        <tr>
          <td style="background-color:#0F1D32;padding:24px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#00E5CC;font-size:20px;font-weight:800;letter-spacing:-0.5px;">NexaVision</span>
                  <span style="color:#7B5EA7;font-size:20px;font-weight:800;letter-spacing:-0.5px;"> Group</span>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <span style="display:inline-block;border:1px solid #00E5CC;padding:4px 10px;color:#00E5CC;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Message</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Subject -->
        <tr>
          <td style="background-color:#162238;padding:18px 32px;">
            <p style="margin:0 0 4px;color:#00E5CC;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Subject</p>
            <p style="margin:0;color:#F0F4F8;font-size:18px;font-weight:700;line-height:1.3;">${subject}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td class="body-cell" style="background-color:#0A1628;padding:32px;">
            <p style="margin:0 0 16px;color:#F0F4F8;font-size:15px;font-weight:600;">Hi ${toName},</p>
            <div style="color:#8896A6;font-size:14px;line-height:1.75;margin:0 0 24px;">${bodyHtml}</div>
            <!-- Divider -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
              <tr>
                <td style="width:40px;height:2px;background-color:#00E5CC;font-size:0;line-height:0;">&nbsp;</td>
                <td style="height:1px;background-color:#162238;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
            <!-- Signature -->
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:3px;background:linear-gradient(180deg,#00E5CC,#7B5EA7);border-radius:2px;">&nbsp;</td>
                <td style="padding-left:12px;">
                  <p style="margin:0 0 2px;color:#F0F4F8;font-size:13px;font-weight:700;">NexaVision Group</p>
                  <p style="margin:0;color:#5A6A7E;font-size:11px;">Revenue Infrastructure for Service Businesses</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#0F1D32;padding:18px 32px;text-align:center;">
            <a href="mailto:${sigEmail}" style="color:#00E5CC;text-decoration:none;font-size:12px;font-weight:600;">${sigEmail}</a>
            <span style="color:#162238;font-size:12px;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
            <a href="https://nexavisiongroup.com" style="color:#00E5CC;text-decoration:none;font-size:12px;font-weight:600;">nexavisiongroup.com</a>
          </td>
        </tr>
        <!-- Bottom accent -->
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#7B5EA7,#00E5CC);font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}
