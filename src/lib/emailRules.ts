import { createAdminClient } from "@/lib/supabase/server";

/**
 * Sender rules for the admin mailbox. Stored as one small JSON object in the private Storage bucket
 * `admin-config` (no table needed). `blocked` holds lowercase patterns: "user@domain" or "@domain".
 * The inbound webhook checks every received email against it and files matches straight into Spam.
 */
const BUCKET = "admin-config";
const OBJECT = "email-rules.json";
const CACHE_MS = 60_000;

export type EmailRules = { blocked: string[] };

let cache: { rules: EmailRules; t: number } | null = null;

export const normalizePattern = (p: string) => String(p || "").trim().toLowerCase();

export function matchesBlocked(from: string, blocked: string[]): boolean {
  const f = normalizePattern(from);
  if (!f) return false;
  const domain = "@" + (f.split("@")[1] || "");
  return blocked.some((b) => b === f || (b.startsWith("@") && b.length > 1 && b === domain));
}

export async function getRules(): Promise<EmailRules> {
  if (cache && Date.now() - cache.t < CACHE_MS) return cache.rules;
  let rules: EmailRules = { blocked: [] };
  try {
    const { data } = await createAdminClient().storage.from(BUCKET).download(OBJECT);
    if (data) {
      const parsed = JSON.parse(await data.text());
      if (Array.isArray(parsed?.blocked)) rules = { blocked: parsed.blocked.map(normalizePattern).filter(Boolean) };
    }
  } catch { /* no rules yet */ }
  cache = { rules, t: Date.now() };
  return rules;
}

export async function saveRules(rules: EmailRules): Promise<void> {
  const sb = createAdminClient();
  await sb.storage.createBucket(BUCKET, { public: false }).catch(() => { /* already exists */ });
  const body = Buffer.from(JSON.stringify({ blocked: [...new Set(rules.blocked.map(normalizePattern).filter(Boolean))] }, null, 2));
  const { error } = await sb.storage.from(BUCKET).upload(OBJECT, body, { upsert: true, contentType: "application/json" });
  if (error) throw new Error(`save rules: ${error.message}`);
  cache = { rules, t: Date.now() };
}

export async function isBlocked(from: string): Promise<boolean> {
  return matchesBlocked(from, (await getRules()).blocked);
}
