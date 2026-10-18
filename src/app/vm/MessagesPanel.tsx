"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, Plus, RefreshCw, Send, Trash2, X } from "lucide-react";

// Texting for the appliance. Its SIM is where the business's verification codes land and its
// screen is broken, so the whole conversation lives here: threads, history, replies, delete.
//
// It sits on the same aurora as the control deck, so Messages reads as another instrument on
// the same bridge rather than a different app. The hero is the code capsule: a verification
// code is the single most common reason anyone opens this, so when a message contains one it
// is pulled out of the text, set large and tracked out, and is one tap to the clipboard.
//
// Two deliberate omissions, both honest rather than lazy:
//  - no editing a sent text. The carrier delivered it; "editing" would only rewrite the local
//    copy into something that was never sent.
//  - no read receipts or typing state. Neither exists in SMS; faking them would be theatre.

type Msg = { id: number; body: string; when: string; incoming: boolean; read: boolean };
type Thread = { id: string; number: string; messages: Msg[]; unread: number; last: string; when: string; count: number };

const POLL_MS = 15_000;

/** "2026-10-07 18:11:45" -> a short, local-looking stamp. */
function stamp(when: string, withDate = false) {
  if (!when) return "";
  const [d, t] = when.split(" ");
  if (!t) return when;
  const hhmm = t.slice(0, 5);
  if (!withDate) return hhmm;
  const today = new Date().toISOString().slice(0, 10);
  return d === today ? hhmm : `${d.slice(5)} ${hhmm}`;
}

/** Pull out anything that looks like a verification code, so it can be copied in one tap. */
function codeIn(body: string): string | null {
  const m = body.match(/\b(\d{4,8})\b/);
  return m ? m[1] : null;
}

function CodeCapsule({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={"hm-code" + (done ? " is-done" : "")}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch { /* clipboard blocked: the code is on screen anyway */ }
      }}>
      <span className="hm-code-label">{done ? "copied" : "code"}</span>
      <span className="hm-code-digits">{value}</span>
      <span className="hm-code-icon">{done ? <Check size={16} /> : <Copy size={16} />}</span>
    </button>
  );
}

