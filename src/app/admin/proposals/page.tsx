"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Loader2, Plus, X } from "lucide-react";
import AppShell from "@/components/admin/AppShell";
import { DIVISIONS, money } from "@/lib/proposals/types";
import { field, label, StatusChip, statusOf, when } from "./shared";

type Row = {
  id: string; number: string; title: string; status: string; client_name: string | null; client_company: string | null;
  link_enabled: boolean; expires_at: string | null; view_count: number; last_viewed_at: string | null; signed_at: string | null;
  due_amount: number | null; paid_at: string | null; updated_at: string;
};

export default function ProposalsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", client_name: "", client_company: "", client_email: "", client_phone: "", division: "Restaurants" });

  useEffect(() => {
    fetch("/api/admin/proposals", { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRows(j.proposals); })
      .catch((e) => { setErr(e.message || "Could not load proposals."); setRows([]); });
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || "Could not create the proposal."); setBusy(false); return; }
    router.push(`/admin/proposals/${j.proposal.id}`);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const waiting = (rows || []).filter((p) => ["sent", "viewed"].includes(p.status) && !p.signed_at).length;
  const signed = (rows || []).filter((p) => p.signed_at).length;

  return (
    <AppShell title="Proposals">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-nv-text-secondary">{rows ? `${waiting} waiting on the customer, ${signed} signed` : "Loading"}</p>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-nv-md bg-nv-teal text-nv-deep font-semibold">
            <Plus size={18} aria-hidden /> New proposal
          </button>
        </div>
        {err && <p role="alert" className="text-red-400">{err}</p>}

        {open && (
          <form onSubmit={create} className="nv-glass rounded-nv-lg p-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-nv-text-primary">New proposal</h2>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="p-2 text-nv-text-muted"><X size={20} /></button>
            </div>
            <label className="sm:col-span-2"><span className={label}>Title</span><input required autoFocus className={field} value={form.title} onChange={set("title")} placeholder="Website, Google and online ordering plan" /></label>
            <label><span className={label}>Contact name</span><input className={field} value={form.client_name} onChange={set("client_name")} /></label>
            <label><span className={label}>Business</span><input className={field} value={form.client_company} onChange={set("client_company")} /></label>
            <label><span className={label}>Email</span><input type="email" className={field} value={form.client_email} onChange={set("client_email")} /></label>
            <label><span className={label}>Phone</span><input type="tel" className={field} value={form.client_phone} onChange={set("client_phone")} /></label>
            <label className="sm:col-span-2"><span className={label}>Division</span>
              <select className={field} value={form.division} onChange={set("division")}>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</select>
            </label>
            <button disabled={busy} className="sm:col-span-2 inline-flex justify-center items-center gap-2 min-h-[46px] rounded-nv-md bg-nv-teal text-nv-deep font-semibold disabled:opacity-60">
              {busy && <Loader2 size={18} className="animate-spin" aria-hidden />} Create and continue
            </button>
          </form>
        )}

        {rows && rows.length === 0 && !open && (
          <div className="nv-glass rounded-nv-lg p-8 text-center grid gap-2 justify-items-center">
            <FileText size={28} className="text-nv-teal" aria-hidden />
            <h2 className="font-display font-bold text-xl text-nv-text-primary">No proposals yet</h2>
            <p className="text-nv-text-muted">Create one here, or tell Claude who the customer is and it will write one for you to review.</p>
          </div>
        )}

        <ul className="grid gap-3">
          {(rows || []).map((p) => (
            <li key={p.id}>
              <Link href={`/admin/proposals/${p.id}`} className="nv-glass rounded-nv-lg p-4 flex items-center gap-3 hover:border-nv-teal/40">
                <div className="min-w-0 flex-1 grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-nv-text-primary">{p.client_company || p.client_name || "No customer yet"}</b>
                    <StatusChip status={statusOf(p)} />
                  </div>
                  <p className="text-nv-text-secondary truncate">{p.title}</p>
                  <p className="text-sm text-nv-text-muted">
                    {p.number}
                    {p.signed_at ? `, signed ${when(p.signed_at)}` : p.last_viewed_at ? `, opened ${p.view_count} ${p.view_count === 1 ? "time" : "times"}, last ${when(p.last_viewed_at)}` : `, updated ${when(p.updated_at)}`}
                    {Number(p.due_amount) > 0 && (p.paid_at ? `, ${money(Number(p.due_amount))} paid` : `, ${money(Number(p.due_amount))} due`)}
                  </p>
                </div>
                <ChevronRight size={20} className="text-nv-text-muted flex-none" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
