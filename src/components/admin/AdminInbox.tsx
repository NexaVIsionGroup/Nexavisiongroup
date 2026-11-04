"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Inbox, Send, FileEdit, Star, Trash2, AlertOctagon,
  Search, RefreshCw, ChevronLeft, MailOpen, Mail,
  Reply, ReplyAll, Forward, X, Check, Loader2, Users,
  Paperclip, Menu, Pencil, MoreVertical, ChevronDown, ChevronUp, Plus,
  LayoutDashboard, Sun, Moon, Download, Copy, Palette, Undo2, ShieldAlert,
  ArchiveRestore, CheckCircle2, Circle, Settings, Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";
import RefreshBar from "./RefreshBar";
import EmailBody from "./EmailBody";
import { useCached, fetchJson, cacheGet, cacheSet } from "@/lib/admin/cache";

// ── Types ──
interface Thread {
  thread_id: string; subject: string; to_email: string; from_email: string;
  counterpart?: string; account?: string;
  latest_message: string; latest_body_preview: string; latest_direction: string;
  message_count: number; unread_count: number; starred: boolean;
  has_attachments: boolean; created_at: string;
}
interface Attachment { id: string; filename: string; content_type: string; size_bytes: number; s3_url: string }
interface Message {
  id: string; thread_id: string; direction: string; from_email: string;
  to_email: string; subject: string; body_html: string | null;
  body_text: string | null; read: boolean; starred: boolean;
  folder: string; created_at: string; cc_emails: string[]; bcc_emails: string[];
  attachments: Attachment[];
}
interface EmailAccount { id?: string; email: string; display_name: string; color: string; initials: string; is_default?: boolean; }
interface Draft { to: string; cc: string; bcc: string; subject: string; body: string; from: string; savedAt: number }

type Folder = "inbox" | "sent" | "drafts" | "starred" | "trash" | "spam";
type ComposeMode = "new" | "reply" | "replyAll" | "forward" | null;
type View = "list" | "thread" | "compose" | "accounts";

const FOLDERS: { key: Folder; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "spam", label: "Spam", icon: AlertOctagon },
];
const FOLDER_LABEL: Record<string, string> = { inbox: "Inbox", sent: "Sent", drafts: "Drafts", starred: "Starred", trash: "Trash", spam: "Spam" };
const DRAFT_KEY = "inbox:draft";
const PAGE = 60;

