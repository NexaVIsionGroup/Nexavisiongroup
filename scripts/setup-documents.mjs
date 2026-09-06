// One-shot provisioning for the shared-documents feature.
//   node scripts/setup-documents.mjs
// Creates the private 'client-docs' Storage bucket and runs documents-schema.sql.
import fs from "node:fs";
import path from "node:path";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split(".")[0];
const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;

// ── 1. Storage bucket ──────────────────────────────────────────────────
const bucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: SERVICE_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: "client-docs",
    name: "client-docs",
    public: false,
    file_size_limit: 26214400, // 25MB
    allowed_mime_types: ["text/html"],
  }),
});
const bucketBody = await bucketRes.text();
console.log(`bucket: ${bucketRes.status} ${bucketBody}`);

// ── 2. Schema ──────────────────────────────────────────────────────────
if (!MGMT_TOKEN) {
  console.log("\nSUPABASE_MGMT_TOKEN not set — run supabase/documents-schema.sql in the SQL editor.");
  process.exit(0);
}

const sql = fs.readFileSync(path.join(process.cwd(), "supabase", "documents-schema.sql"), "utf8");
const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${MGMT_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
console.log(`schema: ${sqlRes.status} ${await sqlRes.text()}`);
