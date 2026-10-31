// Nexa Video — private Android media-center app for the owner + friends. Server-only helpers.
// Invite-only accounts (same pattern as the /vm cloud-phone users): the admin makes a link, the person
// picks a username + password at /nexavideo/i/<code>, then downloads the APK and signs in inside the app.
// Web session = cookie; the app gets a bearer token. Both are HMAC-signed blobs carrying only the user id,
// and every request re-reads the row, so turning an account off cuts both the website and the app.
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { hashPassword, verifyPassword, sha256, newToken, cleanUsername, USERNAME_RE } from "@/lib/vm";

export { hashPassword, verifyPassword, sha256, newToken, cleanUsername, USERNAME_RE };
export const NV_COOKIE = "nexavideo_session";
export const BUCKET = "nexavideo";
const WEB_DAYS = 30, APP_DAYS = 365;

export type NvUser = {
  id: string; label: string; username: string | null; password_hash: string | null; enabled: boolean;
  token_hash: string | null; token_kind: "invite" | "reset" | null; token_expires: string | null;
  failed_logins: number; locked_until: string | null; created_at: string; signed_up_at: string | null;
  last_login_at: string | null; last_seen_at: string | null; app_version: string | null; device: string | null;
  downloads: number;
};
export type NvRelease = {
  id: string; version_code: number; version_name: string; notes: string; storage_path: string;
  size_bytes: number | null; created_at: string;
};

export const db = () => createAdminClient();

// Separate key from the /vm sessions (domain-separated from the same server secret) so a cloud-phone cookie
// can never be replayed here and vice versa.
const secret = () => `${process.env.VM_SESSION_SECRET || ""}:nexavideo`;

function sign(obj: object): string {
  const payload = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}
function read(blob: string | undefined | null): { uid: string; k: string; exp: number } | null {
  if (!blob || !blob.includes(".") || !process.env.VM_SESSION_SECRET) return null;
  const [payload, sig] = blob.split(".");
  const want = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof o.exp === "number" && o.exp > Date.now() / 1000 && typeof o.uid === "string" ? o : null;
  } catch { return null; }
}

/** kind "web" = download-page cookie (30 days), "app" = the app's bearer token (1 year, re-checked on every launch) */
export function mint(uid: string, kind: "web" | "app") {
  const maxAge = (kind === "app" ? APP_DAYS : WEB_DAYS) * 86400;
  return { value: sign({ uid, k: kind, exp: Math.floor(Date.now() / 1000) + maxAge }), maxAge };
}

export async function userFrom(token: string | undefined | null): Promise<NvUser | null> {
  const s = read(token);
  if (!s) return null;
  const { data } = await db().from("nexavideo_users").select("*").eq("id", s.uid).maybeSingle();
  const u = data as NvUser | null;
  return u && u.enabled && u.username ? u : null;
}

/** app requests carry "Authorization: Bearer <token>"; the download link may carry ?t=<token> instead */
export function bearer(h: Headers, q?: string | null) {
  const a = h.get("authorization") || "";
  return a.toLowerCase().startsWith("bearer ") ? a.slice(7).trim() : q || null;
}

export async function latestRelease(): Promise<NvRelease | null> {
  const { data } = await db().from("nexavideo_releases").select("*").order("version_code", { ascending: false }).limit(1).maybeSingle();
  return (data as NvRelease | null) || null;
}

/** short-lived signed URL for the newest APK (the bucket is private) */
export async function downloadUrl(r: NvRelease): Promise<string | null> {
  const name = `NexaVideo-${r.version_name}.apk`;
  const { data } = await db().storage.from(BUCKET).createSignedUrl(r.storage_path, 300, { download: name });
  return data?.signedUrl || null;
}
