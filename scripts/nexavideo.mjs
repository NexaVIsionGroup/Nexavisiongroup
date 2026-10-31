// Nexa Video provisioning + publishing (run from the repo root on the rack).
//   SUPABASE_MGMT_TOKEN=… node scripts/nexavideo.mjs setup
//        → private 'nexavideo' Storage bucket + supabase/nexavideo-schema.sql
//   node scripts/nexavideo.mjs release <apk> <versionCode> <versionName> "<notes>"
//        → uploads the APK to the bucket and records it as the newest release
//          (the download page + the app's update prompt hand out the newest release)
import fs from "node:fs";
import path from "node:path";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const env = Object.fromEntries(
  envFile.split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const REF = new URL(SUPABASE_URL).hostname.split(".")[0];
const H = { Authorization: `Bearer ${KEY}`, apikey: KEY };
const APK = "application/vnd.android.package-archive";
const [cmd, ...args] = process.argv.slice(2);

if (cmd === "setup") {
  const b = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ id: "nexavideo", name: "nexavideo", public: false, file_size_limit: 52428800, allowed_mime_types: [APK] }),
  });
  console.log(`bucket: ${b.status} ${await b.text()}`);
  const token = process.env.SUPABASE_MGMT_TOKEN;
  if (!token) { console.log("SUPABASE_MGMT_TOKEN not set — run supabase/nexavideo-schema.sql in the SQL editor."); process.exit(0); }
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase", "nexavideo-schema.sql"), "utf8");
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  console.log(`schema: ${r.status} ${await r.text()}`);
} else if (cmd === "release") {
  const [file, code, name, notes = ""] = args;
  if (!file || !code || !name) { console.log("usage: release <apk> <versionCode> <versionName> \"notes\""); process.exit(1); }
  const bytes = fs.readFileSync(file);
  const obj = `releases/NexaVideo-${name}-${code}.apk`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/nexavideo/${obj}`, {
    method: "POST", headers: { ...H, "Content-Type": APK, "x-upsert": "true" }, body: bytes,
  });
  console.log(`upload: ${up.status} ${await up.text()}`);
  if (!up.ok) process.exit(1);
  const row = await fetch(`${SUPABASE_URL}/rest/v1/nexavideo_releases?on_conflict=version_code`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ version_code: Number(code), version_name: name, notes, storage_path: obj, size_bytes: bytes.length }),
  });
  console.log(`release row: ${row.status} ${await row.text()}`);
} else {
  console.log("usage: node scripts/nexavideo.mjs setup | release <apk> <versionCode> <versionName> \"notes\"");
}
