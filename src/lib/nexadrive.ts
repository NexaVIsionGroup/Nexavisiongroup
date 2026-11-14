// NexaDrive: files stored as Telegram documents (bot @NexaDrive_storage_bot), metadata in Supabase.
// Uploads go through the self-hosted Bot API server on Oracle 1; downloads use Telegram's own API.
import { createAdminClient } from "@/lib/supabase/server";

export const NEXADRIVE_MAX_UPLOAD = 4 * 1024 * 1024; // what a Vercel function accepts in one request
const TG_DOWNLOAD_LIMIT = 20 * 1024 * 1024; // Telegram's getFile limit

function cfg() {
  const token = process.env.NEXADRIVE_TELEGRAM_BOT_TOKEN;
  const chat = process.env.NEXADRIVE_TELEGRAM_CHAT_ID;
  const api = process.env.NEXADRIVE_TELEGRAM_API_URL || "https://api.telegram.org";
  if (!token || !chat) throw new Error("NexaDrive is not configured");
  return { token, chat, api };
}

export type DriveFile = {
  id: string; folder: string; name: string; size_bytes: number; mime_type: string | null;
  backup_id: string | null; part_no: number | null; uploaded_by: string | null; created_at: string;
};

export type DriveBackup = {
  id: string; kind: "full" | "diff"; base_id: string | null; status: "running" | "done" | "failed";
  started_at: string; finished_at: string | null; files: number | null; source_bytes: number | null;
  archive_bytes: number | null; parts: number | null; error: string | null; host: string | null;
};

export function normFolder(f: string | null | undefined): string {
  const parts = String(f || "/").split("/").map((p) => p.trim()).filter((p) => p && p !== "." && p !== "..");
  return "/" + parts.join("/");
}

export async function listFolder(folder: string) {
  const db = createAdminClient();
  const f = normFolder(folder);
  const prefix = f === "/" ? "/" : f + "/";
  const [{ data: files, error }, { data: all }] = await Promise.all([
    db.from("nexadrive_files").select("id, folder, name, size_bytes, mime_type, backup_id, part_no, uploaded_by, created_at")
      .eq("folder", f).is("deleted_at", null).order("part_no", { ascending: true, nullsFirst: true }).order("name"),
    db.from("nexadrive_files").select("folder").is("deleted_at", null).like("folder", `${prefix}%`).limit(5000),
  ]);
  if (error) throw new Error(error.message);
  const sub = new Set<string>();
  for (const r of all || []) {
    const rest = (r.folder as string).slice(prefix.length);
    const first = rest.split("/")[0];
    if (first) sub.add(first);
  }
  return { folder: f, folders: [...sub].sort((a, b) => b.localeCompare(a)), files: (files || []) as DriveFile[] };
}

export async function listBackups(limit = 30): Promise<DriveBackup[]> {
  const db = createAdminClient();
  const { data, error } = await db.from("nexadrive_backups").select("*").order("started_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as DriveBackup[];
}

export async function uploadFile(folder: string, file: File, by: string | null) {
  const { token, chat, api } = cfg();
  if (file.size > NEXADRIVE_MAX_UPLOAD) throw new Error("Files over 4 MB can't be uploaded from the browser yet.");
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("caption", `NexaDrive: ${normFolder(folder)}/${file.name}`);
  form.append("disable_notification", "true");
  form.append("document", file, file.name);
  const r = await fetch(`${api}/bot${token}/sendDocument`, { method: "POST", body: form });
  const j = await r.json();
  if (!j.ok) throw new Error(`Telegram refused the upload: ${j.description}`);
  const buf = Buffer.from(await file.arrayBuffer());
  const sha = (await import("crypto")).createHash("sha256").update(buf).digest("hex");
  const db = createAdminClient();
  const { data, error } = await db.from("nexadrive_files").insert({
    folder: normFolder(folder), name: file.name.slice(0, 255), size_bytes: file.size, mime_type: file.type || null, sha256: sha,
    telegram_file_id: j.result.document.file_id, telegram_message_id: j.result.message_id, uploaded_by: by,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Fetches a stored file's bytes from Telegram. */
export async function fetchFile(id: string) {
  const { token } = cfg();
  const db = createAdminClient();
  const { data: f, error } = await db.from("nexadrive_files").select("name, size_bytes, mime_type, telegram_file_id").eq("id", id).is("deleted_at", null).single();
  if (error || !f) throw new Error("File not found");
  if (f.size_bytes > TG_DOWNLOAD_LIMIT) throw new Error("This file is larger than Telegram allows bots to download (20 MB).");
  const meta = await (await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(f.telegram_file_id)}`)).json();
  if (!meta.ok) throw new Error(`Telegram: ${meta.description}`);
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${meta.result.file_path}`);
  if (!res.ok || !res.body) throw new Error(`Telegram download failed (${res.status})`);
  return { name: f.name as string, mime: (f.mime_type as string) || "application/octet-stream", size: f.size_bytes as number, body: res.body };
}

/** Hides a file. Backup pieces can't be removed here, so a backup can never be broken from the browser. */
export async function deleteFile(id: string) {
  const db = createAdminClient();
  const { data, error } = await db.from("nexadrive_files").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("backup_id", null).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("That file can't be deleted.");
}
