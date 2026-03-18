"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Inbox, Send, FileEdit, Star, Trash2, AlertOctagon,
  Search, RefreshCw, ChevronLeft, MoreHorizontal,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link2,
  Reply, Forward, Mail, Plus, X, Check, Loader2, Users,
  ChevronDown, Paperclip, Menu,
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
interface EmailAccount { id?: string; email: string; display_name: string; color: string; initials: string; }
interface Contact { id: string; name: string; email: string; phone: string | null; company: string | null; category: string; }

type Folder = "inbox" | "sent" | "drafts" | "starred" | "trash" | "spam";
type ComposeMode = "new" | "reply" | "forward" | null;

const FOLDERS: { key: Folder; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "starred", label: "Starred", icon: Star },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "spam", label: "Spam", icon: AlertOctagon },
];

export default function AdminInbox() {
  // ── State ──
  const [folder, setFolder] = useState<Folder>("inbox");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Compose
  const [composeMode, setComposeMode] = useState<ComposeMode>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);

  // Accounts
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [fromAccount, setFromAccount] = useState("");

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContacts, setShowContacts] = useState(false);

  // Mobile
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<NodeJS.Timeout>();

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch accounts ──
  useEffect(() => {
    fetch("/api/email/threads?folder=inbox")
      .then(r => r.json())
      .then(() => {
        // Accounts come from DB via a separate endpoint or we hardcode defaults
        setAccounts([
          { email: "hello@nexavisiongroup.com", display_name: "NexaVision Group", color: "#00E5CC", initials: "NV" },
        ]);
      });
  }, []);

  // ── Fetch threads ──
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ folder });
    if (activeAccount) params.set("account", activeAccount);
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
    setLoadingThread(true);
    setComposeMode(null);
    const res = await fetch("/api/email/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: thread.thread_id, account: activeAccount }),
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoadingThread(false);
    // Update unread count locally
    setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, unread_count: 0 } : t));
  };

  // ── Thread actions ──
  const threadAction = async (action: string, threadIds?: string[]) => {
    const ids = threadIds || (selectedThread ? [selectedThread.thread_id] : [...selected]);
    if (!ids.length) return;
    await fetch("/api/email/threads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_ids: ids, action, account: activeAccount }),
    });
    showToast(action === "trash" ? "Moved to trash" : action === "star" ? "Starred" : "Updated");
    if (action === "trash" && selectedThread) setSelectedThread(null);
    setSelected(new Set());
    fetchThreads();
  };

  // ── Compose / Reply / Forward ──
  const startCompose = (mode: ComposeMode, replyMsg?: Message) => {
    setComposeMode(mode);
    setFromAccount(activeAccount || accounts[0]?.email || "");
    if (mode === "new") {
      setComposeTo(""); setComposeSubject(""); setComposeBody("");
    } else if (mode === "reply" && replyMsg) {
      setComposeTo(replyMsg.direction === "inbound" ? replyMsg.from_email : replyMsg.to_email);
      setComposeSubject(replyMsg.subject.startsWith("Re:") ? replyMsg.subject : `Re: ${replyMsg.subject}`);
      setComposeBody("");
    } else if (mode === "forward" && replyMsg) {
      setComposeTo("");
      setComposeSubject(`Fwd: ${replyMsg.subject.replace(/^Fwd:\s*/i, "")}`);
      const fwdBody = `\n\n---------- Forwarded message ----------\nFrom: ${replyMsg.from_email}\nDate: ${new Date(replyMsg.created_at).toLocaleString()}\nSubject: ${replyMsg.subject}\n\n${replyMsg.body_text || ""}`;
      setComposeBody(fwdBody);
    }
    setShowCcBcc(false);
    setComposeCc("");
    setComposeBcc("");
  };

  const handleSend = async () => {
    if (!composeTo || !composeSubject) return;
    setSending(true);

    const isReply = composeMode === "reply" && selectedThread;
    const endpoint = isReply ? "/api/email/reply" : "/api/email/compose";
    const payload = isReply
      ? { thread_id: selectedThread!.thread_id, to_email: composeTo, subject: composeSubject, reply_body: composeBody, from_email: fromAccount }
      : { to_email: composeTo, subject: composeSubject, body: composeBody, from_email: fromAccount, cc_emails: composeCc ? composeCc.split(",").map(e => e.trim()) : [], bcc_emails: composeBcc ? composeBcc.split(",").map(e => e.trim()) : [] };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSending(false);
    if (res.ok) {
      showToast("Email sent");
      setComposeMode(null);
      fetchThreads();
    } else {
      showToast("Failed to send");
    }
  };

  // ── Contacts ──
  const fetchContacts = async () => {
    const res = await fetch("/api/email/contacts");
    const data = await res.json();
    setContacts(data.contacts || []);
  };

  // ── Filtered threads ──
  const filtered = threads.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.subject.toLowerCase().includes(s) || t.to_email.toLowerCase().includes(s) || t.from_email.toLowerCase().includes(s) || t.latest_body_preview.toLowerCase().includes(s);
  });

  // ── Time format ──
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  // ── Compose View (full screen on mobile) ──
  if (composeMode) {
    return (
      <div className="h-full flex flex-col bg-nv-void">
        {/* Compose Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button onClick={() => setComposeMode(null)} className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
            <X size={20} />
          </button>
          <h2 className="font-display font-semibold text-sm text-nv-text-primary flex-1">
            {composeMode === "new" ? "New Message" : composeMode === "reply" ? "Reply" : "Forward"}
          </h2>
          <button onClick={handleSend} disabled={sending || !composeTo || !composeSubject} className="nv-btn-primary py-1.5 px-4 text-xs disabled:opacity-40">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Send</>}
          </button>
        </div>

        {/* Compose Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* From */}
          {accounts.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-nv-text-muted text-xs w-12">From</span>
              <select value={fromAccount} onChange={e => setFromAccount(e.target.value)}
                className="flex-1 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary focus:outline-none focus:border-nv-teal/50">
                {accounts.map(a => <option key={a.email} value={a.email}>{a.display_name} &lt;{a.email}&gt;</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-nv-text-muted text-xs w-12">To</span>
            <input type="email" value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="recipient@example.com"
              className="flex-1 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
            {!showCcBcc && (
              <button onClick={() => setShowCcBcc(true)} className="text-xs text-nv-teal hover:underline">CC/BCC</button>
            )}
          </div>
          {showCcBcc && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-nv-text-muted text-xs w-12">CC</span>
                <input type="text" value={composeCc} onChange={e => setComposeCc(e.target.value)} placeholder="cc@example.com"
                  className="flex-1 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-nv-text-muted text-xs w-12">BCC</span>
                <input type="text" value={composeBcc} onChange={e => setComposeBcc(e.target.value)} placeholder="bcc@example.com"
                  className="flex-1 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <span className="text-nv-text-muted text-xs w-12">Subj</span>
            <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject"
              className="flex-1 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
          </div>
          <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message..."
            rows={12}
            className="w-full px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50 resize-none" />
        </div>
      </div>
    );
  }

  // ── Thread Detail View ──
  if (selectedThread) {
    return (
      <div className="h-full flex flex-col bg-nv-void">
        {/* Thread Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <button onClick={() => setSelectedThread(null)} className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display font-semibold text-sm text-nv-text-primary flex-1 truncate">
            {selectedThread.subject}
          </h2>
          <button onClick={() => threadAction("star", [selectedThread.thread_id])} className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-warning hover:bg-white/5">
            <Star size={18} className={selectedThread.starred ? "fill-nv-warning text-nv-warning" : ""} />
          </button>
          <button onClick={() => threadAction("trash", [selectedThread.thread_id])} className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-error hover:bg-white/5">
            <Trash2 size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingThread ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
          ) : messages.map(msg => (
            <div key={msg.id} className="nv-glass rounded-nv-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  msg.direction === "inbound" ? "bg-nv-violet/20 text-nv-violet" : "bg-nv-teal/20 text-nv-teal"
                )}>
                  {msg.direction === "inbound" ? "IN" : "OUT"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-nv-text-primary truncate">{msg.from_email}</p>
                  <p className="text-xs text-nv-text-muted">to {msg.to_email} &middot; {new Date(msg.created_at).toLocaleString()}</p>
                </div>
              </div>
              {msg.body_html ? (
                <div className="text-sm text-nv-text-secondary leading-relaxed prose-invert max-w-none [&_a]:text-nv-teal [&_img]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: msg.body_html }} />
              ) : (
                <pre className="text-sm text-nv-text-secondary whitespace-pre-wrap font-body">{msg.body_text || "(no content)"}</pre>
              )}
              {msg.attachments?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.attachments.map(att => (
                    <a key={att.id} href={att.s3_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-nv-teal hover:border-nv-teal/30 transition-colors">
                      <Paperclip size={12} /> {att.filename}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply / Forward Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
          <button onClick={() => startCompose("reply", messages[messages.length - 1])}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded-nv-md text-sm text-nv-text-secondary hover:text-nv-teal hover:border-nv-teal/30 transition-colors">
            <Reply size={16} /> Reply
          </button>
          <button onClick={() => startCompose("forward", messages[messages.length - 1])}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded-nv-md text-sm text-nv-text-secondary hover:text-nv-teal hover:border-nv-teal/30 transition-colors">
            <Forward size={16} /> Forward
          </button>
        </div>
      </div>
    );
  }

  // ── Main Inbox View ──
  return (
    <div className="h-full flex bg-nv-void">
      {/* Mobile sidebar toggle */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}>
          <div className="w-56 h-full bg-nv-abyss border-r border-white/5 p-3" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-mono text-nv-teal tracking-wider uppercase">Folders</span>
              <button onClick={() => setShowMobileSidebar(false)} className="text-nv-text-muted"><X size={18} /></button>
            </div>
            {FOLDERS.map(f => (
              <button key={f.key} onClick={() => { setFolder(f.key); setShowMobileSidebar(false); setSelectedThread(null); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                  folder === f.key ? "bg-nv-teal/10 text-nv-teal" : "text-nv-text-secondary hover:text-nv-text-primary hover:bg-white/5"
                )}>
                <f.icon size={16} /> {f.label}
                {(folderCounts[f.key] || 0) > 0 && <span className="ml-auto text-xs bg-nv-teal/20 text-nv-teal px-1.5 py-0.5 rounded-full">{folderCounts[f.key]}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-48 border-r border-white/5 p-3 shrink-0">
        <button onClick={() => startCompose("new")} className="nv-btn-primary py-2 px-3 text-xs mb-4 w-full">
          <Plus size={14} /> Compose
        </button>

        {/* Account Switcher */}
        {accounts.length > 0 && (
          <div className="mb-3">
            <select value={activeAccount || ""} onChange={e => { setActiveAccount(e.target.value || null); setSelectedThread(null); }}
              className="w-full px-2 py-1.5 bg-nv-void/60 border border-white/10 rounded-nv-md text-xs text-nv-text-secondary focus:outline-none focus:border-nv-teal/50">
              <option value="">All Accounts</option>
              {accounts.map(a => <option key={a.email} value={a.email}>{a.initials} — {a.email}</option>)}
            </select>
          </div>
        )}

        {FOLDERS.map(f => (
          <button key={f.key} onClick={() => { setFolder(f.key); setSelectedThread(null); }}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
              folder === f.key ? "bg-nv-teal/10 text-nv-teal" : "text-nv-text-secondary hover:text-nv-text-primary hover:bg-white/5"
            )}>
            <f.icon size={16} /> {f.label}
            {(folderCounts[f.key] || 0) > 0 && <span className="ml-auto text-xs bg-nv-teal/20 text-nv-teal px-1.5 py-0.5 rounded-full">{folderCounts[f.key]}</span>}
          </button>
        ))}

        <div className="mt-auto pt-3 border-t border-white/5">
          <button onClick={() => { setShowContacts(!showContacts); if (!showContacts) fetchContacts(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5">
            <Users size={16} /> Contacts
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal">
            <Menu size={20} />
          </button>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nv-text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emails..."
              className="w-full pl-8 pr-3 py-1.5 bg-nv-void/60 border border-white/10 rounded-nv-md text-xs text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
          </div>
          <button onClick={fetchThreads} className="p-1.5 rounded-lg text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => startCompose("new")} className="lg:hidden p-1.5 rounded-lg text-nv-teal hover:bg-nv-teal/10">
            <Plus size={20} />
          </button>
        </div>

        {/* Batch Actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-nv-teal/5">
            <span className="text-xs text-nv-teal">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-nv-text-muted hover:text-nv-text-primary">Clear</button>
            <div className="ml-auto flex gap-1">
              <button onClick={() => threadAction("trash")} className="p-1 text-nv-text-muted hover:text-nv-error"><Trash2 size={14} /></button>
              <button onClick={() => threadAction("star")} className="p-1 text-nv-text-muted hover:text-nv-warning"><Star size={14} /></button>
            </div>
          </div>
        )}

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Mail size={32} className="text-nv-text-muted mb-3" />
              <p className="text-nv-text-muted text-sm">{search ? "No emails match your search." : "No emails in this folder."}</p>
            </div>
          ) : filtered.map(thread => (
            <div key={thread.thread_id}
              onClick={() => openThread(thread)}
              className={cn(
                "flex items-start gap-3 px-3 py-3 border-b border-white/[0.03] cursor-pointer transition-colors hover:bg-white/[0.02]",
                thread.unread_count > 0 && "bg-nv-teal/[0.03]"
              )}>
              {/* Checkbox */}
              <button onClick={e => { e.stopPropagation(); setSelected(prev => { const n = new Set(prev); n.has(thread.thread_id) ? n.delete(thread.thread_id) : n.add(thread.thread_id); return n; }); }}
                className={cn("mt-1 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                  selected.has(thread.thread_id) ? "bg-nv-teal border-nv-teal" : "border-white/20 hover:border-white/40"
                )}>
                {selected.has(thread.thread_id) && <Check size={10} className="text-nv-abyss" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm truncate", thread.unread_count > 0 ? "font-semibold text-nv-text-primary" : "text-nv-text-secondary")}>
                    {folder === "sent" ? thread.to_email : thread.from_email}
                  </span>
                  {thread.message_count > 1 && <span className="text-[10px] text-nv-text-muted bg-white/5 px-1 rounded">{thread.message_count}</span>}
                  <span className="ml-auto text-[11px] text-nv-text-muted shrink-0">{timeAgo(thread.latest_message)}</span>
                </div>
                <p className={cn("text-sm truncate mt-0.5", thread.unread_count > 0 ? "text-nv-text-primary" : "text-nv-text-secondary")}>
                  {thread.subject}
                </p>
                <p className="text-xs text-nv-text-muted truncate mt-0.5">{thread.latest_body_preview}</p>
              </div>

              {/* Indicators */}
              <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                {thread.starred && <Star size={12} className="fill-nv-warning text-nv-warning" />}
                {thread.has_attachments && <Paperclip size={12} className="text-nv-text-muted" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-nv-deep border border-nv-teal/30 rounded-nv-md text-sm text-nv-teal shadow-nv-glow-sm animate-nv-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
