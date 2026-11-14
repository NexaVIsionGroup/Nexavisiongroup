"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/admin/AppShell";
import { HardDrive, Folder, FileIcon, Download, Trash2, UploadCloud, Loader2, ChevronRight, RefreshCw, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type DriveFile = { id: string; folder: string; name: string; size_bytes: number; backup_id: string | null; part_no: number | null; created_at: string };
type Backup = {
  id: string; kind: "full" | "diff"; base_id: string | null; status: "running" | "done" | "failed"; started_at: string; finished_at: string | null;
  files: number | null; source_bytes: number | null; archive_bytes: number | null; parts: number | null; error: string | null;
};
type Listing = { folder: string; folders: string[]; files: DriveFile[]; backups: Backup[] };

const size = (b: number | null) => b == null ? "—" : b >= 1073741824 ? `${(b / 1073741824).toFixed(2)} GB` : b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} B`;
const when = (s: string | null) => s ? new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
const ago = (s: string | null) => {
  if (!s) return "never";
  const h = (Date.now() - Date.parse(s)) / 3600000;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} min ago` : h < 48 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} days ago`;
};

export default function NexaDrivePage() {
  const [tab, setTab] = useState<"files" | "backups">("files");
  const [folder, setFolder] = useState("/");
  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; good?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/nexadrive?folder=${encodeURIComponent(f)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not load NexaDrive");
      setData(j);
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Could not load NexaDrive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(folder); }, [folder, load]);

  const crumbs = folder === "/" ? [] : folder.slice(1).split("/");
  const go = (i: number) => setFolder(i < 0 ? "/" : "/" + crumbs.slice(0, i + 1).join("/"));
  const inBackups = /^\/Backups(\/|$)/.test(folder);

  const upload = async (file: File) => {
    setBusy(true); setMsg(null);
    const fd = new FormData();
    fd.append("folder", folder);
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/nexadrive", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload failed");
      setMsg({ text: `Uploaded ${file.name}.`, good: true });
      await load(folder);
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (f: DriveFile) => {
    if (!window.confirm(`Delete ${f.name}?`)) return;
    const r = await fetch(`/api/admin/nexadrive?id=${f.id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) setMsg({ text: j.error || "Delete failed" });
    await load(folder);
  };

  const backups = data?.backups ?? [];
  const lastFull = backups.find((b) => b.kind === "full" && b.status === "done");
  const lastAny = backups.find((b) => b.status === "done");
  const running = backups.find((b) => b.status === "running");
  const stale = !lastAny || Date.now() - Date.parse(lastAny.started_at) > 36 * 3600000;

  return (
    <AppShell title="NexaDrive">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="nv-glass rounded-nv-lg p-4 flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 rounded-nv-md bg-nv-deep border border-white/10 flex items-center justify-center shrink-0">
            <HardDrive size={18} className="text-nv-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-nv-text-primary">NexaDrive</p>
            <p className="text-xs text-nv-text-muted">Files stored in Telegram through the NexaDrive bot, plus automatic encrypted backups of the rack.</p>
          </div>
          <div className="flex gap-1 bg-nv-deep border border-white/10 rounded-nv-md p-1">
            {(["files", "backups"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs rounded-nv-sm capitalize", tab === t ? "bg-nv-teal/15 text-nv-teal" : "text-nv-text-muted hover:text-nv-text-primary")}>{t}</button>
            ))}
          </div>
          <button onClick={() => load(folder)} className="text-nv-text-muted hover:text-nv-teal p-2" aria-label="Refresh"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
        </div>

        {msg ? <div className={cn("rounded-nv-md px-4 py-3 text-sm border", msg.good ? "text-nv-success border-nv-success/30 bg-nv-success/10" : "text-nv-error border-nv-error/30 bg-nv-error/10")}>{msg.text}</div> : null}

        {tab === "backups" ? (
          <div className="space-y-3">
            <div className={cn("nv-glass rounded-nv-lg p-4 flex items-start gap-3", stale ? "border-nv-error/30" : "")}>
              {stale ? <AlertTriangle size={18} className="text-nv-error mt-0.5" /> : <ShieldCheck size={18} className="text-nv-success mt-0.5" />}
              <div className="text-sm">
                <p className="text-nv-text-primary font-medium">{running ? "A backup is running now" : stale ? "No successful backup in the last 36 hours" : "Backups are up to date"}</p>
                <p className="text-nv-text-muted text-xs mt-1">
                  Last backup {ago(lastAny?.started_at ?? null)} · last full backup {ago(lastFull?.started_at ?? null)}.
                  Weekly full copy of C:\websites, Claude memory and SSH keys; nightly copy of what changed. Encrypted before upload; restorable from the Oracle server without the rack.
                </p>
              </div>
            </div>
            {backups.length === 0 ? <p className="text-sm text-nv-text-muted">No backups yet.</p> : backups.map((b) => (
              <div key={b.id} className="nv-glass rounded-nv-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide", b.kind === "full" ? "text-nv-teal border-nv-teal/30 bg-nv-teal/10" : "text-nv-violet border-nv-violet/30 bg-nv-violet/10")}>{b.kind === "full" ? "Full" : "Changes"}</span>
                  <p className="text-sm text-nv-text-primary">{when(b.started_at)}</p>
                  <span className={cn("ml-auto text-xs flex items-center gap-1", b.status === "done" ? "text-nv-success" : b.status === "failed" ? "text-nv-error" : "text-nv-text-muted")}>
                    {b.status === "running" ? <Clock size={12} /> : null}{b.status === "done" ? "Finished" : b.status === "failed" ? "Failed" : "Running"}
                  </span>
                </div>
                <p className="text-xs text-nv-text-muted mt-2">
                  {b.files?.toLocaleString() ?? "—"} files · {size(b.source_bytes)} on the rack · {size(b.archive_bytes)} stored in {b.parts ?? "—"} pieces
                  {b.finished_at ? ` · took ${Math.max(1, Math.round((Date.parse(b.finished_at) - Date.parse(b.started_at)) / 60000))} min` : ""}
                </p>
                {b.error ? <p className="text-xs text-nv-error mt-1">{b.error}</p> : null}
                {b.status === "done" ? <button onClick={() => { setTab("files"); setFolder(`/Backups/${b.id}`); }} className="text-xs text-nv-teal mt-2">View pieces</button> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <button onClick={() => go(-1)} className={cn("hover:text-nv-teal", crumbs.length ? "text-nv-text-muted" : "text-nv-text-primary")}>NexaDrive</button>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight size={14} className="text-nv-text-muted" />
                  <button onClick={() => go(i)} className={cn("hover:text-nv-teal truncate max-w-[40vw]", i === crumbs.length - 1 ? "text-nv-text-primary" : "text-nv-text-muted")}>{c}</button>
                </span>
              ))}
              {!inBackups ? (
                <label className={cn("nv-btn-primary py-2 px-3 text-xs ml-auto flex items-center gap-1.5 cursor-pointer", busy && "opacity-60 pointer-events-none")}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Upload
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
                </label>
              ) : null}
            </div>
            {!inBackups ? <p className="text-[11px] text-nv-text-muted">Uploads from the browser are limited to 4 MB for now.</p> : null}

            {loading && !data ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {data?.folders.map((name) => (
                  <button key={name} onClick={() => setFolder((folder === "/" ? "" : folder) + "/" + name)} className="nv-glass rounded-nv-lg p-3 w-full flex items-center gap-3 text-left hover:border-nv-teal/20">
                    <Folder size={18} className="text-nv-teal shrink-0" />
                    <span className="text-sm text-nv-text-primary truncate">{name}</span>
                  </button>
                ))}
                {data?.files.map((f) => (
                  <div key={f.id} className="nv-glass rounded-nv-lg p-3 flex items-center gap-3">
                    <FileIcon size={18} className="text-nv-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-nv-text-primary truncate">{f.name}</p>
                      <p className="text-[11px] text-nv-text-muted">{size(f.size_bytes)} · {when(f.created_at)}{f.backup_id ? ` · piece ${f.part_no}` : ""}</p>
                    </div>
                    <a href={`/api/admin/nexadrive/file?id=${f.id}`} className="text-nv-text-muted hover:text-nv-teal p-2" aria-label={`Download ${f.name}`}><Download size={16} /></a>
                    {!f.backup_id ? <button onClick={() => remove(f)} className="text-nv-text-muted hover:text-nv-error p-2" aria-label={`Delete ${f.name}`}><Trash2 size={16} /></button> : null}
                  </div>
                ))}
                {data && data.folders.length === 0 && data.files.length === 0 ? <p className="text-sm text-nv-text-muted py-8 text-center">This folder is empty.</p> : null}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