// ── Small helpers ──
const GENERIC_LOCAL = new Set(["no-reply", "noreply", "donotreply", "do-not-reply", "info", "sales", "admin", "support", "hello", "mail", "news", "newsletter", "notifications", "notification", "team", "contact", "alerts", "alert", "service", "billing", "help", "marketing", "updates", "bounce", "mailer-daemon", "postmaster", "security", "account", "accounts"]);
const OWN_DOMAINS = new Set(["nexavisiongroup.com"]);
/** "no-reply@accounts.google.com" → "google.com"; "john@acme.com" → "john"; our own mailboxes keep their name */
function senderLabel(email: string): string {
  const [local = "", domain = ""] = (email || "").toLowerCase().split("@");
  if (GENERIC_LOCAL.has(local) && domain && !OWN_DOMAINS.has(domain)) return domain.replace(/^(www|mail|email|e|m|info|accounts?|notifications?|news)\./, "");
  return local || email || "unknown";
}
function avatarColor(email: string): string {
  const colors = ["#EC4899", "#8B5CF6", "#3B82F6", "#22C55E", "#EAB308", "#EF4444", "#06B6D4", "#F97316", "#7B5EA7", "#00E5CC"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
function fmtWhen(d: string, long = false) {
  const t = new Date(d), now = new Date();
  const time = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (t.toDateString() === now.toDateString()) return long ? `Today, ${time}` : time;
  const date = t.toLocaleDateString("en-US", t.getFullYear() === now.getFullYear() ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
  return long ? `${date}, ${time}` : date;
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return fmtWhen(d);
}
const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const cleanPreview = (s: string) => (s || "").replace(/\[image:[^\]]*\]/gi, " ").replace(/\s+/g, " ").trim();
const snippet = (m: Message) => cleanPreview(m.body_text || (m.body_html || "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).slice(0, 140);

/** Plain-text email bodies with tappable links */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s<>"']+)/gi);
  return (
    <>
      {parts.map((p, i) => {
        if (!/^(https?:\/\/|www\.)/i.test(p)) return <span key={i}>{p}</span>;
        const m = p.match(/^(.*?)([.,;:!?)\]]*)$/) || [p, p, ""];
        const url = m[1], trail = m[2];
        return (
          <span key={i}>
            <a href={url.startsWith("www.") ? `https://${url}` : url} target="_blank" rel="noopener noreferrer" className="text-nv-teal underline break-all">{url}</a>{trail}
          </span>
        );
      })}
    </>
  );
}

// Declared at module level on purpose: a component created inside AdminInbox's render would be a new type on
// every render, making React unmount + remount the whole inbox each time state changes.
const Theme = ({ light, children }: { light: boolean; children: React.ReactNode }) => (
  <div className={cn("contents", light && "nv-light")}>{children}</div>
);

type SheetItem = { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean; hint?: string };
/** Bottom action sheet (thumb-reachable menu) */
function ActionSheet({ title, items, onClose }: { title?: string; items: SheetItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full sm:max-w-md bg-nv-deep border border-white/10 rounded-t-2xl sm:rounded-2xl pt-2 animate-nv-fade-up"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/15" />
        {title && <p className="px-5 py-2 text-xs font-medium text-nv-text-muted leading-relaxed line-clamp-3 break-words">{title}</p>}
        {items.map((it) => (
          <button key={it.label} onClick={() => { onClose(); it.onClick(); }}
            className={cn("w-full flex items-center gap-4 px-5 py-3.5 text-[15px] text-left hover:bg-white/5 active:bg-white/5", it.danger ? "text-nv-error" : "text-nv-text-primary")}>
            <it.icon size={20} className={it.danger ? "" : "text-nv-text-muted"} />
            <span className="flex-1">{it.label}</span>
            {it.hint && <span className="text-xs text-nv-text-muted">{it.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** List row wrapper: swipe left → trash, swipe right → read/unread, long-press → select */
function SwipeRow({ children, onLeft, onRight, onLongPress, disabled, rightLabel }: {
  children: React.ReactNode; onLeft: () => void; onRight: () => void; onLongPress: () => void; disabled?: boolean; rightLabel: string;
}) {
  const [dx, setDx] = useState(0);
  const [settle, setSettle] = useState(false);
  const st = useRef<{ x: number; y: number; lock: "" | "h" | "v"; id: number } | null>(null);
  const dxRef = useRef(0);
  const moved = useRef(false);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const set = (v: number) => { dxRef.current = v; setDx(v); };
  const clearPress = () => { if (press.current) { clearTimeout(press.current); press.current = null; } };

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    st.current = { x: e.clientX, y: e.clientY, lock: "", id: e.pointerId };
    moved.current = false; setSettle(false);
    clearPress();
    press.current = setTimeout(() => { press.current = null; st.current = null; moved.current = true; onLongPress(); }, 480);
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = st.current; if (!s) return;
    const mx = e.clientX - s.x, my = e.clientY - s.y;
    if (!s.lock) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      clearPress();
      s.lock = Math.abs(mx) > Math.abs(my) * 1.2 ? "h" : "v";
      if (s.lock === "h") { try { e.currentTarget.setPointerCapture(s.id); } catch { /* ignore */ } }
    }
    if (s.lock !== "h") return;
    moved.current = true;
    const lim = e.currentTarget.clientWidth * 0.6;
    set(Math.max(-lim, Math.min(lim, mx)));
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    clearPress();
    const s = st.current; st.current = null;
    if (!s || s.lock !== "h") return;
    const w = e.currentTarget.clientWidth, th = Math.min(110, w * 0.28), v = dxRef.current;
    setSettle(true);
    if (v < -th) { set(-w); setTimeout(() => { onLeft(); set(0); }, 160); }
    else if (v > th) { set(0); onRight(); }
    else set(0);
  };
  const cancel = () => { clearPress(); st.current = null; setSettle(true); set(0); };

  return (
    <div className="relative overflow-hidden select-none" style={{ touchAction: "pan-y" }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onPointerLeave={(e) => { if (st.current?.lock !== "h") cancel(); else up(e); }}
      onContextMenu={(e) => e.preventDefault()}
      onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; } }}>
      {dx !== 0 && (
        <div className={cn("absolute inset-0 flex items-center px-6 text-xs font-bold", dx < 0 ? "justify-end bg-nv-error/20 text-nv-error" : "justify-start bg-nv-teal/15 text-nv-teal")}>
          {dx < 0 ? <>Trash <Trash2 size={20} className="ml-2" /></> : <><MailOpen size={20} className="mr-2" /> {rightLabel}</>}
        </div>
      )}
      <div className="relative bg-nv-void" style={{ transform: `translateX(${dx}px)`, transition: settle ? "transform .18s ease-out" : "none" }}>{children}</div>
    </div>
  );
}

export default function AdminInbox() {
  const router = useRouter();

  // ── Theme: light/dark for the mail client only (saved on the device) ──
  const [light, setLight] = useState(false);
  useEffect(() => { try { setLight(localStorage.getItem("nv_inbox_theme") === "light"); } catch { /* ignore */ } }, []);
  const toggleTheme = () => setLight((l) => { const n = !l; try { localStorage.setItem("nv_inbox_theme", n ? "light" : "dark"); } catch { /* ignore */ } return n; });
  const goDashboard = () => router.push("/admin");

  // ── State ──
  const [view, setView] = useState<View>("list");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const selectedRef = useRef<Thread | null>(null);
  useEffect(() => { selectedRef.current = selectedThread; }, [selectedThread]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // thread view
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Set<string>>(new Set());
  const [originalColors, setOriginalColors] = useState<Set<string>>(new Set());
  const [msgMenu, setMsgMenu] = useState<Message | null>(null);
  const [threadMenu, setThreadMenu] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // list selection (long-press / tap avatar)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectMode = selected.size > 0;
  const [selMenu, setSelMenu] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState<{ title: string; label: string; onConfirm: () => void } | null>(null);

  // Compose
  const [composeMode, setComposeMode] = useState<ComposeMode>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeFiles, setComposeFiles] = useState<{ name: string; size: number; base64: string; type: string }[]>([]);
  const [composeOrig, setComposeOrig] = useState<Message | null>(null);
  const [showOrig, setShowOrig] = useState(false);
  const [discardSheet, setDiscardSheet] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const composeFileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Accounts — rendered from the device's saved copy, refreshed in the background
  const accountsQ = useCached<EmailAccount[]>("inbox:accounts", async (signal) =>
    (await fetchJson<{ accounts: EmailAccount[] }>("/api/admin/email-accounts", { cache: "no-store", signal })).accounts || []);
  const accounts = useMemo(() => accountsQ.data || [], [accountsQ.data]);
  // blocked senders (kept server-side; the inbound webhook files them in Spam)
  const rulesQ = useCached<{ blocked: string[] }>("inbox:rules", async (signal) => fetchJson<{ blocked: string[] }>("/api/email/rules", { cache: "no-store", signal }));
  const blocked = rulesQ.data?.blocked || [];
  const accountByEmail = useMemo(() => new Map(accounts.map((a) => [a.email.toLowerCase(), a])), [accounts]);
  const [activeAccount, setActiveAccount] = useState<EmailAccount | null>(null);
  const [fromAccount, setFromAccount] = useState("");

  // Account management
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: "", display_name: "", color: "#00E5CC", initials: "" });
  const PRESET_COLORS = ["#00E5CC", "#7B5EA7", "#FF6B35", "#3B82F6", "#22C55E", "#EAB308", "#EF4444", "#EC4899", "#8B5CF6", "#06B6D4"];

  const openAddAccount = () => { setEditingAccount(null); setAccountForm({ email: "", display_name: "", color: "#00E5CC", initials: "" }); setShowAccountForm(true); };
  const openEditAccount = (account: EmailAccount) => { setEditingAccount(account); setAccountForm({ email: account.email, display_name: account.display_name, color: account.color, initials: account.initials }); setShowAccountForm(true); };
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

  // Toast (with optional Undo)
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const showToast = (msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), undo ? 5000 : 3000);
  };

  // ── Pick the account once the list is known (saved choice → default → first; "" = All Accounts) ──
  const accountsInitialized = useRef(false);
  const [accountReady, setAccountReady] = useState(false);
  const fetchAccounts = () => accountsQ.refresh();
  useEffect(() => {
    if (accountsInitialized.current || !accounts.length) return;
    accountsInitialized.current = true;
    const saved = typeof window !== "undefined" ? localStorage.getItem("nv_inbox_account") : null;
    if (saved === "") {
      setActiveAccount(null);
      setFromAccount(accounts.find(a => a.is_default)?.email || accounts[0].email);
    } else {
      const match = saved ? accounts.find((a) => a.email === saved) : null;
      const pick = match || accounts.find((a) => a.is_default) || accounts[0];
      setActiveAccount(pick);
      setFromAccount(pick.email);
    }
    setAccountReady(true);
  }, [accounts]);
  useEffect(() => { if (!accountsQ.loading && !accounts.length) setAccountReady(true); }, [accountsQ.loading, accounts.length]);
  useEffect(() => {
    if (!accountsInitialized.current || typeof window === "undefined") return;
    localStorage.setItem("nv_inbox_account", activeAccount ? activeAccount.email : "");
  }, [activeAccount]);

  // ── Navigation: every sub-view is a history entry, so the phone's back button walks back through
  //    compose → conversation → list instead of leaving the mail client. Next's own history state is kept.
  const goToView = useCallback((v: View) => {
    try { window.history.pushState({ ...(window.history.state || {}), inboxView: v }, ""); } catch { /* ignore */ }
    setView(v);
  }, []);
  const back = useCallback(() => {
    if (typeof window !== "undefined" && window.history.state?.inboxView) window.history.back();
    else { setView("list"); setSelectedThread(null); }
  }, []);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const v = ((e.state && e.state.inboxView) as View | undefined) || "list";
      if (v === "list") { setSelectedThread(null); setComposeMode(null); setView("list"); return; }
      if (v === "thread" && !selectedRef.current) { setView("list"); return; }
      setView(v);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Threads: saved copy on screen immediately, fresh list in the background ──
  const threadsKey = accountReady ? `inbox:threads:${folder}:${activeAccount ? activeAccount.email : "all"}` : null;
  const threadsQ = useCached<{ threads: Thread[]; folderCounts: Record<string, number> }>(threadsKey, async (signal) => {
    const params = new URLSearchParams({ folder });
    if (activeAccount) params.set("account", activeAccount.email);
    const data = await fetchJson<{ threads: Thread[]; folderCounts: Record<string, number> }>(`/api/email/threads?${params}`, { cache: "no-store", signal });
    return { threads: data.threads || [], folderCounts: data.folderCounts || {} };
  });
  const threads = useMemo(() => threadsQ.data?.threads || [], [threadsQ.data]);
  const folderCounts = threadsQ.data?.folderCounts || {};
  const loading = !accountReady || threadsQ.loading;
  const fetchThreads = threadsQ.refresh;
  const setThreads = (fn: (prev: Thread[]) => Thread[]) =>
    threadsQ.mutate((cur) => ({ threads: fn(cur?.threads || []), folderCounts: cur?.folderCounts || {} }));

  /** the other party in a conversation (older saved lists lack `counterpart`) */
  const otherParty = (t: Thread) => t.counterpart || t.to_email;
  const mailboxOf = (t: Thread) => t.account || t.from_email;

  // known addresses for the To/Cc autocomplete
  const knownAddresses = useMemo(() => {
    const s = new Set<string>();
    for (const t of threads) { if (t.counterpart) s.add(t.counterpart.toLowerCase()); else { s.add(t.to_email.toLowerCase()); } }
    for (const a of accounts) s.delete(a.email.toLowerCase());
    return [...s].slice(0, 300);
  }, [threads, accounts]);

  // deep link from a notification: /admin/inbox?thread=<id>
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || !threads.length) return;
    const want = new URLSearchParams(window.location.search).get("thread");
    if (!want) { deepLinked.current = true; return; }
    const t = threads.find((x) => x.thread_id === want);
    if (t) { deepLinked.current = true; openThread(t); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  // local draft?
  useEffect(() => { cacheGet<Draft | null>(DRAFT_KEY).then((d) => setHasDraft(!!d?.v && !!(d.v.to || d.v.subject || d.v.body))); }, []);

  // ── Open thread: show the saved conversation at once, then refresh it (and mark it read) ──
  const [threadError, setThreadError] = useState<string | null>(null);
  const openThread = async (thread: Thread) => {
    setSelectedThread(thread);
    selectedRef.current = thread;
    setExpanded(new Set()); setDetails(new Set()); setOriginalColors(new Set());
    goToView("thread");
    setThreadError(null);
    const key = `inbox:thread:${thread.thread_id}:${activeAccount?.email || "all"}`;
    const saved = await cacheGet<Message[]>(key);
    const applyMessages = (list: Message[]) => {
      setMessages(list);
      // Gmail-style: older messages collapsed, the newest (and anything unread) open
      const open = new Set<string>();
      list.forEach((m, i) => { if (i === list.length - 1 || !m.read) open.add(m.id); });
      setExpanded(open);
    };
    if (saved?.v?.length) applyMessages(saved.v);
    setLoadingThread(!saved);
    try {
      const data = await fetchJson<{ messages: Message[] }>("/api/email/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: thread.thread_id, account: activeAccount?.email }),
      });
      const list = data.messages || [];
      if (saved?.v?.length) setMessages(list); else applyMessages(list);
      cacheSet(key, list);
      setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, unread_count: 0 } : t));
    } catch (e) {
      setThreadError((e as Error)?.message || "Could not load this conversation");
    } finally {
      setLoadingThread(false);
    }
  };
  // a long conversation opens at its newest message
  useEffect(() => {
    if (view !== "thread" || messages.length < 2) return;
    const el = scrollerRef.current?.querySelector<HTMLElement>("[data-last-message]");
    el?.scrollIntoView({ block: "start" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, view]);

  // ── Thread actions: change the screen first, tell the server, then re-sync in the background ──
  const threadAction = async (action: string, threadIds?: string[], opts?: { quiet?: boolean }) => {
    const ids = threadIds || (selectedThread ? [selectedThread.thread_id] : []);
    if (!ids.length) return;
    const idSet = new Set(ids);
    const removed = threads.filter(t => idSet.has(t.thread_id));
    const label = ids.length > 1 ? `${ids.length} conversations` : "Conversation";
    if (action === "trash" || action === "spam" || action === "restore" || action === "delete") {
      setThreads(prev => prev.filter(t => !idSet.has(t.thread_id)));
      if (!opts?.quiet) {
        const undoAction = action === "restore" ? (folder === "spam" ? "spam" : "trash") : action === "delete" ? null : "restore";
        const msg = action === "trash" ? `${label} moved to Trash` : action === "spam" ? `${label} marked as spam` : action === "restore" ? `${label} moved to Inbox` : `${label} deleted forever`;
        showToast(msg, undoAction ? () => {
          setThreads(prev => [...removed, ...prev].sort((a, b) => new Date(b.latest_message).getTime() - new Date(a.latest_message).getTime()));
          threadAction(undoAction, ids, { quiet: true });
        } : undefined);
      }
    } else if (action === "mark_read" || action === "mark_unread") {
      setThreads(prev => prev.map(t => idSet.has(t.thread_id) ? { ...t, unread_count: action === "mark_read" ? 0 : Math.max(1, t.unread_count) } : t));
      if (!opts?.quiet) showToast(action === "mark_read" ? "Marked as read" : "Marked as unread");
    } else if (action === "star" || action === "unstar") {
      setThreads(prev => prev.map(t => idSet.has(t.thread_id) ? { ...t, starred: action === "star" } : t));
      if (selectedThread && idSet.has(selectedThread.thread_id)) setSelectedThread({ ...selectedThread, starred: action === "star" });
    }
    try {
      const r = await fetch("/api/email/threads", {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_ids: ids, action, account: activeAccount?.email }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      showToast("Could not reach the server. The change was not saved.");
    }
    fetchThreads();
  };
  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const bulk = (action: string) => { const ids = [...selected]; setSelected(new Set()); threadAction(action, ids); };

  // ── Clean-up by sender: "user@domain" or "@domain" ──
  const domainOf = (e: string) => "@" + ((e || "").split("@")[1] || "");
  const fromMatches = (t: Thread, p: string) => { const o = otherParty(t).toLowerCase(); return p.startsWith("@") ? o.endsWith(p) : o === p; };
  const countFrom = (p: string) => threads.filter(t => fromMatches(t, p)).length;
  const selectFrom = (patterns: string[]) => {
    const ps = patterns.map(x => x.toLowerCase());
    setSelected(new Set(filtered.filter(t => ps.some(p => fromMatches(t, p))).map(t => t.thread_id)));
  };
  const senderAction = async (action: "trash_from" | "spam_from", pattern: string) => {
    const p = pattern.toLowerCase();
    setThreads(prev => prev.filter(t => !fromMatches(t, p)));
    setSelected(new Set());
    try {
      const r = await fetch("/api/email/threads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, value: p, account: activeAccount?.email }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || String(r.status));
      const n = Number(j.updated || 0);
      showToast(`${n} message${n === 1 ? "" : "s"} from ${p} moved to ${action === "trash_from" ? "Trash" : "Spam"}`);
    } catch { showToast("Could not reach the server. The change was not saved."); }
    fetchThreads();
  };
  const blockSender = async (pattern: string) => {
    const p = pattern.toLowerCase();
    setThreads(prev => prev.filter(t => !fromMatches(t, p)));
    setSelected(new Set());
    try {
      const r = await fetch("/api/email/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "block", pattern: p }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || String(r.status));
      showToast(`Blocked ${p}: ${j.moved || 0} moved to Spam, new mail skips the inbox`);
      rulesQ.refresh();
    } catch (e) { showToast((e as Error).message || "Could not block this sender"); }
    fetchThreads();
  };
  const unblockSender = async (p: string) => {
    await fetch("/api/email/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unblock", pattern: p }) }).catch(() => {});
    rulesQ.refresh();
    showToast(`Unblocked ${p}`);
  };
  const confirmTrashFrom = (p: string, after?: () => void) => setConfirmSheet({
    title: `Move every message from ${p} to Trash? ${countFrom(p)} in this list now; older ones too.`,
    label: `Trash all from ${p}`, onConfirm: () => { senderAction("trash_from", p); after?.(); },
  });
  const confirmBlock = (p: string, after?: () => void) => setConfirmSheet({
    title: `Block ${p}? Everything from ${p.startsWith("@") ? "that domain" : "that address"} moves to Spam now, and new mail from it goes straight to Spam.`,
    label: `Block ${p}`, onConfirm: () => { blockSender(p); after?.(); },
  });

  // ── Compose ──
  const startCompose = async (mode: ComposeMode, msg?: Message) => {
    setComposeMode(mode);
    setFromAccount(activeAccount?.email || accounts.find(a => a.is_default)?.email || accounts[0]?.email || "");
    setShowCcBcc(false); setComposeCc(""); setComposeBcc(""); setComposeFiles([]); setComposeOrig(null); setShowOrig(false);
    if (mode === "new") {
      setComposeTo(""); setComposeSubject(""); setComposeBody("");
      const d = await cacheGet<Draft | null>(DRAFT_KEY);
      if (d?.v && (d.v.to || d.v.subject || d.v.body)) {
        setComposeTo(d.v.to); setComposeSubject(d.v.subject); setComposeBody(d.v.body); setComposeCc(d.v.cc); setComposeBcc(d.v.bcc);
        if (d.v.cc || d.v.bcc) setShowCcBcc(true);
        if (d.v.from) setFromAccount(d.v.from);
        showToast("Draft restored");
      }
    } else if ((mode === "reply" || mode === "replyAll") && msg) {
      const me = (msg.direction === "inbound" ? msg.to_email : msg.from_email).toLowerCase();
      setComposeTo(msg.direction === "inbound" ? msg.from_email : msg.to_email);
      setComposeSubject(/^re:/i.test(msg.subject) ? msg.subject : `Re: ${msg.subject}`);
      setComposeBody("");
      setComposeOrig(msg);
      if (mode === "replyAll") {
        const cc = (msg.cc_emails || []).filter(e => e && e.toLowerCase() !== me);
        if (cc.length) { setComposeCc(cc.join(", ")); setShowCcBcc(true); }
      }
      if (msg.direction === "inbound" && accountByEmail.has(me)) setFromAccount(msg.to_email);
    } else if (mode === "forward" && msg) {
      setComposeTo("");
      setComposeSubject(`Fwd: ${msg.subject.replace(/^fwd?:\s*/i, "")}`);
      setComposeBody(`\n\n---------- Forwarded message ----------\nFrom: ${msg.from_email}\nDate: ${new Date(msg.created_at).toLocaleString()}\nSubject: ${msg.subject}\nTo: ${msg.to_email}\n\n${msg.body_text || snippet(msg)}`);
      setComposeOrig(msg);
    }
    goToView("compose");
    setTimeout(() => (mode === "new" || mode === "forward" ? undefined : bodyRef.current?.focus()), 250);
  };
  const composeDirty = !!(composeTo || composeSubject || composeBody.trim() || composeFiles.length);
  const closeCompose = () => { if (composeMode === "new" && composeDirty) setDiscardSheet(true); else back(); };
  const saveDraft = async () => {
    await cacheSet<Draft>(DRAFT_KEY, { to: composeTo, cc: composeCc, bcc: composeBcc, subject: composeSubject, body: composeBody, from: fromAccount, savedAt: Date.now() });
    setHasDraft(true); showToast("Draft saved on this phone"); back();
  };
  const discardDraft = async () => { await cacheSet<Draft | null>(DRAFT_KEY, null); setHasDraft(false); back(); };

  const handleSend = async () => {
    if (!composeTo || !composeSubject || sending) return;
    setSending(true);
    const isReply = (composeMode === "reply" || composeMode === "replyAll") && selectedThread;
    const endpoint = isReply ? "/api/email/reply" : "/api/email/compose";
    const files = composeFiles.map(f => ({ filename: f.name, content: f.base64, type: f.type }));
    const cc = composeCc ? composeCc.split(",").map(e => e.trim()).filter(Boolean) : [];
    const bcc = composeBcc ? composeBcc.split(",").map(e => e.trim()).filter(Boolean) : [];
    const payload = isReply
      ? { thread_id: selectedThread!.thread_id, to_email: composeTo.trim(), subject: composeSubject, reply_body: composeBody, from_email: fromAccount, attachments: files, cc_emails: cc }
      : { to_email: composeTo.trim(), subject: composeSubject, body: composeBody, from_email: fromAccount, cc_emails: cc, bcc_emails: bcc, attachments: files };
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `Send failed (${res.status})`); }
      if (composeMode === "new") { await cacheSet<Draft | null>(DRAFT_KEY, null); setHasDraft(false); }
      showToast("Sent");
      back();
      fetchThreads();
      if (isReply && selectedThread) setTimeout(() => openThread(selectedThread), 400);
    } catch (e) {
      showToast((e as Error).message || "Could not send");
    } finally { setSending(false); }
  };
  const addFiles = async (selected: FileList | null) => {
    if (!selected) return;
    const next: typeof composeFiles = [];
    let skipped = 0;
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (file.size > 10 * 1024 * 1024) { skipped++; continue; }
      const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      next.push({ name: file.name, size: file.size, base64, type: file.type || "application/octet-stream" });
    }
    setComposeFiles(prev => [...prev, ...next]);
    if (skipped) showToast(`${skipped} file${skipped > 1 ? "s" : ""} over 10 MB skipped`);
    if (composeFileRef.current) composeFileRef.current.value = "";
  };

  // ── List paging + pull to refresh ──
  const [shown, setShown] = useState(PAGE);
  useEffect(() => { setShown(PAGE); setSelected(new Set()); }, [folder, activeAccount, search]);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some(x => x.isIntersecting)) setShown(n => n + PAGE); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, threads.length, search, view]);
  const pull = useRef<number | null>(null);
  const [pullPx, setPullPx] = useState(0);

  const filtered = useMemo(() => threads.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.subject.toLowerCase().includes(s) || t.to_email.toLowerCase().includes(s) || t.from_email.toLowerCase().includes(s) || (t.counterpart || "").toLowerCase().includes(s) || t.latest_body_preview.toLowerCase().includes(s);
  }), [threads, search]);

  const lastMessage = messages[messages.length - 1];
  const replyTarget = [...messages].reverse().find(m => m.direction === "inbound") || lastMessage;
  const canReplyAll = !!replyTarget && (replyTarget.cc_emails || []).length > 0;

  // centred by the outer flex box, because the fade-up animation owns `transform` on the inner one
  const toastEl = toast && (
    <div className="fixed bottom-24 inset-x-0 z-[95] flex justify-center px-4 pointer-events-none" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2 max-w-full bg-nv-deep border border-nv-teal/30 rounded-full text-sm text-nv-text-primary shadow-nv-glow-sm animate-nv-fade-up">
        <span className="truncate min-w-0">{toast.msg}</span>
        {toast.undo ? (
          <button onClick={() => { toast.undo?.(); setToast(null); }} className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full bg-nv-teal/15 text-nv-teal text-xs font-bold"><Undo2 size={13} /> Undo</button>
        ) : <span className="w-2" />}
      </div>
    </div>
  );
  const safeTop = { paddingTop: "calc(0.5rem + env(safe-area-inset-top))" };
  const confirmEl = confirmSheet && (
    <ActionSheet title={confirmSheet.title} onClose={() => setConfirmSheet(null)} items={[
      { icon: Check, label: confirmSheet.label, danger: true, onClick: confirmSheet.onConfirm },
      { icon: X, label: "Cancel", onClick: () => {} },
    ]} />
  );

  // ═══════════════════════════════════════════
  // ACCOUNT SWITCHER
  // ═══════════════════════════════════════════
  if (view === "accounts") {
    const pick = (a: EmailAccount | null) => { setActiveAccount(a); if (a) setFromAccount(a.email); back(); };
    return (
      <Theme light={light}>
      <div className="fixed inset-0 z-[60] bg-nv-void flex flex-col">
        <div className="flex items-center gap-2 px-2 py-2 border-b border-white/5" style={safeTop}>
          <button onClick={back} aria-label="Back" className="p-2 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><ChevronLeft size={24} /></button>
          <span className="flex-1 text-base font-semibold text-nv-text-primary">Mailboxes</span>
          <button onClick={openAddAccount} className="flex items-center gap-1.5 px-3 py-2 mr-1 rounded-full bg-nv-teal text-nv-abyss text-xs font-bold">
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <button onClick={() => pick(null)}
            className={cn("w-full flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]", !activeAccount && "bg-nv-teal/5")}>
            <div className="w-11 h-11 rounded-full bg-nv-deep border border-white/10 flex items-center justify-center shrink-0"><Mail size={18} className="text-nv-text-muted" /></div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-nv-text-primary">All mailboxes</p>
              <p className="text-[13px] text-nv-text-muted">Everything that comes in, in one list</p>
            </div>
            {!activeAccount && <Check size={18} className="text-nv-teal shrink-0" />}
          </button>

          {accounts.map(account => (
            <div key={account.email} className={cn("flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04]", activeAccount?.email === account.email && "bg-nv-teal/5")}>
              <button onClick={() => pick(account)} className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: account.color + "25", color: account.color }}>{account.initials}</button>
              <button onClick={() => pick(account)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-medium text-nv-text-primary truncate">{account.display_name}</p>
                  {account.is_default && <span className="text-[10px] font-bold text-nv-teal bg-nv-teal/10 px-1.5 py-0.5 rounded shrink-0">DEFAULT</span>}
                </div>
                <p className="text-[13px] text-nv-text-muted truncate">{account.email}</p>
              </button>
              {activeAccount?.email === account.email && <Check size={18} className="text-nv-teal shrink-0" />}
              <div className="flex items-center shrink-0">
                {!account.is_default && (
                  <button onClick={() => handleSetDefault(account)} title="Set as default" className="p-2 rounded-full text-nv-text-muted hover:text-nv-warning hover:bg-white/5"><Star size={15} /></button>
                )}
                <button onClick={() => openEditAccount(account)} className="p-2 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><Pencil size={15} /></button>
                <button onClick={() => handleDeleteAccount(account)} className="p-2 rounded-full text-nv-text-muted hover:text-nv-error hover:bg-white/5"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && <div className="text-center text-nv-text-muted text-sm py-16">No mailboxes yet. Tap Add to set one up.</div>}

          <div className="px-5 pt-6 pb-6">
            <p className="text-sm font-semibold text-nv-text-primary">Blocked senders</p>
            <p className="text-xs text-nv-text-muted mt-0.5 mb-2">Mail from these goes straight to Spam. Block one from a conversation's menu or from a selection.</p>
            {blocked.length === 0 ? <p className="text-sm text-nv-text-muted py-3">Nothing blocked yet.</p> : blocked.map(bp => (
              <div key={bp} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
                <ShieldAlert size={16} className="text-nv-text-muted shrink-0" />
                <span className="flex-1 text-sm text-nv-text-primary truncate">{bp}</span>
                <button onClick={() => unblockSender(bp)} className="text-xs font-semibold text-nv-teal px-2 py-1 rounded-full hover:bg-white/5">Unblock</button>
              </div>
            ))}
          </div>
        </div>

        {showAccountForm && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAccountForm(false)}>
            <div className="w-full sm:max-w-md bg-nv-deep border border-white/10 rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-lg text-nv-text-primary">{editingAccount ? "Edit mailbox" : "New mailbox"}</h3>
                <button onClick={() => setShowAccountForm(false)} className="text-nv-text-muted hover:text-nv-teal"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Email address</label>
                  <input type="email" required value={accountForm.email} onChange={e => setAccountForm({ ...accountForm, email: e.target.value })} placeholder="name@nexavisiongroup.com"
                    className="w-full px-3 py-2.5 bg-nv-void/60 border border-white/10 rounded-xl text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
                </div>
                <div>
                  <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Display name</label>
                  <input type="text" required value={accountForm.display_name} onChange={e => setAccountForm({ ...accountForm, display_name: e.target.value })} placeholder="NexaVision Support"
                    className="w-full px-3 py-2.5 bg-nv-void/60 border border-white/10 rounded-xl text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Initials</label>
                    <input type="text" maxLength={2} value={accountForm.initials} onChange={e => setAccountForm({ ...accountForm, initials: e.target.value.toUpperCase() })} placeholder="Auto"
                      className="w-full px-3 py-2.5 bg-nv-void/60 border border-white/10 rounded-xl text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none focus:border-nv-teal/50" />
                  </div>
                  <div>
                    <label className="block text-nv-text-secondary text-sm font-medium mb-1.5">Color</label>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setAccountForm({ ...accountForm, color: c })}
                          className={cn("w-6 h-6 rounded-full border-2 transition-all", accountForm.color === c ? "border-white scale-110" : "border-transparent hover:border-white/30")} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={savingAccount} className="w-full py-3 rounded-xl bg-nv-teal text-nv-abyss font-display font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingAccount ? <Loader2 size={16} className="animate-spin" /> : editingAccount ? "Save changes" : "Add mailbox"}
                </button>
              </form>
            </div>
          </div>
        )}
        {confirmEl}{toastEl}
      </div>
      </Theme>
    );
  }

  // ═══════════════════════════════════════════
  // COMPOSE
  // ═══════════════════════════════════════════
  if (view === "compose") {
    const title = composeMode === "new" ? "New message" : composeMode === "forward" ? "Forward" : composeMode === "replyAll" ? "Reply all" : "Reply";
    const canSend = !!composeTo && !!composeSubject && !sending;
    const totalBytes = composeFiles.reduce((s, f) => s + f.size, 0);
    return (
      <Theme light={light}>
      <div className="fixed inset-0 z-[60] bg-nv-void flex flex-col">
        <div className="flex items-center gap-1 px-2 py-2 border-b border-white/5" style={safeTop}>
          <button onClick={closeCompose} aria-label="Close" className="p-2 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><X size={24} /></button>
          <h2 className="font-display font-semibold text-base text-nv-text-primary flex-1 truncate">{title}</h2>
          <button onClick={() => composeFileRef.current?.click()} aria-label="Attach files" className="p-2 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><Paperclip size={22} /></button>
          <button onClick={handleSend} disabled={!canSend} aria-label="Send"
            className="ml-1 mr-1 flex items-center gap-2 pl-4 pr-3 py-2 bg-nv-teal text-nv-abyss font-display font-bold text-sm rounded-full disabled:opacity-40 transition-opacity">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <>Send <Send size={15} /></>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="px-4">
            {accounts.length > 1 && (
              <label className="flex items-center gap-3 py-2.5 border-b border-white/5 min-w-0">
                <span className="text-nv-text-muted text-sm w-14 shrink-0">From</span>
                <select value={fromAccount} onChange={e => setFromAccount(e.target.value)} className="flex-1 min-w-0 w-full py-1 bg-transparent text-sm text-nv-text-primary focus:outline-none truncate">
                  {accounts.map(a => <option key={a.email} value={a.email}>{a.display_name} ({a.email})</option>)}
                </select>
              </label>
            )}
            <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
              <span className="text-nv-text-muted text-sm w-14 shrink-0">To</span>
              <input type="email" list="nv-known-addresses" autoComplete="off" value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="name@example.com"
                className="flex-1 min-w-0 bg-transparent text-[15px] text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
              {!showCcBcc && <button onClick={() => setShowCcBcc(true)} className="text-xs text-nv-text-muted hover:text-nv-teal px-2 py-1">Cc/Bcc</button>}
            </div>
            <datalist id="nv-known-addresses">{knownAddresses.map(a => <option key={a} value={a} />)}</datalist>
            {showCcBcc && (
              <>
                <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
                  <span className="text-nv-text-muted text-sm w-14 shrink-0">Cc</span>
                  <input type="text" list="nv-known-addresses" value={composeCc} onChange={e => setComposeCc(e.target.value)} placeholder="Separate addresses with commas"
                    className="flex-1 min-w-0 bg-transparent text-[15px] text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
                </div>
                {composeMode !== "reply" && composeMode !== "replyAll" && (
                  <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
                    <span className="text-nv-text-muted text-sm w-14 shrink-0">Bcc</span>
                    <input type="text" list="nv-known-addresses" value={composeBcc} onChange={e => setComposeBcc(e.target.value)}
                      className="flex-1 min-w-0 bg-transparent text-[15px] text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
              <span className="text-nv-text-muted text-sm w-14 shrink-0">Subject</span>
              <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject"
                className="flex-1 min-w-0 bg-transparent text-[15px] text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
            </div>
          </div>

          <textarea ref={bodyRef} value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message"
            className="flex-1 w-full min-h-[40vh] px-4 py-3 bg-transparent text-[15px] text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none resize-none leading-relaxed" />

          <input ref={composeFileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          {composeFiles.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {composeFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-nv-text-secondary">
                    <Paperclip size={12} className="text-nv-teal shrink-0" />
                    <span className="truncate max-w-[140px]">{f.name}</span>
                    <span className="text-nv-text-muted">{fmtSize(f.size)}</span>
                    <button onClick={() => setComposeFiles(prev => prev.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="p-1 rounded-full text-nv-text-muted hover:text-nv-error"><X size={13} /></button>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-nv-text-muted">{composeFiles.length} file{composeFiles.length > 1 ? "s" : ""} · {fmtSize(totalBytes)} · 10 MB per file</p>
            </div>
          )}

          {composeOrig && composeMode !== "forward" && (
            <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <button onClick={() => setShowOrig(s => !s)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                <Reply size={14} className="text-nv-text-muted shrink-0" />
                <span className="flex-1 text-xs text-nv-text-muted truncate">Replying to {senderLabel(composeOrig.from_email)} · {fmtWhen(composeOrig.created_at, true)}</span>
                {showOrig ? <ChevronUp size={16} className="text-nv-text-muted" /> : <ChevronDown size={16} className="text-nv-text-muted" />}
              </button>
              {showOrig && (
                <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto">
                  {composeOrig.body_html ? <div className="rounded-lg overflow-hidden"><EmailBody html={composeOrig.body_html} dark={!light} /></div>
                    : <pre className="text-[13px] text-nv-text-secondary whitespace-pre-wrap font-body leading-relaxed">{composeOrig.body_text || "(no content)"}</pre>}
                </div>
              )}
            </div>
          )}
        </div>

        {discardSheet && (
          <ActionSheet title="You have an unsent message" onClose={() => setDiscardSheet(false)} items={[
            { icon: FileEdit, label: "Save draft on this phone", onClick: saveDraft },
            { icon: Trash2, label: "Discard message", onClick: discardDraft, danger: true },
          ]} />
        )}
        {confirmEl}{toastEl}
      </div>
      </Theme>
    );
  }

  // ═══════════════════════════════════════════
  // CONVERSATION
  // ═══════════════════════════════════════════
  if (view === "thread" && selectedThread) {
    const t = selectedThread;
    const acct = accountByEmail.get((mailboxOf(t) || "").toLowerCase());
    const inTrash = folder === "trash", inSpam = folder === "spam";
    const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const toggleDetails = (id: string) => setDetails(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const toggleColors = (id: string) => setOriginalColors(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); showToast("Copied"); } catch { showToast(s); } };
    const afterLeave = (action: string) => { threadAction(action, [t.thread_id]); back(); };

    return (
      <Theme light={light}>
      <div className="fixed inset-0 z-[60] bg-nv-void flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-1 py-1.5 border-b border-white/5 bg-nv-void" style={safeTop}>
          <button onClick={back} aria-label="Back to list" className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><ChevronLeft size={26} /></button>
          <div className="flex-1" />
          <button onClick={() => threadAction(t.starred ? "unstar" : "star")} aria-label={t.starred ? "Unstar" : "Star"} className="p-2.5 rounded-full hover:bg-white/5">
            <Star size={21} className={t.starred ? "fill-nv-warning text-nv-warning" : "text-nv-text-muted"} />
          </button>
          {inTrash || inSpam ? (
            <button onClick={() => afterLeave("restore")} aria-label="Move to Inbox" className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><ArchiveRestore size={21} /></button>
          ) : (
            <button onClick={() => afterLeave("mark_unread")} aria-label="Mark unread" className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><MailOpen size={21} /></button>
          )}
          <button onClick={() => afterLeave(inTrash ? "delete" : "trash")} aria-label={inTrash ? "Delete forever" : "Move to Trash"} className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-error hover:bg-white/5"><Trash2 size={21} /></button>
          <button onClick={() => setThreadMenu(true)} aria-label="More" className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><MoreVertical size={21} /></button>
        </div>

        <div ref={scrollerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Subject + where it lives */}
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-[21px] font-display font-bold text-nv-text-primary leading-snug break-words">{t.subject || "(no subject)"}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[11px] font-medium text-nv-text-muted bg-white/5 border border-white/10 rounded px-2 py-0.5">{FOLDER_LABEL[folder]}</span>
              {acct ? (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-nv-text-muted bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acct.color }} /> {acct.email}
                </span>
              ) : mailboxOf(t) ? <span className="text-[11px] text-nv-text-muted">{mailboxOf(t)}</span> : null}
              {t.message_count > 1 && <span className="text-[11px] text-nv-text-muted">{messages.length || t.message_count} messages</span>}
            </div>
          </div>

          {threadError && (
            <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-nv-warning">
              <span className="flex-1">{messages.length ? "Could not refresh. Showing the saved copy." : threadError}</span>
              <button onClick={() => openThread(t)} className="font-semibold text-nv-teal">Retry</button>
            </div>
          )}

          <div className="px-3 pb-6 space-y-2.5">
            {loadingThread && !messages.length ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
            ) : messages.map((msg, i) => {
              const open = expanded.has(msg.id);
              const isLast = i === messages.length - 1;
              const who = msg.from_email;
              const name = senderLabel(who);
              const toLabel = msg.direction === "outbound" ? msg.to_email : (accountByEmail.has(msg.to_email.toLowerCase()) || !activeAccount ? msg.to_email : "me");
              return (
                <div key={msg.id} data-last-message={isLast ? "" : undefined} className={cn("bg-nv-deep/50 rounded-2xl", open ? "" : "opacity-90")}>
                  {/* Header: tap to open/close */}
                  <div role="button" tabIndex={0} onClick={() => toggleExpand(msg.id)} onKeyDown={(e) => e.key === "Enter" && toggleExpand(msg.id)}
                    className="flex items-center gap-3 px-3.5 py-3 cursor-pointer select-none">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: avatarColor(who) + "30", color: avatarColor(who) }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={cn("text-[15px] truncate", open ? "font-semibold text-nv-text-primary" : "font-medium text-nv-text-secondary")}>{msg.direction === "outbound" ? `${name} (you)` : name}</span>
                        <span className="ml-auto text-xs text-nv-text-muted shrink-0">{fmtWhen(msg.created_at)}</span>
                      </div>
                      {open ? (
                        <button onClick={(e) => { e.stopPropagation(); toggleDetails(msg.id); }} className="flex items-center gap-1 text-xs text-nv-text-muted max-w-full">
                          <span className="truncate">to {toLabel}</span><ChevronDown size={12} className={cn("shrink-0 transition-transform", details.has(msg.id) && "rotate-180")} />
                        </button>
                      ) : (
                        <p className="text-[13px] text-nv-text-muted truncate">{snippet(msg) || "(no content)"}</p>
                      )}
                    </div>
                    {open && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); startCompose("reply", msg); }} aria-label="Reply to this message" className="p-2 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><Reply size={19} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setMsgMenu(msg); }} aria-label="Message options" className="p-2 -mr-1 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><MoreVertical size={19} /></button>
                      </>
                    )}
                  </div>

                  {open && details.has(msg.id) && (
                    <div className="mx-3.5 mb-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs rounded-xl bg-white/5 border border-white/10 p-3">
                      <span className="text-nv-text-muted">From</span><span className="text-nv-text-primary break-all">{msg.from_email}</span>
                      <span className="text-nv-text-muted">To</span><span className="text-nv-text-primary break-all">{msg.to_email}</span>
                      {(msg.cc_emails || []).length > 0 && <><span className="text-nv-text-muted">Cc</span><span className="text-nv-text-primary break-all">{msg.cc_emails.join(", ")}</span></>}
                      <span className="text-nv-text-muted">Date</span><span className="text-nv-text-primary">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                  )}

                  {open && (
                    <div className="px-2 pb-2">
                      {msg.body_html ? (
                        <div className="rounded-xl overflow-hidden"><EmailBody html={msg.body_html} dark={!light} original={originalColors.has(msg.id)} /></div>
                      ) : (
                        <pre className="px-2 py-1 text-[15px] text-nv-text-secondary whitespace-pre-wrap break-words font-body leading-relaxed"><Linkified text={msg.body_text || "(no content)"} /></pre>
                      )}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 px-1">
                          <p className="text-[11px] font-medium text-nv-text-muted mb-1.5 flex items-center gap-1"><Paperclip size={11} /> {msg.attachments.length} attachment{msg.attachments.length > 1 ? "s" : ""}</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments.map(att => att.content_type?.startsWith("image/") && att.s3_url ? (
                              <a key={att.id} href={att.s3_url} target="_blank" rel="noopener noreferrer" className="block w-[31%] min-w-[96px] rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={att.s3_url} alt={att.filename} className="w-full h-24 object-cover" loading="lazy" />
                                <span className="block px-2 py-1 text-[11px] text-nv-text-secondary truncate">{att.filename}</span>
                              </a>
                            ) : (
                              <span key={att.id} className="flex items-center bg-white/5 border border-white/10 rounded-xl text-xs text-nv-teal overflow-hidden">
                                <a href={att.s3_url || undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2.5 max-w-[220px]">
                                  <Paperclip size={12} className="shrink-0" /> <span className="truncate">{att.filename}</span>
                                  {att.size_bytes > 0 && <span className="text-nv-text-muted shrink-0">{fmtSize(att.size_bytes)}</span>}
                                </a>
                                <a href={att.s3_url || undefined} download={att.filename} aria-label={`Download ${att.filename}`} className="px-3 py-2.5 border-l border-white/10 text-nv-text-muted hover:text-nv-teal"><Download size={14} /></a>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reply bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 bg-nv-void" style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}>
          <button onClick={() => replyTarget && startCompose("reply", replyTarget)} disabled={!replyTarget}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-nv-teal text-nv-abyss rounded-full text-sm font-bold disabled:opacity-40">
            <Reply size={17} /> Reply
          </button>
          {canReplyAll && (
            <button onClick={() => replyTarget && startCompose("replyAll", replyTarget)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-nv-text-secondary">
              <ReplyAll size={17} /> Reply all
            </button>
          )}
          <button onClick={() => lastMessage && startCompose("forward", lastMessage)} disabled={!lastMessage}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-nv-text-secondary disabled:opacity-40">
            <Forward size={17} /> Forward
          </button>
        </div>

        {threadMenu && (
          <ActionSheet title={t.subject} onClose={() => setThreadMenu(false)} items={[
            ...(!inTrash && !inSpam ? [{ icon: MailOpen, label: "Mark as unread", onClick: () => afterLeave("mark_unread") }] : []),
            ...(inTrash || inSpam ? [{ icon: ArchiveRestore, label: "Move to Inbox", onClick: () => afterLeave("restore") }] : []),
            ...(!inSpam ? [{ icon: ShieldAlert, label: inTrash ? "Move to Spam" : "Mark as spam", onClick: () => afterLeave("spam") }] : []),
            { icon: Forward, label: "Forward", onClick: () => lastMessage && startCompose("forward", lastMessage) },
            ...(folder !== "sent" && otherParty(t) ? [
              { icon: Search, label: `All mail from ${senderLabel(otherParty(t))}`, hint: String(countFrom(otherParty(t).toLowerCase())), onClick: () => { setSearch(otherParty(t)); back(); } },
              { icon: Trash2, label: `Trash all from ${senderLabel(otherParty(t))}`, onClick: () => confirmTrashFrom(otherParty(t).toLowerCase(), back) },
              { icon: ShieldAlert, label: `Block ${otherParty(t).toLowerCase()}`, onClick: () => confirmBlock(otherParty(t).toLowerCase(), back) },
              ...(domainOf(otherParty(t)).length > 1 && !OWN_DOMAINS.has(domainOf(otherParty(t)).slice(1)) ? [{ icon: ShieldAlert, label: `Block everything from ${domainOf(otherParty(t))}`, onClick: () => confirmBlock(domainOf(otherParty(t)), back) }] : []),
            ] : []),
            { icon: light ? Moon : Sun, label: light ? "Dark mode" : "Light mode", onClick: toggleTheme },
            ...(inTrash ? [{ icon: Trash2, label: "Delete forever", onClick: () => afterLeave("delete"), danger: true }] : [{ icon: Trash2, label: "Move to Trash", onClick: () => afterLeave("trash"), danger: true }]),
          ]} />
        )}
        {msgMenu && (
          <ActionSheet title={`${senderLabel(msgMenu.from_email)} · ${fmtWhen(msgMenu.created_at, true)}`} onClose={() => setMsgMenu(null)} items={[
            { icon: Reply, label: "Reply", onClick: () => startCompose("reply", msgMenu) },
            ...((msgMenu.cc_emails || []).length ? [{ icon: ReplyAll, label: "Reply all", onClick: () => startCompose("replyAll", msgMenu) }] : []),
            { icon: Forward, label: "Forward", onClick: () => startCompose("forward", msgMenu) },
            ...(msgMenu.body_html && !light ? [{ icon: Palette, label: originalColors.has(msgMenu.id) ? "Match dark mode" : "Show original colors", onClick: () => toggleColors(msgMenu.id) }] : []),
            { icon: Info, label: details.has(msgMenu.id) ? "Hide details" : "Show details", onClick: () => toggleDetails(msgMenu.id) },
            { icon: Copy, label: "Copy sender address", hint: msgMenu.from_email.length > 28 ? undefined : msgMenu.from_email, onClick: () => copy(msgMenu.from_email) },
          ]} />
        )}
        {confirmEl}{toastEl}
      </div>
      </Theme>
    );
  }

  // ═══════════════════════════════════════════
  // DRAWER
  // ═══════════════════════════════════════════
  const drawer = sidebarOpen && (
    <div className="fixed inset-0 z-[60]" onClick={() => setSidebarOpen(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-nv-abyss flex flex-col animate-nv-slide-in-left" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pb-3" style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}>
          <span className="font-display font-bold text-lg nv-gradient-text-teal">NexaVision Mail</span>
          <button onClick={() => { setSidebarOpen(false); goToView("accounts"); }} aria-label="Switch mailbox"
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
            style={activeAccount ? { backgroundColor: activeAccount.color + "25", color: activeAccount.color } : { backgroundColor: "#1C2D4A", color: "#8896A6" }}>
            {activeAccount ? activeAccount.initials : "All"}
          </button>
        </div>
        <button onClick={() => { setSidebarOpen(false); goToView("accounts"); }} className="mx-4 mb-2 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-left">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-nv-text-primary truncate">{activeAccount ? activeAccount.display_name : "All mailboxes"}</p>
            <p className="text-xs text-nv-text-muted truncate">{activeAccount ? activeAccount.email : `${accounts.length} mailboxes`}</p>
          </div>
          <ChevronDown size={16} className="text-nv-text-muted" />
        </button>

        <nav className="flex-1 overflow-y-auto px-2">
          {FOLDERS.map(f => (
            <button key={f.key} onClick={() => { setFolder(f.key); setSidebarOpen(false); setSelectedThread(null); setView("list"); }}
              className={cn("w-full flex items-center gap-4 px-4 py-3 rounded-full text-[15px] font-medium transition-colors mb-0.5",
                folder === f.key ? "bg-nv-teal/10 text-nv-teal" : "text-nv-text-secondary hover:bg-white/5")}>
              <f.icon size={20} />
              <span className="flex-1 text-left">{f.label}</span>
              {(folderCounts[f.key] || 0) > 0 && <span className={cn("text-xs font-semibold", f.key === "inbox" ? "text-nv-teal" : "text-nv-text-muted")}>{folderCounts[f.key]}</span>}
            </button>
          ))}
          <div className="h-px bg-white/5 my-3 mx-4" />
          <button onClick={goDashboard} className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-[15px] font-medium text-nv-text-secondary hover:bg-white/5 mb-0.5">
            <LayoutDashboard size={20} /> <span className="flex-1 text-left">Dashboard</span>
          </button>
          <button onClick={() => router.push("/admin/customers")} className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-[15px] font-medium text-nv-text-secondary hover:bg-white/5 mb-0.5">
            <Users size={20} /> <span className="flex-1 text-left">Customers</span>
          </button>
          <button onClick={() => { setSidebarOpen(false); goToView("accounts"); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-[15px] font-medium text-nv-text-secondary hover:bg-white/5">
            <Settings size={20} /> <span className="flex-1 text-left">Manage mailboxes</span>
          </button>
        </nav>

        <button onClick={toggleTheme} className="flex items-center gap-4 mx-2 px-4 py-3 rounded-full text-[15px] font-medium text-nv-text-secondary hover:bg-white/5"
          style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          {light ? <Moon size={20} /> : <Sun size={20} />}
          <span className="flex-1 text-left">{light ? "Dark mode" : "Light mode"}</span>
          <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", light ? "bg-nv-teal" : "bg-white/15")}>
            <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", light ? "translate-x-5" : "translate-x-0.5")} />
          </span>
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // LIST
  // ═══════════════════════════════════════════
  const allShownSelected = filtered.length > 0 && filtered.slice(0, shown).every(t => selected.has(t.thread_id));
  const anyUnreadSelected = filtered.some(t => selected.has(t.thread_id) && t.unread_count > 0);
  const anyUnstarredSelected = filtered.some(t => selected.has(t.thread_id) && !t.starred);
  const inTrash = folder === "trash", inSpam = folder === "spam";
  const selSenders = folder === "sent" ? [] : [...new Set(filtered.filter(t => selected.has(t.thread_id)).map(t => otherParty(t).toLowerCase()).filter(Boolean))];
  const selDomains = [...new Set(selSenders.map(domainOf).filter(d => d.length > 1))];

  return (
    <Theme light={light}>
    <div className="h-full flex flex-col bg-nv-void relative">
      {drawer}

      {selectMode ? (
        /* Selection toolbar */
        <div className="flex items-center gap-0.5 px-1 py-1.5 bg-nv-deep border-b border-white/5" style={safeTop}>
          <button onClick={() => setSelected(new Set())} aria-label="Cancel selection" className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><X size={24} /></button>
          <span className="flex-1 text-base font-semibold text-nv-text-primary">{selected.size} selected</span>
          <button onClick={() => bulk(anyUnreadSelected ? "mark_read" : "mark_unread")} aria-label={anyUnreadSelected ? "Mark read" : "Mark unread"} className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
            {anyUnreadSelected ? <MailOpen size={21} /> : <Mail size={21} />}
          </button>
          <button onClick={() => bulk(anyUnstarredSelected ? "star" : "unstar")} aria-label="Star" className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-warning hover:bg-white/5"><Star size={21} /></button>
          <button onClick={() => bulk(inTrash ? "delete" : "trash")} aria-label={inTrash ? "Delete forever" : "Trash"} className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-error hover:bg-white/5"><Trash2 size={21} /></button>
          <button onClick={() => setSelMenu(true)} aria-label="More" className="p-2.5 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><MoreVertical size={21} /></button>
        </div>
      ) : (
        /* Top bar: menu, dashboard, search (mailbox avatar inside), bell */
        <div className="flex items-center gap-1 px-2 py-2" style={safeTop}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Menu" className="p-2 rounded-full text-nv-text-muted hover:text-nv-text-primary hover:bg-white/5"><Menu size={24} /></button>
          <button onClick={goDashboard} aria-label="Back to dashboard" title="Dashboard" className="p-2 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5"><LayoutDashboard size={22} /></button>
          <div className="flex-1 min-w-0 flex items-center gap-2 pl-3 pr-1 py-1 bg-nv-deep rounded-full border border-white/5">
            <Search size={18} className="text-nv-text-muted shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mail" enterKeyHint="search"
              className="flex-1 min-w-0 w-full py-1.5 bg-transparent text-sm text-nv-text-primary placeholder:text-nv-text-muted focus:outline-none" />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search" className="p-1 text-nv-text-muted"><X size={16} /></button>}
            <button onClick={() => goToView("accounts")} aria-label="Switch account" title="Switch mailbox"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={activeAccount ? { backgroundColor: activeAccount.color + "25", color: activeAccount.color } : { backgroundColor: "#1C2D4A", color: "#8896A6" }}>
              {activeAccount ? activeAccount.initials : "All"}
            </button>
          </div>
          <NotificationBell />
        </div>
      )}

      {/* Folder line */}
      {!selectMode && (
        <div className="flex items-center gap-2 px-4 py-1">
          <span className="text-sm font-semibold text-nv-text-secondary">{FOLDER_LABEL[folder]}</span>
          <span className="text-xs text-nv-text-muted truncate">{activeAccount ? activeAccount.email : "All mailboxes"}</span>
          {folder === "inbox" && (folderCounts.inbox || 0) > 0 && <span className="text-[11px] font-bold text-nv-teal bg-nv-teal/10 rounded-full px-2 py-0.5">{folderCounts.inbox} unread</span>}
          {hasDraft && <button onClick={() => startCompose("new")} className="text-[11px] font-semibold text-nv-warning bg-nv-warning/15 rounded-full px-2 py-0.5">Unsent draft</button>}
          <button onClick={() => fetchThreads()} aria-label="Refresh" className="ml-auto p-2 rounded-full text-nv-text-muted hover:text-nv-teal hover:bg-white/5">
            <RefreshCw size={17} className={threadsQ.refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      )}
      <RefreshBar refreshing={threadsQ.refreshing && threads.length > 0} error={threadsQ.error} savedAt={threadsQ.savedAt} onRetry={() => fetchThreads()} />

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
        onTouchStart={(e) => { pull.current = e.currentTarget.scrollTop <= 0 ? e.touches[0].clientY : null; }}
        onTouchMove={(e) => { if (pull.current === null) return; const dy = e.touches[0].clientY - pull.current; setPullPx(dy > 0 && e.currentTarget.scrollTop <= 0 ? Math.min(90, dy * 0.45) : 0); }}
        onTouchEnd={() => { if (pullPx >= 60) { fetchThreads(); } setPullPx(0); pull.current = null; }}>
        {pullPx > 0 && (
          <div className="flex items-center justify-center text-nv-teal overflow-hidden transition-[height]" style={{ height: pullPx }}>
            <RefreshCw size={20} style={{ transform: `rotate(${pullPx * 4}deg)`, opacity: Math.min(1, pullPx / 60) }} />
          </div>
        )}
        {loading && !threads.length ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="text-nv-teal animate-spin" /></div>
        ) : threadsQ.error && !threads.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-3">
            <Mail size={40} className="text-nv-text-muted/30" />
            <p className="text-nv-text-muted text-sm">This mailbox could not be loaded.</p>
            <button onClick={() => fetchThreads()} className="px-4 py-2 rounded-full bg-nv-teal text-nv-abyss text-xs font-bold">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Mail size={40} className="text-nv-text-muted/30 mb-4" />
            <p className="text-nv-text-muted text-sm">{search ? "Nothing matches your search." : folder === "inbox" ? "You're all caught up." : `Nothing in ${FOLDER_LABEL[folder]}.`}</p>
          </div>
        ) : filtered.slice(0, shown).map(thread => {
          const other = otherParty(thread);
          const name = senderLabel(other);
          const unread = thread.unread_count > 0;
          const isSel = selected.has(thread.thread_id);
          const acct = accountByEmail.get((mailboxOf(thread) || "").toLowerCase());
          return (
            <SwipeRow key={thread.thread_id} disabled={selectMode} rightLabel={unread ? "Read" : "Unread"}
              onLeft={() => threadAction(inTrash ? "delete" : "trash", [thread.thread_id])}
              onRight={() => threadAction(unread ? "mark_read" : "mark_unread", [thread.thread_id])}
              onLongPress={() => { if (navigator.vibrate) navigator.vibrate(10); toggleSelect(thread.thread_id); }}>
              <div role="button" tabIndex={0} data-thread
                onClick={() => (selectMode ? toggleSelect(thread.thread_id) : openThread(thread))}
                onKeyDown={(e) => e.key === "Enter" && openThread(thread)}
                className={cn("w-full flex items-start gap-3 pl-3 pr-2 py-3 text-left cursor-pointer transition-colors active:bg-white/[0.03]",
                  isSel ? "bg-nv-teal/10" : unread && "bg-nv-teal/[0.02]")}>
                {/* Avatar — tap to select */}
                <button onClick={(e) => { e.stopPropagation(); toggleSelect(thread.thread_id); }} aria-label={isSel ? "Deselect" : "Select"}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                  style={isSel ? undefined : { backgroundColor: avatarColor(other) + "25", color: avatarColor(other) }}>
                  {isSel ? <CheckCircle2 size={26} className="text-nv-teal" /> : selectMode ? <Circle size={26} className="text-nv-text-muted/50" /> : name.charAt(0).toUpperCase()}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[15px] truncate", unread ? "font-bold text-nv-text-primary" : "font-medium text-nv-text-secondary")}>{name}</span>
                    {thread.message_count > 1 && <span className="text-xs text-nv-text-muted shrink-0">{thread.message_count}</span>}
                    {thread.has_attachments && <Paperclip size={13} className="text-nv-text-muted shrink-0" />}
                    <span className="flex-1" />
                    <span className={cn("text-xs shrink-0", unread ? "text-nv-teal font-semibold" : "text-nv-text-muted")}>{timeAgo(thread.latest_message)}</span>
                  </div>
                  <p className={cn("text-sm truncate mt-0.5", unread ? "font-semibold text-nv-text-primary" : "text-nv-text-secondary")}>{thread.subject || "(no subject)"}</p>
                  {!activeAccount && mailboxOf(thread) ? (
                    <p className="flex items-center gap-2 mt-0.5 min-w-0">
                      <span className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: acct?.color || (light ? "#3f4d61" : "#8896A6") }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: acct?.color || "#5A6A7E" }} />
                        {folder === "sent" ? "from" : "to"} {mailboxOf(thread)}
                      </span>
                      <span className="text-[13px] text-nv-text-muted truncate">{cleanPreview(thread.latest_body_preview)}</span>
                    </p>
                  ) : (
                    <p className="text-[13px] text-nv-text-muted truncate mt-0.5">{cleanPreview(thread.latest_body_preview) || "\u00a0"}</p>
                  )}
                </div>

                <button onClick={e => { e.stopPropagation(); threadAction(thread.starred ? "unstar" : "star", [thread.thread_id]); }} aria-label={thread.starred ? "Unstar" : "Star"} className="shrink-0 p-2 -mr-1 mt-0.5">
                  <Star size={19} className={thread.starred ? "fill-nv-warning text-nv-warning" : "text-nv-text-muted/40"} />
                </button>
              </div>
            </SwipeRow>
          );
        })}
        {filtered.length > shown && <div ref={sentinel} className="py-5 text-center text-xs text-nv-text-muted">{filtered.length - shown} more…</div>}
        {!loading && filtered.length > 0 && filtered.length <= shown && <div className="py-6 text-center text-[11px] text-nv-text-muted/70">{filtered.length} conversation{filtered.length === 1 ? "" : "s"}{threads.length >= 500 ? " · showing the latest 500" : ""}</div>}
        <div className="h-20" />
      </div>

      {/* Compose button */}
      {!selectMode && (
        <button onClick={() => startCompose("new")} aria-label="Compose"
          className="fixed bottom-5 right-4 z-30 flex items-center gap-2 pl-4 pr-5 py-3.5 bg-nv-deep border border-nv-teal/20 rounded-2xl shadow-nv-glow text-nv-teal font-display font-bold text-sm hover:bg-nv-slate transition-colors"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <Pencil size={18} /> Compose
        </button>
      )}

      {selMenu && (
        <ActionSheet title={`${selected.size} selected`} onClose={() => setSelMenu(false)} items={[
          { icon: CheckCircle2, label: allShownSelected ? "Clear selection" : "Select all", onClick: () => setSelected(allShownSelected ? new Set() : new Set(filtered.slice(0, shown).map(t => t.thread_id))) },
          ...(selSenders.length ? [
            { icon: CheckCircle2, label: selSenders.length === 1 ? `Select all from ${selSenders[0]}` : `Select all from these ${selSenders.length} senders`, hint: String(filtered.filter(t => selSenders.some(p => fromMatches(t, p))).length), onClick: () => selectFrom(selSenders) },
            ...(selDomains.length && selDomains.some(d => !OWN_DOMAINS.has(d.slice(1))) ? [{ icon: CheckCircle2, label: selDomains.length === 1 ? `Select all from ${selDomains[0]}` : `Select all from these ${selDomains.length} domains`, hint: String(filtered.filter(t => selDomains.some(p => fromMatches(t, p))).length), onClick: () => selectFrom(selDomains) }] : []),
            ...(selSenders.length === 1 ? [{ icon: Search, label: `Show only ${selSenders[0]}`, onClick: () => setSearch(selSenders[0]) }] : []),
            { icon: ShieldAlert, label: selSenders.length === 1 ? `Block ${selSenders[0]}` : `Block these ${selSenders.length} senders`, onClick: () => (selSenders.length === 1 ? confirmBlock(selSenders[0]) : setConfirmSheet({ title: `Block ${selSenders.length} senders? Their mail moves to Spam now and in future.`, label: `Block ${selSenders.length} senders`, onConfirm: () => selSenders.forEach(p => blockSender(p)) })) },
          ] : []),
          ...(inTrash || inSpam ? [{ icon: ArchiveRestore, label: "Move to Inbox", onClick: () => bulk("restore") }] : []),
          ...(!inSpam ? [{ icon: ShieldAlert, label: "Mark as spam", onClick: () => bulk("spam") }] : []),
          ...(inTrash ? [{ icon: Trash2, label: "Delete forever", onClick: () => bulk("delete"), danger: true }] : [{ icon: Trash2, label: "Move to Trash", onClick: () => bulk("trash"), danger: true }]),
        ]} />
      )}
      {confirmEl}{toastEl}
    </div>
    </Theme>
  );
}
