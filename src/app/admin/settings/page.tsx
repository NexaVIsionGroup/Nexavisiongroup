"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/admin/AppShell";
import {
  UserPlus,
  Copy,
  Check,
  Loader2,
  Shield,
  Mail,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailAccount {
  id: string;
  email: string;
  display_name: string;
  color: string;
  initials: string;
  is_default: boolean;
  active: boolean;
}

const PRESET_COLORS = [
  "#00E5CC", "#7B5EA7", "#FF6B35", "#3B82F6", "#22C55E",
  "#EAB308", "#EF4444", "#EC4899", "#8B5CF6", "#06B6D4",
];

export default function SettingsPage() {
  // Team
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [inviteRole, setInviteRole] = useState("team_member");

  // Email accounts
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    email: "",
    display_name: "",
    color: "#00E5CC",
    initials: "",
    is_default: false,
  });

  const supabase = createClient();

  // ── Fetch email accounts ──
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    const res = await fetch("/api/admin/email-accounts");
    const data = await res.json();
    setAccounts(data.accounts || []);
    setLoadingAccounts(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // ── Team invite ──
  const generateInvite = async () => {
    setGenerating(true);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 30);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("invite_tokens").insert({
      token,
      role: inviteRole,
      created_by: user?.email || "unknown",
    });

    setInviteLink(`${window.location.origin}/admin/join/${token}`);
    setGenerating(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Email account CRUD ──
  const openCreateForm = () => {
    setEditingAccount(null);
    setAccountForm({ email: "", display_name: "", color: "#00E5CC", initials: "", is_default: false });
    setShowAccountForm(true);
  };

  const openEditForm = (account: EmailAccount) => {
    setEditingAccount(account);
    setAccountForm({
      email: account.email,
      display_name: account.display_name,
      color: account.color,
      initials: account.initials,
      is_default: account.is_default,
    });
    setShowAccountForm(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);

    const initials =
      accountForm.initials ||
      accountForm.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const payload = editingAccount
      ? { action: "update", account: { ...accountForm, initials, id: editingAccount.id } }
      : { action: "create", account: { ...accountForm, initials } };

    await fetch("/api/admin/email-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingAccount(false);
    setShowAccountForm(false);
    fetchAccounts();
  };

  const handleDeleteAccount = async (account: EmailAccount) => {
    if (!confirm(`Remove ${account.email}?`)) return;
    await fetch("/api/admin/email-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", account: { id: account.id } }),
    });
    fetchAccounts();
  };

  const handleSetDefault = async (account: EmailAccount) => {
    await fetch("/api/admin/email-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default", account: { id: account.id } }),
    });
    fetchAccounts();
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ── Email Accounts ── */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center gap-3 mb-5">
            <Mail size={20} className="text-nv-teal" />
            <h3 className="font-display font-semibold text-nv-text-primary flex-1">
              Email Accounts
            </h3>
            <button onClick={openCreateForm} className="nv-btn-primary py-1.5 px-3 text-xs">
              <Plus size={14} /> Add Account
            </button>
          </div>

          {loadingAccounts ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="text-nv-teal animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-nv-text-muted text-sm text-center py-6">
              No email accounts configured.
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 p-3 rounded-nv-md bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Color badge */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: account.color + "20", color: account.color }}
                  >
                    {account.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-nv-text-primary truncate">
                        {account.display_name}
                      </p>
                      {account.is_default && (
                        <span className="text-[10px] font-bold text-nv-teal bg-nv-teal/10 px-1.5 py-0.5 rounded">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-nv-text-muted truncate">{account.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!account.is_default && (
                      <button
                        onClick={() => handleSetDefault(account)}
                        title="Set as default"
                        className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-warning hover:bg-white/5 transition-colors"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(account)}
                      className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account)}
                      className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-error hover:bg-white/5 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Team & Access ── */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center gap-3 mb-5">
            <Shield size={20} className="text-nv-teal" />
            <h3 className="font-display font-semibold text-nv-text-primary">
              Team & Access
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-nv-text-secondary text-sm font-medium mb-2">
                Invite a team member
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary focus:outline-none focus:border-nv-teal/50 transition-all"
                >
                  <option value="team_member">Team Member</option>
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                </select>
                <button
                  onClick={generateInvite}
                  disabled={generating}
                  className="nv-btn-primary py-2 px-4 text-xs"
                >
                  {generating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Generate Link
                    </>
                  )}
                </button>
              </div>

              {inviteLink && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-xs text-nv-teal font-mono truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 rounded-lg bg-white/5 hover:bg-nv-teal/10 text-nv-text-muted hover:text-nv-teal transition-colors"
                  >
                    {copied ? (
                      <Check size={16} className="text-nv-success" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Create/Edit Email Account Modal ── */}
        {showAccountForm && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAccountForm(false)}
          >
            <div
              className="w-full max-w-md nv-glass-elevated rounded-nv-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-lg text-nv-text-primary">
                  {editingAccount ? "Edit Email Account" : "New Email Account"}
                </h3>
                <button
                  onClick={() => setShowAccountForm(false)}
                  className="text-nv-text-muted hover:text-nv-teal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    placeholder="name@nexavisiongroup.com"
                    className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={accountForm.display_name}
                    onChange={(e) => setAccountForm({ ...accountForm, display_name: e.target.value })}
                    placeholder="NexaVision Support"
                    className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">
                      Initials
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={accountForm.initials}
                      onChange={(e) =>
                        setAccountForm({ ...accountForm, initials: e.target.value.toUpperCase() })
                      }
                      placeholder="Auto"
                      className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">
                      Badge Color
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAccountForm({ ...accountForm, color: c })}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all",
                            accountForm.color === c
                              ? "border-white scale-110"
                              : "border-transparent hover:border-white/30"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 rounded-nv-md bg-white/[0.03] border border-white/5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: accountForm.color + "20",
                      color: accountForm.color,
                    }}
                  >
                    {accountForm.initials ||
                      accountForm.display_name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ||
                      "??"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-nv-text-primary">
                      {accountForm.display_name || "Display Name"}
                    </p>
                    <p className="text-xs text-nv-text-muted">
                      {accountForm.email || "email@nexavisiongroup.com"}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingAccount}
                  className="w-full nv-btn-primary py-2.5 disabled:opacity-50"
                >
                  {savingAccount ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingAccount ? (
                    "Save Changes"
                  ) : (
                    "Create Account"
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