export default function MessagesPanel({ onClose, onUnread }: {
  onClose: () => void;
  onUnread: (n: number) => void;
}) {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);     // a brand new conversation
  const [to, setTo] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/vm/sms", { cache: "no-store" });
      if (r.status === 401) { window.location.reload(); return; }
      const d = await r.json();
      if (d.ok === false) { setErr(String(d.error || "Could not read messages.")); return; }
      setErr("");
      const list = (d.threads || []) as Thread[];
      setThreads(list);
      onUnread(list.reduce((n, t) => n + (t.unread || 0), 0));
    } catch {
      setErr("Could not reach the phone.");
    }
  }, [onUnread]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!busy) load(); }, POLL_MS);
    return () => clearInterval(id);
  }, [load, busy]);

  const open = openId ? threads?.find((t) => t.id === openId) ?? null : null;

  // keep the newest message in view when a thread opens or grows
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open?.id, open?.count]);     // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    const number = (composing ? to : open?.number || "").trim();
    const text = draft.trim();
    if (!number || !text) return;
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/api/vm/sms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", number, body: text }),
      });
      const d = await r.json();
      if (!r.ok || d.ok === false) {
        setNote(String(d.error || "The phone did not send it."));
      } else {
        setDraft("");
        setComposing(false);
        setTo("");
        // the phone writes the sent copy itself; give it a beat, then refresh
        setTimeout(load, 1500);
      }
    } catch {
      setNote("Could not reach the phone.");
    }
    setBusy(false);
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this message from the phone? It cannot be undone, and the other side keeps their copy.")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/vm/sms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const d = await r.json();
      if (!r.ok || d.ok === false) setNote(String(d.error || "Could not delete it."));
      else await load();
    } catch {
      setNote("Could not reach the phone.");
    }
    setBusy(false);
  }

  const back = () => { if (open || composing) { setOpenId(null); setComposing(false); setNote(""); } else onClose(); };

  return (
    <div className="hm-stage">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hm-aurora" aria-hidden />
      <div className="hm-grid" aria-hidden />

      <header className="hm-head">
        <button className="hm-icon" aria-label={open || composing ? "Back" : "Close messages"} onClick={back}>
          {open || composing ? <ArrowLeft size={18} /> : <X size={18} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="hm-title">{composing ? "New message" : open ? open.number : "Messages"}</div>
          <div className="hm-sub">
            {open ? `${open.count} ${open.count === 1 ? "message" : "messages"}` : "Nexa Pro 13 · this phone’s number"}
          </div>
        </div>
        <button className="hm-icon" aria-label="Refresh" onClick={() => load()}><RefreshCw size={17} /></button>
        {!open && !composing && (
          <button className="hm-icon is-accent" aria-label="New message" onClick={() => { setComposing(true); setNote(""); }}>
            <Plus size={18} />
          </button>
        )}
      </header>
      <div className="hm-scan" aria-hidden />

      {err && <div className="hm-note">{err}</div>}
      {note && <div className="hm-note">{note}</div>}

      {/* ---------- thread list ---------- */}
      {!open && !composing && (
        <div className="hm-list">
          {threads === null && <div className="hm-empty"><Loader2 size={18} className="animate-spin" /> Reading the phone</div>}
          {threads?.length === 0 && <div className="hm-empty">No messages yet.</div>}
          {threads?.map((t, i) => (
            <button key={t.id} className={"hm-thread" + (t.unread ? " is-unread" : "")}
              style={{ "--i": i } as React.CSSProperties} onClick={() => setOpenId(t.id)}>
              <span className="hm-rail" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="hm-thread-top">
                  <span className="hm-number">{t.number || "Unknown"}</span>
                  <span className="hm-when">{stamp(t.when, true)}</span>
                </span>
                <span className="hm-snippet">{t.last}</span>
              </span>
              {t.unread > 0 && <span className="hm-badge">{t.unread}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ---------- one conversation ---------- */}
      {open && (
        <div className="hm-convo">
          {open.messages.map((m, i) => {
            const code = m.incoming ? codeIn(m.body) : null;
            return (
              <div key={m.id} className={"hm-row" + (m.incoming ? "" : " is-out")} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                <div className={"hm-bubble" + (m.incoming ? "" : " is-out")}>
                  <div className="hm-body">{m.body}</div>
                  {code && <CodeCapsule value={code} />}
                  <div className="hm-meta">
                    <span>{stamp(m.when, true)}</span>
                    <button className="hm-trash" aria-label="Delete message" onClick={() => remove(m.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}

      {/* ---------- composer ---------- */}
      {(open || composing) && (
        <div className="hm-composer">
          {composing && (
            <input className="hm-to" value={to} onChange={(e) => setTo(e.target.value)} inputMode="tel"
              placeholder="Phone number" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          )}
          <div className="hm-send-row">
            <textarea className="hm-input" value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="Message" rows={1} />
            <button className={"hm-send" + (busy ? " is-busy" : "")} onClick={send}
              disabled={busy || !draft.trim() || (composing && !to.trim())} aria-label="Send">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
.hm-stage{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;overflow:hidden;background:#03070F;
  font-family:var(--font-body),system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  animation:hm-in .3s cubic-bezier(.2,.7,.2,1) both}
@keyframes hm-in{from{opacity:0;transform:translateY(18px) scale(.99)}to{opacity:1;transform:none}}
/* the same sky as the control deck, so this reads as another instrument on the same bridge */
.hm-aurora{position:absolute;inset:-30%;pointer-events:none;
  background:
    radial-gradient(36% 32% at 22% 18%,rgba(0,229,204,.26),transparent 70%),
    radial-gradient(34% 38% at 80% 62%,rgba(123,94,167,.36),transparent 72%),
    radial-gradient(28% 28% at 60% 10%,rgba(56,132,255,.2),transparent 70%);
  filter:blur(64px);animation:hm-drift 30s ease-in-out infinite alternate}
@keyframes hm-drift{from{transform:translate3d(-3%,-2%,0) scale(1)}to{transform:translate3d(4%,3%,0) scale(1.1)}}
.hm-grid{position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,.10) 1px,transparent 1.2px);background-size:26px 26px;
  -webkit-mask-image:radial-gradient(70% 50% at 50% 30%,#000 10%,transparent 100%);
  mask-image:radial-gradient(70% 50% at 50% 30%,#000 10%,transparent 100%)}

.hm-head{position:relative;flex:none;display:flex;align-items:center;gap:8px;
  padding:max(12px,env(safe-area-inset-top)) 12px 12px;background:rgba(5,10,22,.55);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.hm-title{font-family:var(--font-display),system-ui,sans-serif;font-weight:700;font-size:17.5px;color:#fff;letter-spacing:-.02em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hm-sub{font-size:12.5px;color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* a hairline that sweeps once on open: the panel coming online */
.hm-scan{position:relative;flex:none;height:1px;background:rgba(255,255,255,.09);overflow:hidden}
.hm-scan::after{content:"";position:absolute;inset:0;width:38%;
  background:linear-gradient(90deg,transparent,rgba(0,229,204,.95),transparent);
  animation:hm-sweep 2.6s cubic-bezier(.4,0,.2,1) .2s 2}
@keyframes hm-sweep{from{transform:translateX(-110%)}to{transform:translateX(320%)}}

.hm-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:0;border-radius:13px;
  background:rgba(255,255,255,.05);color:rgba(255,255,255,.65);cursor:pointer;
  transition:background .15s,color .15s,transform .15s,box-shadow .15s}
.hm-icon:hover{background:rgba(255,255,255,.11);color:#fff}
.hm-icon:active{transform:scale(.93)}
.hm-icon.is-accent{color:#03121A;background:linear-gradient(135deg,#7CFFEA,#00E5CC 60%,#19B8FF);
  box-shadow:0 8px 22px -10px rgba(0,229,204,.95)}
.hm-icon:focus-visible,.hm-send:focus-visible,.hm-thread:focus-visible,.hm-code:focus-visible,.hm-input:focus-visible,.hm-to:focus-visible{outline:2px solid #7CFFEA;outline-offset:2px}
.hm-note{position:relative;margin:12px 16px 0;padding:11px 14px;border-radius:14px;font-size:14px;line-height:1.45;
  color:#FFB4B4;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.32)}
.hm-empty{position:relative;display:flex;align-items:center;justify-content:center;gap:9px;padding:52px 16px;
  color:rgba(255,255,255,.5);font-size:15px}

/* ---- threads: each one a card with a rail that lights when it is unread ---- */
.hm-list{position:relative;flex:1;overflow-y:auto;padding:12px 12px max(24px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:9px}
.hm-thread{position:relative;display:flex;align-items:center;gap:13px;width:100%;text-align:left;cursor:pointer;
  padding:14px 14px 14px 16px;border-radius:18px;color:inherit;font:inherit;overflow:hidden;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  transition:transform .18s,border-color .2s,background .2s,box-shadow .2s;
  animation:hm-rise .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*.045s)}
@keyframes hm-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.hm-thread:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.07)}
.hm-thread:active{transform:translateY(0) scale(.995)}
.hm-rail{position:absolute;left:0;top:14%;bottom:14%;width:3px;border-radius:0 3px 3px 0;background:rgba(255,255,255,.14);transition:all .25s}
.hm-thread.is-unread{border-color:rgba(0,229,204,.4);background:rgba(0,229,204,.07)}
.hm-thread.is-unread .hm-rail{background:linear-gradient(180deg,#7CFFEA,#00E5CC);box-shadow:0 0 14px 2px rgba(0,229,204,.75);top:6%;bottom:6%}
.hm-thread-top{display:flex;align-items:baseline;gap:10px}
.hm-number{flex:1;min-width:0;font-family:var(--font-display),system-ui,sans-serif;font-weight:600;font-size:16.5px;color:#fff;
  letter-spacing:.01em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hm-when{flex:none;font-size:11.5px;color:rgba(255,255,255,.38);font-variant-numeric:tabular-nums;letter-spacing:.04em}
.hm-snippet{display:-webkit-box;margin-top:4px;font-size:14px;color:rgba(255,255,255,.55);line-height:1.38;
  -webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hm-badge{flex:none;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--font-display),system-ui,sans-serif;font-weight:700;font-size:12.5px;color:#03121A;
  background:linear-gradient(135deg,#7CFFEA,#00E5CC);box-shadow:0 0 16px rgba(0,229,204,.6)}

/* ---- conversation ---- */
.hm-convo{position:relative;flex:1;overflow-y:auto;padding:16px 14px 10px;display:flex;flex-direction:column;gap:11px}
.hm-row{display:flex;animation:hm-pop .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*.03s)}
.hm-row.is-out{justify-content:flex-end}
@keyframes hm-pop{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
.hm-bubble{position:relative;max-width:84%;padding:12px 15px;border-radius:20px 20px 20px 7px;
  background:rgba(255,255,255,.065);border:1px solid rgba(255,255,255,.09);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.hm-bubble.is-out{border-radius:20px 20px 7px 20px;overflow:hidden;
  background:linear-gradient(135deg,rgba(0,229,204,.26),rgba(25,184,255,.17));border-color:rgba(0,229,204,.4);
  box-shadow:0 12px 30px -18px rgba(0,229,204,.9)}
/* a single sheen across outgoing bubbles, so "sent" has a moment */
.hm-bubble.is-out::after{content:"";position:absolute;inset:0;
  background:linear-gradient(120deg,transparent 32%,rgba(255,255,255,.16) 50%,transparent 68%);
  transform:translateX(-120%);animation:hm-sheen 1.5s cubic-bezier(.4,0,.2,1) .25s 1}
@keyframes hm-sheen{to{transform:translateX(120%)}}
.hm-body{font-size:15.5px;line-height:1.45;color:#fff;white-space:pre-wrap;word-break:break-word}
.hm-meta{display:flex;align-items:center;gap:10px;margin-top:7px;font-size:11.5px;color:rgba(255,255,255,.42);
  font-variant-numeric:tabular-nums;letter-spacing:.04em}
.hm-trash{margin-left:auto;display:inline-flex;border:0;background:none;padding:3px;cursor:pointer;color:rgba(255,255,255,.3);transition:color .15s}
.hm-trash:hover{color:#FF7B7B}

/* the hero: a code lifted out of the text, big enough to read across a counter */
.hm-code{display:flex;align-items:center;gap:12px;width:100%;margin-top:11px;padding:11px 14px;border-radius:15px;cursor:pointer;
  color:#03121A;border:0;background:linear-gradient(135deg,#7CFFEA 0%,#00E5CC 48%,#19B8FF 100%);
  box-shadow:0 12px 30px -14px rgba(0,229,204,.95);transition:transform .15s,box-shadow .2s,background .3s}
.hm-code:hover{transform:translateY(-1px);box-shadow:0 16px 36px -14px rgba(0,229,204,1)}
.hm-code:active{transform:translateY(0) scale(.99)}
.hm-code-label{font-size:10.5px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;opacity:.65}
.hm-code-digits{flex:1;font-family:var(--font-display),system-ui,sans-serif;font-weight:800;font-size:25px;
  letter-spacing:.17em;font-variant-numeric:tabular-nums;line-height:1}
.hm-code-icon{display:inline-flex;opacity:.75}
.hm-code.is-done{background:rgba(0,229,204,.16);color:#7CFFEA;box-shadow:none}

/* ---- composer ---- */
.hm-composer{position:relative;flex:none;padding:10px 12px max(14px,env(safe-area-inset-bottom));
  border-top:1px solid rgba(255,255,255,.09);background:rgba(5,10,22,.6);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.hm-to,.hm-input{border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);
  color:#fff;outline:none;transition:border-color .2s,box-shadow .2s}
.hm-to{width:100%;margin-bottom:9px;padding:12px 15px;font-size:16px;font-variant-numeric:tabular-nums}
.hm-to:focus,.hm-input:focus{border-color:rgba(0,229,204,.75);box-shadow:0 0 0 3px rgba(0,229,204,.14)}
.hm-send-row{display:flex;align-items:flex-end;gap:10px}
.hm-input{flex:1;min-width:0;max-height:140px;resize:none;padding:12px 15px;font:inherit;font-size:16px;line-height:1.4;border-radius:20px}
.hm-input::placeholder,.hm-to::placeholder{color:rgba(255,255,255,.33)}
.hm-send{flex:none;display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border:0;border-radius:50%;
  cursor:pointer;color:#03121A;background:linear-gradient(135deg,#7CFFEA,#00E5CC 55%,#19B8FF);
  box-shadow:0 10px 26px -10px rgba(0,229,204,.95);transition:transform .15s,opacity .15s,box-shadow .2s}
.hm-send:hover{transform:translateY(-1px)}
.hm-send:active{transform:scale(.94)}
.hm-send:disabled{opacity:.38;cursor:not-allowed;box-shadow:none;transform:none}
.hm-send.is-busy{animation:hm-pulse 1.1s ease-in-out infinite}
@keyframes hm-pulse{50%{box-shadow:0 10px 34px -6px rgba(0,229,204,1)}}

@media (min-width:640px){
  .hm-head,.hm-scan,.hm-list,.hm-convo,.hm-composer,.hm-note{max-width:34rem;margin-left:auto;margin-right:auto;width:100%}
}
@media (prefers-reduced-motion:reduce){
  .hm-stage,.hm-bubble.is-out::after,.hm-thread,.hm-row,.hm-aurora,.hm-scan::after,.hm-send.is-busy{animation:none}
}
`;
