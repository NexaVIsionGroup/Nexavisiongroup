"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/admin/AppShell";
import {
  FileCode2,
  Plus,
  Search,
  Loader2,
  X,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
  Lock,
  Ban,
  Clock,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Doc {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  client_name: string | null;
  customer_id: string | null;
  original_name: string | null;
  size_bytes: number | null;
  status: "active" | "disabled";
  expires_at: string | null;
  show_toolbar: boolean;
  version: number;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
  has_password: boolean;
  url: string;
}

interface Cust {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}

const custLabel = (c: Cust) =>
  c.company_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";

const fmtSize = (b: number | null) =>
  !b ? "—" : b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

const fmtDate = (s: string | null) =>
  !s ? "—" : new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const input =
  "w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all";

export default function DocumentsPage() {
  const supabase = createClient();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [custs, setCusts] = useState<Cust[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [me, setMe] = useState("");
  const [copied, setCopied] = useState("");

  // upload
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    client_name: "",
    customer_id: "",
    slug: "",
    password: "",
    expires_at: "",
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // edit / preview / delete
  const [editing, setEditing] = useState<Doc | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Doc | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/documents");
    const j = await r.json();
    setDocs(j.documents || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.email || ""));
    supabase
      .from("customers")
      .select("id, first_name, last_name, company_name")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCusts((data as Cust[]) || []));
  }, []);

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      d.title.toLowerCase().includes(q) ||
      (d.client_name || "").toLowerCase().includes(q) ||
      d.slug.toLowerCase().includes(q)
    );
  });

  const copyLink = async (d: Doc) => {
    try {
      await navigator.clipboard.writeText(d.url);
      setCopied(d.id);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      /* clipboard blocked — the link is visible on the card anyway */
    }
  };

  // ── Upload ──────────────────────────────────────────────────────────
  const pickFile = async (f: File | null) => {
    setFile(f);
    setError("");
    if (!f) return;
    // Default the title from the document's own <title>, falling back to filename.
    const head = await f.slice(0, 8192).text().catch(() => "");
    const m = head.match(/<title[^>]*>([\s\S]{1,200}?)<\/title>/i);
    const guess = (m?.[1] || f.name.replace(/\.html?$/i, "")).replace(/\s+/g, " ").trim();
    setForm((s) => ({ ...s, title: s.title || guess }));
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Choose an .html file first");
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    fd.append("created_by", me);

    const r = await fetch("/api/admin/documents", { method: "POST", body: fd });
    const j = await r.json();
    setUploading(false);

    if (!r.ok) return setError(j.error || "Upload failed");
    setNewUrl(j.url);
    setFile(null);
    setForm({ title: "", description: "", client_name: "", customer_id: "", slug: "", password: "", expires_at: "" });
    load();
  };

  const closeUpload = () => {
    setShowUpload(false);
    setNewUrl("");
    setFile(null);
    setError("");
    setForm({ title: "", description: "", client_name: "", customer_id: "", slug: "", password: "", expires_at: "" });
  };

  // ── Edit ────────────────────────────────────────────────────────────
  const openEdit = (d: Doc) => {
    setEditing(d);
    setReplaceFile(null);
    setError("");
    setEditForm({
      title: d.title,
      description: d.description || "",
      client_name: d.client_name || "",
      customer_id: d.customer_id || "",
      slug: d.slug,
      status: d.status,
      expires_at: d.expires_at ? d.expires_at.slice(0, 10) : "",
      show_toolbar: d.show_toolbar,
      password: "",
      clearPassword: false,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");

    const body: any = {
      title: editForm.title,
      description: editForm.description,
      client_name: editForm.client_name,
      customer_id: editForm.customer_id || null,
      slug: editForm.slug,
      status: editForm.status,
      show_toolbar: editForm.show_toolbar,
      expires_at: editForm.expires_at ? new Date(editForm.expires_at + "T23:59:59").toISOString() : null,
    };
    if (editForm.clearPassword) body.password = null;
    else if (editForm.password) body.password = editForm.password;

    const r = await fetch(`/api/admin/documents/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) {
      setSaving(false);
      return setError(j.error || "Save failed");
    }

    if (replaceFile) {
      const fd = new FormData();
      fd.append("file", replaceFile);
      const r2 = await fetch(`/api/admin/documents/${editing.id}`, { method: "PUT", body: fd });
      const j2 = await r2.json();
      if (!r2.ok) {
        setSaving(false);
        return setError(j2.error || "File replace failed");
      }
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const toggleStatus = async (d: Doc) => {
    await fetch(`/api/admin/documents/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: d.status === "active" ? "disabled" : "active" }),
    });
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await fetch(`/api/admin/documents/${confirmDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(null);
    load();
  };

  const expired = (d: Doc) => !!d.expires_at && new Date(d.expires_at) < new Date();

  return (
    <AppShell title="Documents">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header — the upload button gets its own full-width row on phones so
            it can never wrap off-screen behind the search field. */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:flex-1 sm:w-auto sm:min-w-[200px] order-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nv-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className={cn(input, "pl-9")}
            />
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="nv-btn-primary py-3 px-4 text-xs w-full sm:w-auto order-2 sm:order-3"
          >
            <Plus size={18} /> Upload document
          </button>
          <button
            onClick={load}
            className="text-nv-text-muted hover:text-nv-teal flex items-center gap-1.5 text-xs px-2 shrink-0 order-3 sm:order-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-nv-teal animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="nv-glass rounded-nv-lg p-8 text-center">
            <FileCode2 size={32} className="text-nv-text-muted mx-auto mb-3" />
            <p className="text-nv-text-muted text-sm">
              {docs.length === 0
                ? "No shared documents yet. Upload an HTML document to create a client link."
                : "No documents match your search."}
            </p>
            {docs.length === 0 && (
              <button onClick={() => setShowUpload(true)} className="nv-btn-primary py-3 px-5 text-xs mt-4">
                <Plus size={18} /> Upload document
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((d) => (
              <div key={d.id} className="nv-glass rounded-nv-lg p-4 hover:border-nv-teal/20 transition-all">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="w-10 h-10 rounded-nv-md bg-nv-deep border border-white/10 flex items-center justify-center shrink-0">
                    <FileCode2 size={18} className="text-nv-teal" />
                  </div>

                  <div className="flex-1 min-w-0 basis-[55%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-nv-text-primary truncate max-w-full">{d.title}</p>
                      {d.has_password && (
                        <span className="flex items-center gap-1 text-[10px] text-nv-violet bg-nv-violet/10 border border-nv-violet/20 px-1.5 py-0.5 rounded-full">
                          <Lock size={10} /> Password
                        </span>
                      )}
                      {d.status === "disabled" && (
                        <span className="flex items-center gap-1 text-[10px] text-nv-text-muted bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full">
                          <Ban size={10} /> Off
                        </span>
                      )}
                      {expired(d) && (
                        <span className="flex items-center gap-1 text-[10px] text-nv-error bg-nv-error/10 border border-nv-error/20 px-1.5 py-0.5 rounded-full">
                          <Clock size={10} /> Expired
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => copyLink(d)}
                      className="mt-1 flex items-center gap-1.5 text-xs text-nv-text-muted hover:text-nv-teal transition-colors w-full min-w-0"
                      title="Copy share link"
                    >
                      {copied === d.id ? <Check size={12} className="text-nv-success shrink-0" /> : <Copy size={12} className="shrink-0" />}
                      <span className="truncate font-mono min-w-0">/d/{d.slug}</span>
                    </button>

                    <p className="mt-1 text-[11px] text-nv-text-muted">
                      {d.client_name ? `${d.client_name} · ` : ""}
                      {d.view_count} view{d.view_count === 1 ? "" : "s"}
                      {d.last_viewed_at ? ` · last ${fmtDate(d.last_viewed_at)}` : ""}
                      {` · ${fmtSize(d.size_bytes)}`}
                      {d.version > 1 ? ` · v${d.version}` : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <button
                      onClick={() => setPreview(d)}
                      title="Preview"
                      className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open live link"
                      className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => toggleStatus(d)}
                      title={d.status === "active" ? "Turn link off" : "Turn link on"}
                      className={cn(
                        "p-2 rounded-nv-md hover:bg-white/5 transition-colors",
                        d.status === "active"
                          ? "text-nv-text-muted hover:text-nv-error"
                          : "text-nv-success hover:text-nv-success"
                      )}
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      onClick={() => openEdit(d)}
                      title="Edit"
                      className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(d)}
                      title="Delete"
                      className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-error hover:bg-nv-error/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Upload modal ── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeUpload}>
          <div
            className="w-full max-w-md nv-glass-elevated rounded-nv-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg text-nv-text-primary">
                {newUrl ? "Link ready" : "Upload document"}
              </h3>
              <button onClick={closeUpload} className="text-nv-text-muted hover:text-nv-teal">
                <X size={20} />
              </button>
            </div>

            {newUrl ? (
              <div className="space-y-4">
                <p className="text-sm text-nv-text-secondary">Your shareable link is live:</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={newUrl} className={cn(input, "font-mono text-xs")} onFocus={(e) => e.target.select()} />
                  <button
                    onClick={() => navigator.clipboard.writeText(newUrl).catch(() => {})}
                    className="nv-btn-primary py-2 px-3 text-xs shrink-0"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
                <div className="flex gap-2">
                  <a href={newUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs text-nv-teal hover:underline py-2">
                    Open it
                  </a>
                  <button onClick={() => setNewUrl("")} className="flex-1 text-xs text-nv-text-muted hover:text-nv-teal py-2">
                    Upload another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={upload} className="space-y-3">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    pickFile(e.dataTransfer.files?.[0] || null);
                  }}
                  onClick={() => fileInput.current?.click()}
                  className={cn(
                    "border border-dashed rounded-nv-lg p-6 text-center cursor-pointer transition-all",
                    drag ? "border-nv-teal bg-nv-teal/5" : "border-white/15 hover:border-nv-teal/40"
                  )}
                >
                  <UploadCloud size={22} className={cn("mx-auto mb-2", file ? "text-nv-success" : "text-nv-text-muted")} />
                  <p className="text-xs text-nv-text-secondary break-all">
                    {file ? file.name : "Drop an .html file here, or tap to choose"}
                  </p>
                  {file && <p className="text-[11px] text-nv-text-muted mt-1">{fmtSize(file.size)}</p>}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                />

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title (shown in link previews)"
                  className={input}
                />
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description (optional)"
                  className={input}
                />
                <input
                  type="text"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="Client / project label (optional)"
                  className={input}
                />
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className={input}
                >
                  <option value="">Link to a customer (optional)</option>
                  {custs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {custLabel(c)}
                    </option>
                  ))}
                </select>

                <details className="group">
                  <summary className="text-xs text-nv-text-muted cursor-pointer hover:text-nv-teal py-1">
                    Advanced — custom link, password, expiry
                  </summary>
                  <div className="space-y-3 pt-3">
                    <div>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="custom-link-name"
                        className={cn(input, "font-mono text-xs")}
                      />
                      <p className="text-[11px] text-nv-text-muted mt-1">
                        Leave blank for an unguessable auto link.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Password (optional)"
                      className={input}
                    />
                    <div>
                      <input
                        type="date"
                        value={form.expires_at ? form.expires_at.slice(0, 10) : ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            expires_at: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : "",
                          })
                        }
                        className={input}
                      />
                      <p className="text-[11px] text-nv-text-muted mt-1">Expiry date (optional).</p>
                    </div>
                  </div>
                </details>

                {error && <p className="text-xs text-nv-error">{error}</p>}

                <button type="submit" disabled={uploading || !file} className="w-full nv-btn-primary py-2.5 mt-1 disabled:opacity-50">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : "Create share link"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div
            className="w-full max-w-md nv-glass-elevated rounded-nv-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg text-nv-text-primary">Edit document</h3>
              <button onClick={() => setEditing(null)} className="text-nv-text-muted hover:text-nv-teal">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Title"
                className={input}
              />
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Short description"
                className={input}
              />
              <input
                type="text"
                value={editForm.client_name}
                onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                placeholder="Client / project label"
                className={input}
              />
              <select
                value={editForm.customer_id}
                onChange={(e) => setEditForm({ ...editForm, customer_id: e.target.value })}
                className={input}
              >
                <option value="">No linked customer</option>
                {custs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {custLabel(c)}
                  </option>
                ))}
              </select>

              <div>
                <label className="text-[11px] text-nv-text-muted">Link name</label>
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className={cn(input, "font-mono text-xs")}
                />
                <p className="text-[11px] text-nv-text-muted mt-1">
                  Changing this breaks any link you already sent.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className={input}
                >
                  <option value="active">Link on</option>
                  <option value="disabled">Link off</option>
                </select>
                <input
                  type="date"
                  value={editForm.expires_at}
                  onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
                  className={input}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={editForm.password}
                  disabled={editForm.clearPassword}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder={editing.has_password ? "New password (leave blank to keep)" : "Set a password (optional)"}
                  className={cn(input, editForm.clearPassword && "opacity-40")}
                />
                {editing.has_password && (
                  <label className="flex items-center gap-2 text-xs text-nv-text-muted">
                    <input
                      type="checkbox"
                      checked={editForm.clearPassword}
                      onChange={(e) => setEditForm({ ...editForm, clearPassword: e.target.checked })}
                      className="accent-nv-teal"
                    />
                    Remove password
                  </label>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-nv-text-muted">
                <input
                  type="checkbox"
                  checked={!!editForm.show_toolbar}
                  onChange={(e) => setEditForm({ ...editForm, show_toolbar: e.target.checked })}
                  className="accent-nv-teal"
                />
                Show the floating print / full-screen buttons
              </label>

              {/* Replace file */}
              <div className="border-t border-white/5 pt-3">
                <label className="text-[11px] text-nv-text-muted">Replace the file (keeps the same link)</label>
                <input
                  type="file"
                  accept=".html,.htm,text/html"
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-nv-text-muted mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-nv-md file:border-0 file:bg-nv-teal/10 file:text-nv-teal file:text-xs"
                />
                {replaceFile && (
                  <p className="text-[11px] text-nv-success mt-1">
                    {replaceFile.name} — will become v{editing.version + 1}
                  </p>
                )}
              </div>

              {error && <p className="text-xs text-nv-error">{error}</p>}

              <button onClick={saveEdit} disabled={saving} className="w-full nv-btn-primary py-2.5 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-2 sm:p-6" onClick={() => setPreview(null)}>
          <div className="flex items-center gap-3 pb-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-nv-text-primary font-medium truncate">{preview.title}</p>
            <div className="flex-1" />
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-nv-teal hover:underline flex items-center gap-1"
            >
              <ExternalLink size={13} /> Live link
            </a>
            <button onClick={() => setPreview(null)} className="text-nv-text-muted hover:text-nv-teal">
              <X size={20} />
            </button>
          </div>
          <iframe
            src={`/api/admin/documents/${preview.id}/preview`}
            title={preview.title}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 w-full rounded-nv-lg bg-white border border-white/10"
            sandbox="allow-scripts allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}

      {/* ── Delete confirm ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm nv-glass-elevated rounded-nv-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-lg text-nv-text-primary mb-2">Delete document?</h3>
            <p className="text-sm text-nv-text-muted mb-5">
              “{confirmDelete.title}” and its file will be removed. Anyone holding the link will get a
              “not found” page. This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-nv-md border border-white/10 text-sm text-nv-text-secondary hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-nv-md bg-nv-error/15 border border-nv-error/30 text-sm text-nv-error hover:bg-nv-error/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
