"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/admin/AppShell";
import {
  Users,
  Plus,
  Search,
  Building2,
  User as UserIcon,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  customer_type: string;
  created_at: string;
}

const typeColors: Record<string, string> = {
  prospect: "text-nv-info bg-nv-info/10 border-nv-info/20",
  active: "text-nv-success bg-nv-success/10 border-nv-success/20",
  retainer: "text-nv-teal bg-nv-teal/10 border-nv-teal/20",
  past: "text-nv-text-muted bg-white/5 border-white/10",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    phone: "",
    customer_type: "prospect",
  });

  const supabase = createClient();

  const loadCustomers = async () => {
    setLoading(true);
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("customer_type", filter);
    }

    const { data } = await query;
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, [filter]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(s) ||
      c.last_name?.toLowerCase().includes(s) ||
      c.company_name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("customers").insert({
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      company_name: form.company_name || null,
      email: form.email || null,
      phone: form.phone || null,
      customer_type: form.customer_type,
    });

    if (!error) {
      setShowForm(false);
      setForm({
        first_name: "",
        last_name: "",
        company_name: "",
        email: "",
        phone: "",
        customer_type: "prospect",
      });
      loadCustomers();
    }
    setSaving(false);
  };

  return (
    <AppShell title="Customers">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-nv-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-9 pr-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "prospect", "active", "retainer", "past"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full border transition-all capitalize whitespace-nowrap",
                  filter === t
                    ? "bg-nv-teal/10 text-nv-teal border-nv-teal/30"
                    : "text-nv-text-muted border-white/10 hover:border-white/20"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="nv-btn-primary py-2 px-4 text-xs"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-nv-teal animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="nv-glass rounded-nv-lg p-8 text-center">
            <Users size={32} className="text-nv-text-muted mx-auto mb-3" />
            <p className="text-nv-text-muted text-sm">
              {customers.length === 0
                ? "No customers yet. Add your first one."
                : "No customers match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="nv-glass rounded-nv-lg p-4 flex items-center gap-4 hover:border-nv-teal/20 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-nv-deep border border-white/10 flex items-center justify-center shrink-0">
                  {c.company_name ? (
                    <Building2 size={18} className="text-nv-teal" />
                  ) : (
                    <UserIcon size={18} className="text-nv-violet" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-nv-text-primary truncate">
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                      c.company_name ||
                      "Unnamed"}
                  </p>
                  <p className="text-xs text-nv-text-muted truncate">
                    {c.email || c.phone || "No contact info"}
                  </p>
                </div>
                {c.company_name && (
                  <span className="hidden md:block text-xs text-nv-text-secondary truncate max-w-[200px]">
                    {c.company_name}
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                    typeColors[c.customer_type] || typeColors.prospect
                  )}
                >
                  {c.customer_type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Create Customer Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <div
              className="w-full max-w-md nv-glass-elevated rounded-nv-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-lg text-nv-text-primary">
                  New Customer
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-nv-text-muted hover:text-nv-teal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    placeholder="First name"
                    className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                  />
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    placeholder="Last name"
                    className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                  />
                </div>

                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                  placeholder="Company name"
                  className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                />

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="Email"
                  className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                />

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="Phone"
                  className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                />

                <select
                  value={form.customer_type}
                  onChange={(e) =>
                    setForm({ ...form, customer_type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary focus:outline-none focus:border-nv-teal/50 transition-all"
                >
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="retainer">Retainer</option>
                  <option value="past">Past</option>
                </select>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full nv-btn-primary py-2.5 mt-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Create Customer"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
