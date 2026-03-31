"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Inbox, Send, FileEdit, Star, Trash2, AlertOctagon,
  Search, RefreshCw, ChevronLeft, Archive, MailOpen,
  Reply, Forward, Mail, X, Check, Loader2, Users,
  Paperclip, Menu, Pencil, MoreVertical, ChevronDown, Plus, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──
interface Thread {
  thread_id: string; subject: string; to_email: string; from_email: string;
  latest_message: string; latest_body_preview: string; latest_direction: string;
  message_count: number; unread_count: number; starred: boolean;
  has_attachments: boolean; created_at: string;
}
interface Message {
  id: string; thread_id: string; direction: string; from_email: string;
  to_email: string; subject: string; body_html: string | null;
  body_text: string | null; read: boolean; starred: boolean;
  folder: string; created_at: string; cc_emails: string[]; bcc_emails: string[];
  attachments: { id: string; filename: string; content_type: string; size_bytes: number; s3_url: string }[];
}
interface EmailAccount { id?: string; email: string; display_name: string; color: string; initials: string; is_default?: boolean; }
interface Contact { id: string; name: string; email: string; phone: string | null; company: string | null; category: string; }

type Folder = "inbox" | "sent" | "drafts" | "starred" | "trash" | "spam";
type ComposeMode = "new" | "reply" | "forward" | null;
type View = "list" | "thread" | "compose" | "accounts";

const FOLDERS: { key: Folder; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "spam", label: "Spam", icon: AlertOctagon },
];

// Get first letter for avatar
function getInitial(email: string): string {
  return email.charAt(0).toUpperCase();
}

