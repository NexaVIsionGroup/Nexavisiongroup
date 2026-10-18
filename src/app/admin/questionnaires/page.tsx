"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/admin/AppShell";
import { ClipboardList, Plus, Loader2, Copy, Check, ExternalLink, ChevronRight, X } from "lucide-react";
import { fmtMoney, TEMPLATES } from "@/lib/questionnaires";
import { STATUS, ago } from "./shared";

interface Row {
  id: string;
  title: string;
  client_name: string | null;
  status: string;
  url: string;
  answered: number;
  income: number;
  expenses: number;
  gap: number;
  open_count: number;
  last_opened_at: string | null;
  last_saved_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

export default function QuestionnairesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "Household Budget & Benefits Check-up", client_name: "", address: "", client_phone: "", template: "household-budget" });

  const load = () =>
    fetch("/api/admin/questionnaires")
      .then((r) => r.json())
      .then((d) => setRows(d.questionnaires || []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/questionnaires", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Failed");
    router.push(`/admin/questionnaires/${j.id}`);
  };

  const copy = async (url: string, id: string) => {
    try { await navigator.clipboard.writeText(url); setCopied(id); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  return (
    <AppShell title="Questionnaires">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-sm text-nv-text-muted max-w-xl">
            Private, autosaving question links for clients. Send the link, they fill it out at their own pace, and the answers, totals and flags show up here.
          </p>
          <button onClick={() => setCreating(true)} className="nv-btn-primary py-3 px-4 text-xs flex items-center gap-2">
            <Plus size={14} /> New questionnaire
          </button>
        </div>

        {creating && (
          <div className="nv-glass rounded-nv-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold text-nv-text-primary">New questionnaire link</p>
              <button onClick={() => setCreating(false)} className="text-nv-text-muted hover:text-nv-text-primary"><X size={18} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <L label="Template">
                <select className="nv-input" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}>
                  {Object.values(TEMPLATES).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </L>
              <L label="Title (shown to the client)"><input className="nv-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></L>
              <L label="Client name (internal)"><input className="nv-input" placeholder="e.g. The Smiths" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></L>
              <L label="Phone (internal)"><input className="nv-input" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} /></L>
              <L label="Prefill home address" wide><input className="nv-input" placeholder="Street, city" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></L>
            </div>
            {err && <p className="text-xs text-nv-error">{err}</p>}
            <button disabled={busy || !form.title.trim()} onClick={create} className="nv-btn-primary py-3 px-5 text-xs flex items-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create link
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="text-nv-teal animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="nv-glass rounded-nv-lg p-8 text-center">
            <ClipboardList className="text-nv-text-muted mx-auto mb-3" />
            <p className="text-nv-text-muted text-sm">No questionnaires yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((q) => {
              const s = STATUS[q.status] || STATUS.pending;
              return (
                <div key={q.id} className="nv-glass rounded-nv-lg p-4 hover:border-nv-teal/20 transition-all">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-nv-md bg-nv-deep border border-white/10 flex items-center justify-center shrink-0">
                      <ClipboardList size={18} className="text-nv-teal" />
                    </div>
                    <button onClick={() => router.push(`/admin/questionnaires/${q.id}`)} className="flex-1 min-w-0 text-left basis-[50%]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-nv-text-primary truncate">{q.client_name || q.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-nv-text-muted">
                        {q.answered} answers · opened {q.open_count}× · last saved {ago(q.last_saved_at)}
                        {q.income || q.expenses ? ` · in ${fmtMoney(q.income)} / out ${fmtMoney(q.expenses)}` : ""}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 ml-auto">
                      <button title="Copy link" onClick={() => copy(q.url, q.id)} className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
                        {copied === q.id ? <Check size={16} className="text-nv-success" /> : <Copy size={16} />}
                      </button>
                      <a title="Open as client" href={q.url} target="_blank" rel="noreferrer" className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><ExternalLink size={16} /></a>
                      <button onClick={() => router.push(`/admin/questionnaires/${q.id}`)} className="p-2 rounded-nv-md text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style jsx global>{`
        .nv-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 12px; font-size: 14px; color: #E8EDF5; outline: none; }
        .nv-input:focus { border-color: rgba(0,229,204,0.5); }
        .nv-input option { background: #0F1D32; }
      `}</style>
    </AppShell>
  );
}

function L({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-[11px] uppercase tracking-wider text-nv-text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
