// Virtual cloud phones ("VM phones") — server-only helpers.
// Rack side: Windows-native Android emulators; each phone has a PRIVATE signalling instance
// behind its own gated hostname (vmN.nexavisiongroup.com, nexa-gate Worker, per-phone token).
// A VM user signs in at /vm with username+password; the account decides which phone opens.
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export const VM_PHONES: Record<string, { host: string; label: string }> = {
  phone1: { host: "vm1.nexavisiongroup.com", label: "Cloud Phone 1" },
  phone2: { host: "vm2.nexavisiongroup.com", label: "Cloud Phone 2" },
  phone3: { host: "vm3.nexavisiongroup.com", label: "Cloud Phone 3" },
};
export const VM_COOKIE = "vm_session";
const SESSION_DAYS = 30;

export type VmUser = {
  id: string; label: string; username: string | null; password_hash: string | null;
  phone_id: string | null; enabled: boolean; token_hash: string | null;
  token_kind: "invite" | "reset" | null; token_expires: string | null;
  failed_logins: number; locked_until: string | null; created_at: string;
  signed_up_at: string | null; last_login_at: string | null;
};

export const db = () => createAdminClient();

// ---- passwords (scrypt) ------------------------------------------------------------
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [s, h] = stored.split(":");
  const want = Buffer.from(h, "hex");
  if (!want.length) return false;
  const got = crypto.scryptSync(pw, Buffer.from(s, "hex"), want.length);
  return crypto.timingSafeEqual(want, got);
}

// ---- one-time tokens (invite / reset). Only the sha256 is stored. -------------------
export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export function newToken() {
  const token = crypto.randomBytes(24).toString("base64url");
  return { token, hash: sha256(token) };
}

// ---- signed blobs: session cookie + Worker gate token -------------------------------
function signBlob(obj: object, secret: string): string {
  const payload = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function readBlob<T extends { exp: number }>(blob: string | undefined, secret: string): T | null {
  if (!blob || !blob.includes(".") || !secret) return null;
  const [payload, sig] = blob.split(".");
  const want = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
    return typeof obj.exp === "number" && obj.exp > Date.now() / 1000 ? obj : null;
  } catch {
    return null;
  }
}
export function mintSession(uid: string): { value: string; maxAge: number } {
  const maxAge = SESSION_DAYS * 86400;
  return {
    value: signBlob({ uid, exp: Math.floor(Date.now() / 1000) + maxAge }, process.env.VM_SESSION_SECRET || ""),
    maxAge,
  };
}
export function readSession(cookie: string | undefined): { uid: string } | null {
  return readBlob<{ uid: string; exp: number }>(cookie, process.env.VM_SESSION_SECRET || "");
}
/** Short-lived token the nexa-gate Worker accepts for ONE phone (must match its hostname). */
export function mintGateToken(phone: string): string {
  return signBlob({ exp: Math.floor(Date.now() / 1000) + 120, phone }, process.env.VM_GATE_SECRET || "");
}

// ---- users ---------------------------------------------------------------------------
export async function userFromCookie(cookie: string | undefined): Promise<VmUser | null> {
  const s = readSession(cookie);
  if (!s) return null;
  const { data } = await db().from("vm_users").select("*").eq("id", s.uid).maybeSingle();
  const u = data as VmUser | null;
  return u && u.enabled && u.username ? u : null;
}
export const cleanUsername = (s: unknown) => String(s ?? "").trim().toLowerCase();
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;

// ---- rack backend (phonectl) ----------------------------------------------------------
const PCC = process.env.PHONE_API_URL || "https://ai.nexavisiongroup.com/pcc";
export async function pcc(path: string, method: "GET" | "POST" = "GET"): Promise<Record<string, unknown>> {
  try {
    const r = await fetch(`${PCC}${path}`, {
      method,
      cache: "no-store",
      headers: { Authorization: `Bearer ${process.env.PHONE_API_TOKEN || ""}` },
      signal: AbortSignal.timeout(100_000),
    });
    return (await r.json().catch(() => ({ ok: false, error: `http ${r.status}` }))) as Record<string, unknown>;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
