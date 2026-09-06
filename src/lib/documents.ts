// Shared helpers for the client-document sharing system (/admin/documents + /d/[slug]).
// SERVER ONLY — imports node:crypto. Never import this from a client component.
import crypto from "crypto";

export const DOCS_BUCKET = "client-docs";
export const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25MB — fancy docs embed images/fonts

// A shared document is served with an opaque origin so it can never reach
// admin cookies / same-origin APIs, while still running its own JS, fonts,
// animations, forms and print/download.
export const SANDBOX_CSP =
  "sandbox allow-scripts allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "nv-dev-doc-secret";

// ── Slugs ──────────────────────────────────────────────────────────────
export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomSuffix(len = 5): string {
  return crypto.randomBytes(8).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, len);
}

/** Slug from a title plus a short random suffix so links aren't guessable. */
export function buildSlug(title: string, custom?: string): string {
  const base = slugify(custom || title) || "document";
  return custom ? base : `${base}-${randomSuffix()}`;
}

// ── Passwords (optional per document) ──────────────────────────────────
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored?: string | null): boolean {
  if (!stored) return true; // no password set
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const test = crypto.scryptSync(password || "", salt, 32);
  const known = Buffer.from(hash, "hex");
  return test.length === known.length && crypto.timingSafeEqual(test, known);
}

// ── Unlock cookie (signed, no DB session needed) ───────────────────────
export function docCookieName(id: string): string {
  return `nvdoc_${id.replace(/-/g, "").slice(0, 12)}`;
}

export function signDocAccess(id: string, ttlMs = 12 * 60 * 60 * 1000): string {
  const exp = Date.now() + ttlMs;
  const mac = crypto.createHmac("sha256", SECRET).update(`${id}.${exp}`).digest("hex");
  return `${exp}.${mac}`;
}

export function verifyDocAccess(id: string, value?: string | null): boolean {
  if (!value) return false;
  const [expStr, mac] = value.split(".");
  const exp = Number(expStr);
  if (!exp || !mac || exp < Date.now()) return false;
  const expect = crypto.createHmac("sha256", SECRET).update(`${id}.${exp}`).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expect);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── HTML preparation ───────────────────────────────────────────────────
// Sandboxed documents get an opaque origin, where touching localStorage /
// sessionStorage throws a SecurityError and would kill an otherwise fine
// document's scripts. Inject an in-memory fallback before anything else runs.
const STORAGE_SHIM = `<script>/* nv-sandbox-shim */(function(){try{window.localStorage.getItem("__nv")}catch(e){var mk=function(st){return{getItem:function(k){return Object.prototype.hasOwnProperty.call(st,k)?st[k]:null},setItem:function(k,v){st[k]=String(v)},removeItem:function(k){delete st[k]},clear:function(){for(var k in st){delete st[k]}},key:function(i){var ks=Object.keys(st);return i<ks.length?ks[i]:null},get length(){return Object.keys(st).length}}};try{Object.defineProperty(window,"localStorage",{value:mk({}),configurable:true});Object.defineProperty(window,"sessionStorage",{value:mk({}),configurable:true})}catch(_){}}})();</script>`;

export function prepareHtml(html: string): string {
  if (html.includes("nv-sandbox-shim")) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => m + STORAGE_SHIM);
  }
  return STORAGE_SHIM + html;
}

/** Pull <title> out of an uploaded document for a sensible default name. */
export function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]{1,200}?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() || null : null;
}

export function hashIp(ip: string): string {
  return crypto.createHmac("sha256", SECRET).update(ip).digest("hex").slice(0, 32);
}

export function isExpired(expires_at?: string | null): boolean {
  return !!expires_at && new Date(expires_at) < new Date();
}
