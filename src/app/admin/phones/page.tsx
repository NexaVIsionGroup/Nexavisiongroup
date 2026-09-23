"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/admin/AppShell";
import { Loader2, RefreshCw, ShoppingBag, MessageSquare, ExternalLink, MapPin, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { name: string; ram: number; storage: string; color: string; addons: string[]; qty: number; unit_price: number; line_total: number };
type Order = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  company: string | null;
  shipping_address: { line1: string; line2?: string; city: string; state: string; zip: string };
  items: Item[];
  subtotal: number;
  notes: string | null;
  jhps_invoice_number: string | null;
  created_at: string;
};
type Lead = {
  id: string;
  kind: "quote" | "guide" | "question";
  status: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  units: number | null;
  location: string | null;
  device: string | null;
  message: string | null;
  created_at: string;
};

const ORDER_FLOW = ["requested", "invoiced", "paid", "building", "shipped", "delivered", "cancelled"];
const LEAD_FLOW = ["new", "contacted", "won", "lost"];
const KIND_LABEL = { quote: "Fleet quote", guide: "Technical guide", question: "Question" };
const usd = (n: number) => Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
const when = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const chip = (s: string) =>
  cn(
    "text-[11px] px-2 py-0.5 rounded-full border capitalize",
    ["delivered", "won", "paid"].includes(s) && "text-nv-teal bg-nv-teal/10 border-nv-teal/30",
    ["requested", "new"].includes(s) && "text-amber-300 bg-amber-300/10 border-amber-300/30",
    ["cancelled", "lost"].includes(s) && "text-nv-error bg-nv-error/10 border-nv-error/30",
    !["delivered", "won", "paid", "requested", "new", "cancelled", "lost"].includes(s) && "text-nv-text-secondary bg-white/5 border-white/10"
  );

