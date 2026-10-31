import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Answers } from "./types";

// Server-only. Passwords typed into an access card are sealed with
// AES-256-GCM before they reach the database, and the public API never sends
// them back (the browser only learns `pass_saved: true`). Admins reveal one
// at a time through /api/admin/questionnaires/[id]/reveal.
//
// Key: QUESTIONNAIRE_SECRET_KEY (any long random string; hashed to 32 bytes).

function key(): Buffer {
  const k = process.env.QUESTIONNAIRE_SECRET_KEY;
  if (!k || k.length < 16) throw new Error("QUESTIONNAIRE_SECRET_KEY is not set");
  return createHash("sha256").update(k).digest();
}

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), body.toString("base64")].join(".");
}

export function unseal(sealed: string): string {
  const [v, iv, tag, body] = sealed.split(".");
  if (v !== "v1") throw new Error("Unknown secret format");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
}

const isObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);

/**
 * Merge an incoming autosave patch over the stored answers, sealing any typed
 * password and keeping an already-sealed one when the browser (which never
 * has it) sends the card back without it.
 */
export function sealPatch(incoming: Answers, existing: Answers): Answers {
  const out: Answers = {};
  for (const [id, v] of Object.entries(incoming)) {
    if (!isObj(v) || !("via" in v || "pass" in v || "pass_saved" in v)) {
      out[id] = v;
      continue;
    }
    const prev = isObj(existing[id]) ? existing[id] : {};
    const { pass, pass_clear, pass_enc: _ignored, ...rest } = v;
    const next: Record<string, any> = { ...rest };
    if (typeof pass === "string" && pass.length > 0) {
      next.pass_enc = seal(pass.slice(0, 500));
      next.pass_saved = true;
    } else if (pass_clear) {
      next.pass_saved = false;
    } else if (prev.pass_enc) {
      next.pass_enc = prev.pass_enc;
      next.pass_saved = true;
    }
    out[id] = next;
  }
  return out;
}

/** Answers safe to send to a browser: sealed passwords removed. */
export function stripSecrets(answers: Answers): Answers {
  const out: Answers = {};
  for (const [id, v] of Object.entries(answers || {})) {
    if (isObj(v) && "pass_enc" in v) {
      const { pass_enc, ...rest } = v;
      out[id] = { ...rest, pass_saved: !!pass_enc };
    } else out[id] = v;
  }
  return out;
}
