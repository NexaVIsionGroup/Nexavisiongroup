"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/admin/AppShell";
import {
  Users,
  FileText,
  Receipt,
  Mail,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalCustomers: number;
  openProposals: number;
  unpaidInvoices: number;
  unreadEmails: number;
  revenueThisMonth: number;
  pipelineValue: number;
}

const defaultStats: DashboardStats = {
  totalCustomers: 0,
  openProposals: 0,
  unpaidInvoices: 0,
  unreadEmails: 0,
  revenueThisMonth: 0,
  pipelineValue: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }

      // TODO: Fetch real stats from Supabase
      // For now, show placeholder
      setStats(defaultStats);
      setLoading(false);
    };

    loadDashboard();
  }, [supabase]);

  const statCards = [
    {
      label: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-nv-teal",
      bgColor: "bg-nv-teal/10",
    },
    {
      label: "Open Proposals",
      value: stats.openProposals,
      icon: FileText,
      color: "text-nv-violet",
      bgColor: "bg-nv-violet/10",
    },
    {
      label: "Unpaid Invoices",
      value: stats.unpaidInvoices,
      icon: Receipt,
      color: "text-nv-ember",
      bgColor: "bg-nv-ember/10",
    },
    {
      label: "Unread Emails",
      value: stats.unreadEmails,
      icon: Mail,
      color: "text-nv-info",
      bgColor: "bg-nv-info/10",
    },
  ];

  const revenueCards = [
    {
      label: "Revenue This Month",
      value: `$${stats.revenueThisMonth.toLocaleString()}`,
      icon: DollarSign,
      color: "text-nv-success",
    },
    {
      label: "Pipeline Value",
      value: `$${stats.pipelineValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-nv-teal",
    },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="font-display font-bold text-display-sm text-nv-text-primary">
            {loading ? "Loading..." : `Welcome back${userName ? `, ${userName}` : ""}`}
          </h2>
          <p className="text-nv-text-secondary mt-1">
            Here&apos;s what&apos;s happening today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="nv-glass rounded-nv-lg p-4 hover:border-nv-teal/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    card.bgColor
                  )}
                >
                  <card.icon size={18} className={card.color} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-nv-text-primary">
                {loading ? "—" : card.value}
              </p>
              <p className="text-nv-text-muted text-sm mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          {revenueCards.map((card) => (
            <div
              key={card.label}
              className="nv-glass rounded-nv-lg p-5 hover:border-nv-teal/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <card.icon size={20} className={card.color} />
                <span className="text-nv-text-secondary text-sm">
                  {card.label}
                </span>
              </div>
              <p className="text-3xl font-display font-bold text-nv-text-primary mt-2">
                {loading ? "—" : card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="nv-glass rounded-nv-lg p-5">
          <h3 className="font-display font-semibold text-nv-text-primary mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "New Proposal", icon: FileText, href: "/admin/proposals" },
              { label: "New Invoice", icon: Receipt, href: "/admin/invoices" },
              { label: "Compose Email", icon: Mail, href: "/admin/inbox" },
              { label: "Add Customer", icon: Users, href: "/admin/customers" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-nv-md bg-white/[0.03] border border-white/5 hover:border-nv-teal/30 hover:bg-nv-teal/5 transition-all text-center"
              >
                <action.icon
                  size={22}
                  className="text-nv-teal"
                />
                <span className="text-sm text-nv-text-secondary">
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="nv-glass rounded-nv-lg p-5">
          <h3 className="font-display font-semibold text-nv-text-primary mb-4">
            Recent Activity
          </h3>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Clock size={32} className="text-nv-text-muted mb-3" />
            <p className="text-nv-text-muted text-sm">
              Activity will appear here once you start using the system.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
