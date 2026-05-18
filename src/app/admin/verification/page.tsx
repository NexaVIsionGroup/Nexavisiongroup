"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/admin/AppShell";
import { ShieldCheck, Plus, Loader2, X, Check, Ban, FileText, RefreshCw, ExternalLink, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Req { id: string; customer_id: string | null; customer_name?: string; customer_email?: string; status: string; created_at: string; submitted_at: string | null; reviewed_at: string | null; expires_at: string; }
interface Doc { id: string; doc_type: string; original_name: string | null; content_type: string | null; size_bytes: number | null; url: string | null; downloadUrl?: string | null; }
interface Cust { id: string; first_name: string | null; last_name: string | null; company_name: string | null; email: string | null; }

const statusColors: Record<string, string> = {
  pending: "text-nv-info bg-nv-info/10 border-nv-info/20",
  submitted: "text-nv-teal bg-nv-teal/10 border-nv-teal/20",
  approved: "text-nv-success bg-nv-success/10 border-nv-success/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  expired: "text-nv-text-muted bg-white/5 border-white/10",
};

export default function VerificationPage() {
  const supabase = createClient();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState("");
  const [sel, setSel] = useState<Req | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [custs, setCusts] = useState<Cust[]>([]);
  const [pick, setPick] = useState("");
  const [emailLink, setEmailLink] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/verify");
    const j = await r.json();
    setReqs(j.requests || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.email || ""));
  }, []);

  const openReview = async (req: Req) => {
    setSel(req); setDocs([]); setNotes(""); setDocLoading(true);
    const r = await fetch("/api/admin/verify", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: req.id, want_urls: true, reviewed_by: me }) });
    const j = await r.json();
    setDocs(j.documents || []); setDocLoading(false);
  };

  const decide = async (decision: string) => {
    if (!sel) return;
    setActing(true);
    await fetch("/api/admin/verify", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel.id, decision, review_notes: notes, reviewed_by: me }) });
    setActing(false); setSel(null); load();
  };

  const openNew = async () => {
    setShowNew(true); setNewLink(""); setPick("");
    const { data } = await supabase.from("customers").select("id, first_name, last_name, company_name, email").order("created_at", { ascending: false });
    setCusts(data || []);
  };

  const createReq = async () => {
    if (!pick) return;
    setCreating(true);
    const c = custs.find((x) => x.id === pick);
    const r = await fetch("/api/admin/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: pick, email: c?.email, send_email: emailLink, created_by: me }) });
    const j = await r.json();
    setNewLink(j.link || ""); setCreating(false); load();
  };

  return (
    <AppShell title="Verification">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-nv-text-muted hover:text-nv-teal flex items-center gap-1.5 text-xs"><RefreshCw size={14} /> Refresh</button>
          <div className="flex-1" />
          <button onClick={openNew} className="nv-btn-primary py-2 px-4 text-xs"><Plus size={16} /> New request</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
        ) : reqs.length === 0 ? (
          <div className="nv-glass rounded-nv-lg p-8 text-center"><ShieldCheck size={32} className="text-nv-text-muted mx-auto mb-3" /><p className="text-nv-text-muted text-sm">No verification requests yet.</p></div>
        ) : (
          <div className="space-y-2">
            {reqs.map((q) => (
              <div key={q.id} className="nv-glass rounded-nv-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-nv-text-primary truncate">{q.customer_name || q.customer_email || q.customer_id || "Unknown customer"}</p>
                  <p className="text-xs text-nv-text-muted truncate">Created {new Date(q.created_at).toLocaleDateString()}{q.submitted_at ? " · Submitted " + new Date(q.submitted_at).toLocaleDateString() : ""}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", statusColors[q.status] || statusColors.pending)}>{q.status}</span>
                  <button disabled={q.status !== "submitted"} onClick={() => openReview(q)} className="text-xs px-3 py-1.5 rounded-nv-md border border-white/10 text-nv-text-secondary hover:border-nv-teal/40 disabled:opacity-30 disabled:cursor-not-allowed">Review</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSel(null)}>
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto nv-glass-elevated rounded-nv-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-nv-text-primary">Review &mdash; {sel.customer_name || sel.customer_email || "customer"}</h3>
              <button onClick={() => setSel(null)} className="text-nv-text-muted hover:text-nv-teal"><X size={20} /></button>
            </div>
            <p className="text-xs text-nv-text-muted mb-4">Document links are valid for 5 minutes; every view is logged to the activity log.</p>
            {docLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={22} className="text-nv-teal animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {docs.length === 0 && <p className="text-sm text-nv-text-muted">No documents found for this request.</p>}
                {docs.map((d) => (
                  <div key={d.id} className="border border-white/10 rounded-nv-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-nv-text-primary capitalize">{d.doc_type.replace("_", " ")}</span>
                      <span className="text-xs text-nv-text-muted">{d.original_name}{d.size_bytes ? " · " + (d.size_bytes / 1048576).toFixed(1) + "MB" : ""}</span>
                    </div>
                    {d.url ? (
                      d.content_type?.startsWith("image/") ? (
                        <img src={d.url} alt={d.doc_type} className="max-h-72 rounded-nv-md border border-white/10" />
                      ) : (
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-nv-teal text-sm inline-flex items-center gap-1.5"><FileText size={14} /> Open document <ExternalLink size={12} /></a>
                      )
                    ) : <span className="text-xs text-red-400">URL unavailable</span>}
                    {d.downloadUrl && (
                      <a href={d.downloadUrl} className="mt-2 text-nv-teal text-xs inline-flex items-center gap-1.5 hover:underline"><Download size={13} /> Download {d.original_name || d.doc_type}</a>
                    )}
                  </div>
                ))}
              </div>
            )}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Review notes (optional)" rows={3} className="w-full mt-4 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
            <div className="flex gap-3 mt-4">
              <button disabled={acting} onClick={() => decide("approved")} className="flex-1 py-2.5 rounded-nv-md bg-nv-success/15 text-nv-success border border-nv-success/30 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"><Check size={16} /> Approve</button>
              <button disabled={acting} onClick={() => decide("rejected")} className="flex-1 py-2.5 rounded-nv-md bg-red-400/15 text-red-400 border border-red-400/30 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"><Ban size={16} /> Reject</button>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md nv-glass-elevated rounded-nv-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg text-nv-text-primary">New verification request</h3>
              <button onClick={() => setShowNew(false)} className="text-nv-text-muted hover:text-nv-teal"><X size={20} /></button>
            </div>
            {newLink ? (
              <div className="space-y-3">
                <p className="text-sm text-nv-text-secondary">Request created. Secure link (expires in 7 days):</p>
                <div className="text-xs break-all bg-nv-void/60 border border-white/10 rounded-nv-md p-3 text-nv-teal">{newLink}</div>
                <p className="text-xs text-nv-text-muted">{emailLink ? "An email with this link was sent to the customer." : "Send this link to the customer through your normal channel."}</p>
                <button onClick={() => setShowNew(false)} className="w-full nv-btn-primary py-2.5">Done</button>
              </div>
            ) : (
              <div className="space-y-3">
                <select value={pick} onChange={(e) => setPick(e.target.value)} className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary focus:outline-none focus:border-nv-teal/50">
                  <option value="">Select a customer&hellip;</option>
                  {custs.map((c) => (<option key={c.id} value={c.id}>{[c.first_name, c.last_name].filter(Boolean).join(" ") || c.company_name || c.email || c.id}</option>))}
                </select>
                <label className="flex items-center gap-2 text-sm text-nv-text-secondary">
                  <input type="checkbox" checked={emailLink} onChange={(e) => setEmailLink(e.target.checked)} /> Email the secure link to the customer
                </label>
                <button disabled={!pick || creating} onClick={createReq} className="w-full nv-btn-primary py-2.5 disabled:opacity-50">{creating ? <Loader2 size={16} className="animate-spin" /> : "Create request"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}