export default function PhoneStorePage() {
  const [tab, setTab] = useState<"orders" | "leads">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/nexaphone", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load");
      setOrders(j.orders || []);
      setLeads(j.leads || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/admin/nexaphone", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) setErr((await r.json()).error || "Update failed");
    else load();
  };

  const openOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const newLeads = leads.filter((l) => l.status === "new").length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-display font-semibold text-nv-text-primary">Phone Store</h1>
            <p className="text-sm text-nv-text-muted">
              Nexa Pro orders and leads from{" "}
              <a href="/nexaphone" target="_blank" className="text-nv-teal inline-flex items-center gap-1">
                /nexaphone <ExternalLink size={12} />
              </a>
            </p>
          </div>
          <button onClick={load} className="p-2 rounded-nv-md border border-white/10 text-nv-text-muted hover:text-nv-teal" aria-label="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(["orders", "leads"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm border",
                tab === t ? "bg-nv-teal/15 border-nv-teal/40 text-nv-teal" : "border-white/10 text-nv-text-muted"
              )}
            >
              {t === "orders" ? <ShoppingBag size={15} /> : <MessageSquare size={15} />}
              {t === "orders" ? `Orders (${openOrders} open)` : `Leads (${newLeads} new)`}
            </button>
          ))}
        </div>

        {err && <p className="text-sm text-nv-error mb-3">{err}</p>}
        {loading && !orders.length && !leads.length ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-nv-teal" />
          </div>
        ) : tab === "orders" ? (
          orders.length === 0 ? (
            <p className="text-nv-text-muted text-sm py-10 text-center">No orders yet. They appear here the moment someone checks out.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-nv-teal">{o.order_number}</span>
                      <span className={chip(o.status)}>{o.status}</span>
                    </div>
                    <span className="text-xs text-nv-text-muted">{when(o.created_at)}</span>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-nv-text-primary font-medium">
                        {o.customer_name}
                        {o.company ? `, ${o.company}` : ""}
                      </p>
                      <a href={`mailto:${o.customer_email}`} className="flex items-center gap-1.5 text-nv-text-secondary">
                        <Mail size={13} /> {o.customer_email}
                      </a>
                      {o.customer_phone && (
                        <a href={`tel:${o.customer_phone}`} className="flex items-center gap-1.5 text-nv-text-secondary">
                          <Phone size={13} /> {o.customer_phone}
                        </a>
                      )}
                      <p className="flex items-start gap-1.5 text-nv-text-muted">
                        <MapPin size={13} className="mt-0.5" />
                        {o.shipping_address.line1}
                        {o.shipping_address.line2 ? `, ${o.shipping_address.line2}` : ""}, {o.shipping_address.city}, {o.shipping_address.state}{" "}
                        {o.shipping_address.zip}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {o.items.map((it, i) => (
                        <div key={i} className="flex justify-between gap-3">
                          <span className="text-nv-text-secondary">
                            {it.name} × {it.qty}
                            <span className="block text-xs text-nv-text-muted">
                              {it.ram}GB / {it.storage}, {it.color}
                              {it.addons.length ? `, ${it.addons.join(", ")}` : ""}
                            </span>
                          </span>
                          <span className="text-nv-text-primary">{usd(it.line_total)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-white/10 pt-1 font-medium">
                        <span className="text-nv-text-muted">Subtotal (before tax)</span>
                        <span className="text-nv-teal">{usd(o.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                  {o.notes && <p className="mt-2 text-xs text-nv-text-muted">Notes: {o.notes}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={o.status}
                      onChange={(e) => patch({ table: "orders", id: o.id, status: e.target.value })}
                      className="bg-nv-void/60 border border-white/10 rounded-nv-md text-sm px-2 py-1.5 text-nv-text-primary"
                      aria-label="Order status"
                    >
                      {ORDER_FLOW.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      defaultValue={o.jhps_invoice_number || ""}
                      placeholder="JHPS invoice #"
                      onBlur={(e) => e.target.value !== (o.jhps_invoice_number || "") && patch({ table: "orders", id: o.id, jhps_invoice_number: e.target.value })}
                      className="bg-nv-void/60 border border-white/10 rounded-nv-md text-sm px-2 py-1.5 text-nv-text-primary w-40"
                    />
                    <a
                      href="https://jhpsfl.com/admin"
                      target="_blank"
                      className="text-xs text-nv-teal inline-flex items-center gap-1"
                      title="Create a Nexa-branded invoice for this order in the JHPS admin"
                    >
                      Send Nexa invoice in JHPS <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : leads.length === 0 ? (
          <p className="text-nv-text-muted text-sm py-10 text-center">No leads yet. Quote, guide and question forms land here.</p>
        ) : (
          <div className="space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-nv-lg border border-white/10 bg-nv-deep/60 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-nv-text-primary font-medium">{KIND_LABEL[l.kind]}</span>
                    <span className={chip(l.status)}>{l.status}</span>
                    {l.units ? <span className="text-xs text-nv-teal">{l.units} phones</span> : null}
                  </div>
                  <span className="text-xs text-nv-text-muted">{when(l.created_at)}</span>
                </div>
                <p className="mt-2 text-nv-text-primary">
                  {l.name}
                  {l.company ? `, ${l.company}` : ""}
                  {l.location ? <span className="text-nv-text-muted"> · {l.location}</span> : null}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-nv-text-secondary mt-1">
                  <a href={`mailto:${l.email}`} className="flex items-center gap-1.5">
                    <Mail size={13} /> {l.email}
                  </a>
                  {l.phone && (
                    <a href={`tel:${l.phone}`} className="flex items-center gap-1.5">
                      <Phone size={13} /> {l.phone}
                    </a>
                  )}
                  {l.device && <span className="text-nv-text-muted">Model: {l.device}</span>}
                </div>
                {l.message && <p className="mt-2 text-nv-text-muted whitespace-pre-wrap">{l.message}</p>}
                <select
                  value={l.status}
                  onChange={(e) => patch({ table: "leads", id: l.id, status: e.target.value })}
                  className="mt-3 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm px-2 py-1.5 text-nv-text-primary"
                  aria-label="Lead status"
                >
                  {LEAD_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
