import { createAdminClient } from "@/lib/supabase/server";

/**
 * Email attachments live in the private Supabase bucket `email-attachments` as
 * `<message_id>/<filename>`; each file has a row in `email_attachments` (s3_key = storage path).
 * Links handed to the app are signed URLs (7 days), made when a conversation is opened.
 *
 * Inbound: Resend keeps the files ~1 h behind a signed download_url
 *   (GET /emails/receiving/{email_id}/attachments → data[].download_url), so the webhook copies
 *   them here right away. Outbound: the base64 the composer sent to Resend is stored too, so the
 *   Sent copy shows the same files.
 */
export const ATTACHMENTS_BUCKET = "email-attachments";
const MAX_BYTES = 25 * 1024 * 1024;
const SIGNED_TTL = 60 * 60 * 24 * 7;

export type StoredAttachment = {
  id: string; message_id: string; filename: string; content_type: string; size_bytes: number;
  s3_key: string; s3_url: string;
};

const safeName = (name: string) => (name || "attachment").replace(/[^\w.\-() ]+/g, "_").slice(0, 120);

async function store(messageId: string, filename: string, contentType: string, bytes: Uint8Array) {
  const supabase = createAdminClient();
  const path = `${messageId}/${Date.now().toString(36)}-${safeName(filename)}`;
  const { error: upErr } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, bytes, { contentType: contentType || "application/octet-stream", upsert: false });
  if (upErr) throw new Error(`upload ${filename}: ${upErr.message}`);
  const { error } = await supabase.from("email_attachments").insert({
    message_id: messageId, filename: filename || "attachment", content_type: contentType || "application/octet-stream",
    size_bytes: bytes.byteLength, s3_key: path, s3_url: "",
  });
  if (error) throw new Error(`row ${filename}: ${error.message}`);
}

async function markHasAttachments(messageId: string) {
  await createAdminClient().from("email_messages").update({ has_attachments: true }).eq("id", messageId);
}

/** Copy a received email's attachments from Resend into our bucket. Returns how many were saved. */
export async function ingestInboundAttachments(resendEmailId: string, messageId: string): Promise<number> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return 0;
  const r = await fetch(`https://api.resend.com/emails/receiving/${resendEmailId}/attachments`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`resend attachments list ${r.status}`);
  const list = (await r.json()) as { data?: { id: string; filename: string; content_type: string; size: number; download_url: string }[] };
  let saved = 0;
  for (const a of list.data || []) {
    try {
      if (a.size > MAX_BYTES || !a.download_url) continue;
      const f = await fetch(a.download_url);
      if (!f.ok) throw new Error(`download ${f.status}`);
      const bytes = new Uint8Array(await f.arrayBuffer());
      await store(messageId, a.filename, a.content_type, bytes);
      saved++;
    } catch (e) {
      console.error("attachment ingest failed:", a.filename, e);
    }
  }
  if (saved) await markHasAttachments(messageId);
  return saved;
}

/** Keep the files the composer sent (base64) with the Sent copy. */
export async function storeOutboundAttachments(
  messageId: string,
  attachments: { filename: string; content: string; type?: string }[] | undefined,
): Promise<number> {
  let saved = 0;
  for (const a of attachments || []) {
    try {
      if (!a?.content) continue;
      const bytes = new Uint8Array(Buffer.from(a.content, "base64"));
      if (bytes.byteLength > MAX_BYTES) continue;
      await store(messageId, a.filename, a.type || "application/octet-stream", bytes);
      saved++;
    } catch (e) {
      console.error("outbound attachment store failed:", a?.filename, e);
    }
  }
  if (saved) await markHasAttachments(messageId);
  return saved;
}

/** Fill s3_url with a signed link for every row stored in our bucket (older rows with a real URL are left alone). */
export async function signAttachmentUrls<T extends { s3_key: string | null; s3_url: string | null }>(rows: T[]): Promise<T[]> {
  const ours = rows.filter((r) => r.s3_key && !/^https?:\/\//.test(r.s3_url || ""));
  if (!ours.length) return rows;
  const supabase = createAdminClient();
  const { data } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrls(ours.map((r) => r.s3_key as string), SIGNED_TTL);
  const byPath = new Map((data || []).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => (r.s3_key && byPath.get(r.s3_key) ? { ...r, s3_url: byPath.get(r.s3_key) as string } : r));
}