// Random-ish color from email
function avatarColor(email: string): string {
  const colors = ["#EC4899", "#8B5CF6", "#3B82F6", "#22C55E", "#EAB308", "#EF4444", "#06B6D4", "#F97316", "#7B5EA7", "#00E5CC"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function AdminInbox() {
  // ── State ──
  const [view, setView] = useState<View>("list");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState("");

  // Compose
  const [composeMode, setComposeMode] = useState<ComposeMode>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeFiles, setComposeFiles] = useState<{name: string; size: number; base64: string; type: string}[]>([]);
  const composeFileRef = useRef<HTMLInputElement>(null);

  // Accounts
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<EmailAccount | null>(null);
  const [fromAccount, setFromAccount] = useState("");

  // Account management
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: "", display_name: "", color: "#00E5CC", initials: "" });

  const PRESET_COLORS = ["#00E5CC","#7B5EA7","#FF6B35","#3B82F6","#22C55E","#EAB308","#EF4444","#EC4899","#8B5CF6","#06B6D4"];

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({ email: "", display_name: "", color: "#00E5CC", initials: "" });
    setShowAccountForm(true);
  };

  const openEditAccount = (account: EmailAccount) => {
    setEditingAccount(account);
    setAccountForm({ email: account.email, display_name: account.display_name, color: account.color, initials: account.initials });
    setShowAccountForm(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    const initials = accountForm.initials || accountForm.display_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const payload = editingAccount
      ? { action: "update", account: { ...accountForm, initials, id: editingAccount.id } }
      : { action: "create", account: { ...accountForm, initials } };
    await fetch("/api/admin/email-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSavingAccount(false);
    setShowAccountForm(false);
    fetchAccounts();
    showToast(editingAccount ? "Account updated" : "Account added");
  };

  const handleDeleteAccount = async (account: EmailAccount) => {
    if (!confirm(`Remove ${account.email}?`)) return;
    await fetch("/api/admin/email-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", account: { id: account.id } }) });
    if (activeAccount?.email === account.email) setActiveAccount(null);
    fetchAccounts();
    showToast("Account removed");
  };

  const handleSetDefault = async (account: EmailAccount) => {
    await fetch("/api/admin/email-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_default", account: { id: account.id } }) });
    fetchAccounts();
  };

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<NodeJS.Timeout>();
  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch accounts ──
  const fetchAccounts = async () => {
    const res = await fetch("/api/admin/email-accounts");
    const data = await res.json();
    if (data.accounts?.length) {
      setAccounts(data.accounts);
      if (!activeAccount) {
        const def = data.accounts.find((a: EmailAccount) => a.is_default) || data.accounts[0];
        setActiveAccount(def);
        setFromAccount(def.email);
      }
    }
  };
  useEffect(() => { fetchAccounts(); }, []);

  // ── Fetch threads ──
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ folder });
    if (activeAccount) params.set("account", activeAccount.email);
    const res = await fetch(`/api/email/threads?${params}`);
    const data = await res.json();
    setThreads(data.threads || []);
    setFolderCounts(data.folderCounts || {});
    setLoading(false);
  }, [folder, activeAccount]);
  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  // ── Open thread ──
  const openThread = async (thread: Thread) => {
    setSelectedThread(thread);
    setView("thread");
    setLoadingThread(true);
    const res = await fetch("/api/email/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: thread.thread_id, account: activeAccount?.email }),
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingThread(false);
    setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, unread_count: 0 } : t));
  };

  // ── Thread actions ──
  const threadAction = async (action: string, threadIds?: string[]) => {
    const ids = threadIds || (selectedThread ? [selectedThread.thread_id] : []);
    if (!ids.length) return;
    await fetch("/api/email/threads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_ids: ids, action, account: activeAccount?.email }),
    });
    showToast(action === "trash" ? "Moved to trash" : action === "star" ? "Starred" : "Updated");
    if (action === "trash" && view === "thread") setView("list");
    fetchThreads();
  };

  // ── Compose ──
  const startCompose = (mode: ComposeMode, replyMsg?: Message) => {
    setComposeMode(mode);
    setFromAccount(activeAccount?.email || accounts[0]?.email || "");
    if (mode === "new") {
      setComposeTo(""); setComposeSubject(""); setComposeBody("");
    } else if (mode === "reply" && replyMsg) {
      setComposeTo(replyMsg.direction === "inbound" ? replyMsg.from_email : replyMsg.to_email);
      setComposeSubject(replyMsg.subject.startsWith("Re:") ? replyMsg.subject : `Re: ${replyMsg.subject}`);
      setComposeBody("");
    } else if (mode === "forward" && replyMsg) {
      setComposeTo("");
      setComposeSubject(`Fwd: ${replyMsg.subject.replace(/^Fwd:\s*/i, "")}`);
      setComposeBody(`\n\n---------- Forwarded message ----------\nFrom: ${replyMsg.from_email}\nDate: ${new Date(replyMsg.created_at).toLocaleString()}\nSubject: ${replyMsg.subject}\n\n${replyMsg.body_text || ""}`);
    }
    setShowCcBcc(false); setComposeCc(""); setComposeBcc("");
    setComposeFiles([]);
    setView("compose");
  };

  const handleSend = async () => {
    if (!composeTo || !composeSubject) return;
    setSending(true);
    const isReply = composeMode === "reply" && selectedThread;
    const endpoint = isReply ? "/api/email/reply" : "/api/email/compose";
    const payload = isReply
      ? { thread_id: selectedThread!.thread_id, to_email: composeTo, subject: composeSubject, reply_body: composeBody, from_email: fromAccount, attachments: composeFiles.map(f => ({ filename: f.name, content: f.base64, type: f.type })) }
      : { to_email: composeTo, subject: composeSubject, body: composeBody, from_email: fromAccount, cc_emails: composeCc ? composeCc.split(",").map(e => e.trim()) : [], bcc_emails: composeBcc ? composeBcc.split(",").map(e => e.trim()) : [], attachments: composeFiles.map(f => ({ filename: f.name, content: f.base64, type: f.type })) };
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSending(false);
    if (res.ok) { showToast("Email sent"); setView("list"); fetchThreads(); } else { showToast("Failed to send"); }
  };

  // ── Helpers ──
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filtered = threads.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.subject.toLowerCase().includes(s) || t.to_email.toLowerCase().includes(s) || t.from_email.toLowerCase().includes(s) || t.latest_body_preview.toLowerCase().includes(s);
  });

  // ═══════════════════════════════════════════
  // ACCOUNT SWITCHER — Full screen overlay
  // ═══════════════════════════════════════════
  if (view === "accounts") {
    return (
      <div className="fixed inset-0 z-[60] bg-nv-void flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <span className="flex-1 text-base font-semibold text-nv-text-primary">Email Accounts</span>
          <button onClick={openAddAccount} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-nv-teal text-nv-abyss text-xs font-bold">
            <Plus size={13} /> Add Account
          </button>
          <button onClick={() => setView("list")} className="p-2 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
            <X size={22} />
          </button>
        </div>

        {/* Account list */}
        <div className="flex-1 overflow-y-auto">
          {/* All accounts option */}
          <button
            onClick={() => { setActiveAccount(null); setView("list"); }}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]",
              !activeAccount && "bg-nv-teal/5"
            )}
          >
            <div className="w-11 h-11 rounded-full bg-nv-deep border border-white/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-nv-text-muted" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-nv-text-primary">All Accounts</p>
              <p className="text-[13px] text-nv-text-muted">View all inboxes</p>
            </div>
            {!activeAccount && <Check size={16} className="text-nv-teal shrink-0" />}
          </button>

          {accounts.map(account => (
            <div
              key={account.email}
              className={cn(
                "flex items-center gap-4 px-5 py-4 border-b border-white/[0.04]",
                activeAccount?.email === account.email && "bg-nv-teal/5"
              )}
            >
              {/* Avatar — tap to switch */}
              <button
                onClick={() => { setActiveAccount(account); setFromAccount(account.email); setView("list"); }}
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-opacity hover:opacity-80"
                style={{ backgroundColor: account.color + "25", color: account.color }}
              >
                {account.initials}
              </button>
              {/* Info — tap to switch */}
              <button
                onClick={() => { setActiveAccount(account); setFromAccount(account.email); setView("list"); }}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-medium text-nv-text-primary truncate">{account.display_name}</p>
                  {account.is_default && (
                    <span className="text-[10px] font-bold text-nv-teal bg-nv-teal/10 px-1.5 py-0.5 rounded shrink-0">DEFAULT</span>
                  )}
                </div>
                <p className="text-[13px] text-nv-text-muted truncate">{account.email}</p>
              </button>
              {/* Active check */}
              {activeAccount?.email === account.email && <Check size={16} className="text-nv-teal shrink-0" />}
              {/* Edit/delete actions */}
              <div className="flex items-center gap-0.5 shrink-0 ml-1">
                {!account.is_default && (
                  <button onClick={() => handleSetDefault(account)} title="Set as default"
                    className="p-2 rounded-full text-nv-text-muted hover:text-nv-warning hover:bg-white/5 transition-colors">
                    <Star size={14} />
                  </button>
                )}
                <button onClick={() => openEditAccount(account)}
                  className="p-2 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDeleteAccount(account)}
                  className="p-2 rounded-full text-nv-text-muted hover:text-nv-error hover:bg-white/5 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="text-center text-nv-text-muted text-sm py-16">No accounts configured</div>
          )}
        </div>

        {/* Add/Edit Account Modal */}
        {showAccountForm && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAccountForm(false)}>
            <div className="w-full sm:max-w-md bg-nv-deep border border-white/10 rounded-t-2xl sm:rounded-2xl p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-lg text-nv-text-primary">
                  {editingAccount ? "Edit Account" : "New Email Account"}
                </h3>
                <button onClick={() => setShowAccountForm(false)} className="text-nv-text-muted hover:text-nv-teal">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Email Address</label>
                  <input type="email" required value={accountForm.email}
                    onChange={e => setAccountForm({ ...accountForm, email: e.target.value })}
                    placeholder="name@nexavisiongroup.com"
                    className="w-full px-3 py-2.5 bg-nv-void/60 border border-white/10 rounded-xl text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
                </div>
                <div>
                  <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Display Name</label>
                  <input type="text" required value={accountForm.display_name}
                    onChange={e => setAccountForm({ ...accountForm, display_name: e.target.value })}
                    placeholder="NexaVision Support"
                    className="w-full px-3 py-2.5 bg-nv-void/60 border border-white/10 rounded-xl text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Initials</label>
                    <input type="text" maxLength={2} value={accountForm.initials}
                      onChange={e => setAccountForm({ ...accountForm, initials: e.target.value.toUpperCase() })}
                      placeholder="Auto"
                      className="w-full px-3 py-2.5 bg-nv-void/60 border border-white/10 rounded-xl text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
                  </div>
                  <div>
                    <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Color</label>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setAccountForm({ ...accountForm, color: c })}
                          className={cn("w-6 h-6 rounded-full border-2 transition-all", accountForm.color === c ? "border-white scale-110" : "border-transparent hover:border-white/30")}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Preview */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: accountForm.color + "20", color: accountForm.color }}>
                    {accountForm.initials || accountForm.display_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-nv-text-primary">{accountForm.display_name || "Display Name"}</p>
                    <p className="text-xs text-nv-text-muted">{accountForm.email || "email@nexavisiongroup.com"}</p>
                  </div>
                </div>
                <button type="submit" disabled={savingAccount}
                  className="w-full py-3 rounded-xl bg-nv-teal text-nv-abyss font-display font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingAccount ? <Loader2 size={16} className="animate-spin" /> : editingAccount ? "Save Changes" : "Add Account"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // COMPOSE — Full screen
  // ═══════════════════════════════════════════
  if (view === "compose") {
    return (
      <div className="fixed inset-0 z-[60] bg-nv-void flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <button onClick={() => setView(selectedThread ? "thread" : "list")} className="p-1.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
            <X size={22} />
          </button>
          <h2 className="font-display font-semibold text-base text-nv-text-primary flex-1">
            {composeMode === "new" ? "Compose" : composeMode === "reply" ? "Reply" : "Forward"}
          </h2>
          <button onClick={handleSend} disabled={sending || !composeTo || !composeSubject}
            className="px-5 py-2 bg-nv-teal text-nv-abyss font-display font-bold text-sm rounded-full disabled:opacity-40 transition-opacity">
            {sending ? <Loader2 size={16} className="animate-spin" /> : "Send"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {accounts.length > 1 && (
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <span className="text-nv-text-muted text-sm w-14">From</span>
              <select value={fromAccount} onChange={e => setFromAccount(e.target.value)}
                className="flex-1 px-3 py-2 bg-transparent text-sm text-nv-text-primary focus:outline-none">
                {accounts.map(a => <option key={a.email} value={a.email}>{a.display_name} &lt;{a.email}&gt;</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3 pb-2 border-b border-white/5">
            <span className="text-nv-text-muted text-sm w-14">To</span>
            <input type="email" value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="Recipient"
              className="flex-1 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
            {!showCcBcc && <button onClick={() => setShowCcBcc(true)} className="text-xs text-nv-text-muted hover:text-nv-teal px-2">Cc/Bcc</button>}
          </div>
          {showCcBcc && (
            <>
              <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                <span className="text-nv-text-muted text-sm w-14">Cc</span>
                <input type="text" value={composeCc} onChange={e => setComposeCc(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
              </div>
              <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                <span className="text-nv-text-muted text-sm w-14">Bcc</span>
                <input type="text" value={composeBcc} onChange={e => setComposeBcc(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
              </div>
            </>
          )}
          <div className="flex items-center gap-3 pb-2 border-b border-white/5">
            <span className="text-nv-text-muted text-sm w-14">Subject</span>
            <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject"
              className="flex-1 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
          </div>
          <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Compose email"
            rows={12}
            className="w-full bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none resize-none mt-2 leading-relaxed" />

          {/* Attachments */}
          <input ref={composeFileRef} type="file" multiple className="hidden" onChange={async (e) => {
            const selected = e.target.files;
            if (!selected) return;
            const newFiles: typeof composeFiles = [];
            for (let i = 0; i < selected.length; i++) {
              const file = selected[i];
              if (file.size > 10 * 1024 * 1024) continue;
              const base64 = await new Promise<string>((res, rej) => {
                const r = new FileReader();
                r.onload = () => res((r.result as string).split(",")[1]);
                r.onerror = rej;
                r.readAsDataURL(file);
              });
              newFiles.push({ name: file.name, size: file.size, base64, type: file.type || "application/octet-stream" });
            }
            setComposeFiles(prev => [...prev, ...newFiles]);
            if (composeFileRef.current) composeFileRef.current.value = "";
          }} />

          {composeFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {composeFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-nv-text-secondary">
                  <Paperclip size={12} className="text-nv-teal" />
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => setComposeFiles(prev => prev.filter((_, j) => j !== i))} className="text-nv-text-muted hover:text-nv-error ml-1"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => composeFileRef.current?.click()} className="flex items-center gap-2 mt-3 text-xs text-nv-text-muted hover:text-nv-teal transition-colors">
            <Paperclip size={14} /> Attach files
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // THREAD VIEW — Full screen
  // ═══════════════════════════════════════════
  if (view === "thread" && selectedThread) {
    return (
      <div className="fixed inset-0 z-[60] bg-nv-void flex flex-col">
        {/* Thread toolbar */}
        <div className="flex items-center gap-1 px-2 py-2 border-b border-white/5">
          <button onClick={() => { setView("list"); setSelectedThread(null); }} className="p-2 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1" />
          <button onClick={() => threadAction("trash")} className="p-2 rounded-full text-nv-text-muted hover:text-nv-error hover:bg-white/5">
            <Trash2 size={20} />
          </button>
          <button onClick={() => threadAction(selectedThread.starred ? "unstar" : "star")} className="p-2 rounded-full text-nv-text-muted hover:text-nv-warning hover:bg-white/5">
            <MailOpen size={20} />
          </button>
          <button className="p-2 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Subject */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <h1 className="flex-1 text-xl font-display font-bold text-nv-text-primary leading-tight">
              {selectedThread.subject}
            </h1>
            <button onClick={() => threadAction(selectedThread.starred ? "unstar" : "star")} className="mt-1 shrink-0">
              <Star size={22} className={selectedThread.starred ? "fill-nv-warning text-nv-warning" : "text-nv-text-muted"} />
            </button>
          </div>
          <span className="inline-block mt-2 text-[11px] font-medium text-nv-text-muted bg-white/5 border border-white/10 rounded px-2 py-0.5">
            Inbox
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {loadingThread ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
          ) : messages.map(msg => (
            <div key={msg.id} className="bg-nv-deep/50 rounded-2xl p-4">
              {/* Sender row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: avatarColor(msg.from_email) + "30", color: avatarColor(msg.from_email) }}>
                  {getInitial(msg.from_email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-nv-text-primary">{msg.from_email.split("@")[0]}</span>
                    <span className="text-xs text-nv-text-muted">{new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-xs text-nv-text-muted">to {msg.direction === "outbound" ? msg.to_email : "me"} <ChevronDown size={10} className="inline" /></p>
                </div>
                <button className="p-1.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
                  <Reply size={18} />
                </button>
                <button className="p-1.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Body */}
              {msg.body_html ? (
                <div className="overflow-x-auto -mx-4 px-4">
                  <div
                    className="text-sm text-nv-text-secondary leading-relaxed [&_a]:text-nv-teal [&_img]:max-w-full [&_img]:h-auto"
                    dangerouslySetInnerHTML={{ __html: msg.body_html }}
                  />
                </div>
              ) : (
                <pre className="text-sm text-nv-text-secondary whitespace-pre-wrap font-body leading-relaxed">{msg.body_text || "(no content)"}</pre>
              )}

              {/* Attachments */}
              {msg.attachments?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.attachments.map(att => (
                    <a key={att.id} href={att.s3_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-nv-teal hover:border-nv-teal/30">
                      <Paperclip size={12} /> {att.filename}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply / Forward bar — pinned bottom */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/5" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <button onClick={() => startCompose("reply", messages[messages.length - 1])}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-nv-text-secondary hover:text-nv-text-primary transition-colors">
            <Reply size={16} /> Reply
          </button>
          <button onClick={() => startCompose("forward", messages[messages.length - 1])}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-nv-text-secondary hover:text-nv-text-primary transition-colors">
            <Forward size={16} /> Forward
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // SIDEBAR — Slides from left, ~80% width
  // ═══════════════════════════════════════════
  const Sidebar = () => (
    <div className="fixed inset-0 z-[60]" onClick={() => setSidebarOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-nv-abyss flex flex-col animate-nv-slide-in-left" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <span className="font-display font-bold text-lg nv-gradient-text-teal">NexaVision</span>
          {/* Account avatar — tapping opens account switcher */}
          {activeAccount && (
            <button onClick={() => { setSidebarOpen(false); setView("accounts"); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: activeAccount.color + "25", color: activeAccount.color }}>
              {activeAccount.initials}
            </button>
          )}
        </div>

        {/* Folders */}
        <nav className="flex-1 overflow-y-auto px-2">
          {FOLDERS.map(f => (
            <button key={f.key} onClick={() => { setFolder(f.key); setSidebarOpen(false); setSelectedThread(null); setView("list"); }}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-full text-[15px] font-medium transition-colors mb-0.5",
                folder === f.key ? "bg-nv-teal/10 text-nv-teal" : "text-nv-text-secondary hover:bg-white/5"
              )}>
              <f.icon size={20} />
              <span className="flex-1 text-left">{f.label}</span>
              {(folderCounts[f.key] || 0) > 0 && (
                <span className="text-sm">{folderCounts[f.key]}</span>
              )}
            </button>
          ))}

          <div className="h-px bg-white/5 my-3 mx-4" />

          {/* Contacts */}
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-[15px] font-medium text-nv-text-secondary hover:bg-white/5">
            <Users size={20} /> <span className="flex-1 text-left">Contacts</span>
          </button>
        </nav>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // MAIN LIST VIEW
  // ═══════════════════════════════════════════
  return (
    <div className="h-full flex flex-col bg-nv-void relative">
      {sidebarOpen && <Sidebar />}

      {/* Top bar — Gmail style: hamburger, search pill, avatar */}
      <div className="flex items-center gap-3 px-4 py-2">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
          <Menu size={24} />
        </button>

        <div className="flex-1 relative">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-nv-deep rounded-full border border-white/5">
            <Search size={18} className="text-nv-text-muted shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search in mail"
              className="flex-1 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
          </div>
        </div>

        {/* Account avatar — opens account switcher */}
        <button onClick={() => setView("accounts")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={activeAccount ? { backgroundColor: activeAccount.color + "25", color: activeAccount.color } : { backgroundColor: "#1C2D4A", color: "#8896A6" }}>
          {activeAccount ? activeAccount.initials : "All"}
        </button>
      </div>

      {/* Folder label */}
      <div className="px-5 py-1.5">
        <span className="text-sm font-medium text-nv-text-muted capitalize">{folder}</span>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Mail size={40} className="text-nv-text-muted/30 mb-4" />
            <p className="text-nv-text-muted text-sm">{search ? "No emails match your search." : "No emails in this folder."}</p>
          </div>
        ) : filtered.map(thread => {
          const senderEmail = folder === "sent" ? thread.to_email : thread.from_email;
          const senderName = senderEmail.split("@")[0];
          return (
            <button key={thread.thread_id} onClick={() => openThread(thread)}
              className={cn(
                "w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors active:bg-white/[0.03]",
                thread.unread_count > 0 && "bg-nv-teal/[0.02]"
              )}>
              {/* Avatar circle */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: avatarColor(senderEmail) + "25", color: avatarColor(senderEmail) }}>
                {getInitial(senderName)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[15px] truncate", thread.unread_count > 0 ? "font-bold text-nv-text-primary" : "font-medium text-nv-text-secondary")}>
                    {senderName}
                  </span>
                  {thread.message_count > 1 && <span className="text-xs text-nv-text-muted">{thread.message_count}</span>}
                  <span className="ml-auto text-xs text-nv-text-muted shrink-0">{timeAgo(thread.latest_message)}</span>
                  {thread.unread_count > 0 && <div className="w-2.5 h-2.5 rounded-full bg-nv-teal shrink-0" />}
                </div>
                <p className={cn("text-sm truncate mt-0.5", thread.unread_count > 0 ? "font-semibold text-nv-text-primary" : "text-nv-text-secondary")}>
                  {thread.subject}
                </p>
                <p className="text-[13px] text-nv-text-muted truncate mt-0.5">{thread.latest_body_preview}</p>
              </div>

              {/* Star */}
              <button onClick={e => { e.stopPropagation(); threadAction(thread.starred ? "unstar" : "star", [thread.thread_id]); }}
                className="mt-1 shrink-0 p-1">
                <Star size={18} className={thread.starred ? "fill-nv-warning text-nv-warning" : "text-nv-text-muted/30"} />
              </button>
            </button>
          );
        })}
      </div>

      {/* FAB Compose button — bottom right */}
      <button onClick={() => startCompose("new")}
        className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 z-30 flex items-center gap-2 px-5 py-3.5 bg-nv-deep border border-nv-teal/20 rounded-2xl shadow-nv-glow text-nv-teal font-display font-bold text-sm hover:bg-nv-slate transition-colors"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <Pencil size={18} /> Compose
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 lg:bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-nv-deep border border-nv-teal/30 rounded-full text-sm text-nv-teal shadow-nv-glow-sm animate-nv-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
