"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  FileCode2,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthGuard from "./AuthGuard";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Inbox", icon: Mail, path: "/admin/inbox" },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Documents", icon: FileCode2, path: "/admin/documents" },
  { label: "Verify", icon: ShieldCheck, path: "/admin/verification" },
  { label: "Proposals", icon: FileText, path: "/admin/proposals" },
  { label: "Invoices", icon: Receipt, path: "/admin/invoices" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Devices", icon: Smartphone, path: "/admin/devices" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

// Mobile bottom nav — show top 5
const mobileNavItems = navItems.slice(0, 5);

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function AppShell({ children, title, showBack }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-nv-void flex">
        {/* ── Desktop Sidebar ── */}
        <aside
          className={cn(
            "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-white/5 bg-nv-abyss transition-all duration-300",
            collapsed ? "w-[68px]" : "w-60"
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-white/5">
            {!collapsed && (
              <span className="font-display font-bold text-lg nv-gradient-text-teal">
                NexaVision
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5 transition-colors",
                collapsed ? "mx-auto" : "ml-auto"
              )}
            >
              <ChevronLeft
                size={18}
                className={cn(
                  "transition-transform",
                  collapsed && "rotate-180"
                )}
              />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive(item.path)
                    ? "bg-nv-teal/10 text-nv-teal shadow-nv-glow-sm"
                    : "text-nv-text-secondary hover:text-nv-text-primary hover:bg-white/5"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-nv-teal text-nv-abyss text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-nv-text-muted hover:text-nv-error hover:bg-nv-error/10 transition-colors"
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut size={20} className="shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* ── Mobile Sidebar Overlay ── */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <aside
              className="w-64 h-full bg-nv-abyss border-r border-white/5 p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-display font-bold text-lg nv-gradient-text-teal">
                  NexaVision
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive(item.path)
                        ? "bg-nv-teal/10 text-nv-teal"
                        : "text-nv-text-secondary hover:text-nv-text-primary hover:bg-white/5"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-nv-text-muted hover:text-nv-error hover:bg-nv-error/10 transition-colors"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </aside>
          </div>
        )}

        {/* ── Main Content ── */}
        <div
          className={cn(
            "flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300",
            collapsed ? "lg:ml-[68px]" : "lg:ml-60"
          )}
        >
          {/* Header */}
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-white/5 bg-nv-abyss/80 backdrop-blur-xl">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5"
            >
              <Menu size={22} />
            </button>

            {showBack && (
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {title && (
              <h1 className="font-display font-semibold text-base text-nv-text-primary truncate">
                {title}
              </h1>
            )}
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-nv-abyss/95 backdrop-blur-xl border-t border-white/5"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around h-14">
            {mobileNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
                  isActive(item.path)
                    ? "text-nv-teal"
                    : "text-nv-text-muted"
                )}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </AuthGuard>
  );
}
