"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type HlsType from "hls.js";

// Nexa Video web app — the Android app's media center for iPhone / Safari. One page, a small view stack (with the
// browser/swipe Back wired to it), and a full-screen player using hls.js (iOS 17.1+ ManagedMediaSource) so stream
// requests carry Safari's own User-Agent — the token the rack resolved was minted for exactly that UA.

type Item = { t: string; y?: string; u?: string; k?: string; p?: string | null; id?: string; r?: number; g?: string; pl?: string };
type Ep = { n: number; s: number; u: string; t: string; date?: string; desc?: string };
type Person = { name: string; role: string; photo: string | null };
type Details = { cert?: string; credits: string[]; cast: Person[]; similar: Item[]; r?: number; g?: string; min?: number; pl?: string; p?: string | null };
type Title = { t: string; y: string; u: string; k: string; p?: string; info: string; desc: string; imdb?: string; seasons: number[]; showId?: string; episodes: Ep[]; x?: Details };
type View = { v: "home" } | { v: "search" } | { v: "list" } | { v: "title"; u: string } | { v: "see"; title: string; items: Item[] };
type PlayReq = { u?: string; src?: { url: string; type: string }; label: string; key: string; poster?: string | null; show?: { u: string; t: string; p?: string | null }; eps?: Ep[]; idx?: number };
type Saved = { pos: number; dur: number; label: string; poster?: string | null; u: string; show?: { u: string; t: string; p?: string | null }; at: number };

const ACCENT = "#4FA3FF";
/** titles that aren't on Nexa ("Not on Nexa yet" row) — hidden for now (owner, 2026-11-01); "More like this" is
 *  filtered on the rack (nvweb SHOW_NOT_ON_NEXA) */
const SHOW_NOT_ON_NEXA = false;

class SignedOut extends Error {}

async function api<T>(path: string): Promise<T> {
  const r = await fetch("/api/nexavideo/web/" + path, { credentials: "same-origin" });
  const j = await r.json().catch(() => ({ error: "Bad response" }));
  if (r.status === 401) throw new SignedOut(j.error || "signed out");
  if (!r.ok || j.error) throw new Error(j.error || "Something went wrong");
  return j as T;
}

// ---------------------------------------------------------------- resume points + watched (this device)
const POS_KEY = "nv_pos";
function loadPos(): Record<string, Saved> {
  try { return JSON.parse(localStorage.getItem(POS_KEY) || "{}"); } catch { return {}; }
}
function savePos(key: string, s: Saved | null) {
  try {
    const all = loadPos();
    if (s) all[key] = s; else delete all[key];
    const keep = Object.entries(all).sort((a, b) => b[1].at - a[1].at).slice(0, 60);
    localStorage.setItem(POS_KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch { /* private mode */ }
}
const WATCHED_KEY = "nv_watched";
function watched(): Record<string, 1> { try { return JSON.parse(localStorage.getItem(WATCHED_KEY) || "{}"); } catch { return {}; } }
function markWatched(u: string) { try { const w = watched(); w[u] = 1; localStorage.setItem(WATCHED_KEY, JSON.stringify(w)); } catch { /* */ } }

const clock = (s: number) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
};

// ================================================================ app shell
export default function WebApp({ user, notice }: { user: { username: string; trialDays: number | null } | null; notice: string | null }) {
  const [signedIn, setSignedIn] = useState(!!user);
  const [stack, setStack] = useState<View[]>([{ v: "home" }]);
  const [player, setPlayer] = useState<PlayReq | null>(null);
  const [tab, setTab] = useState<"home" | "search" | "list">("home");
  const view = stack[stack.length - 1];

  // browser / edge-swipe Back pops our own stack
  const depth = useRef(0);
  const playerOpen = useRef(false);
  useEffect(() => { playerOpen.current = !!player; }, [player]);
  useEffect(() => {
    const onPop = () => {
      if (depth.current <= 0) return;
      depth.current--;
      if (playerOpen.current) { playerOpen.current = false; setPlayer(null); }
      else setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const push = useCallback((v: View) => { history.pushState({ nv: 1 }, ""); depth.current++; setStack((s) => [...s, v]); window.scrollTo(0, 0); }, []);
  const back = useCallback(() => history.back(), []);
  const play = useCallback((p: PlayReq) => { history.pushState({ nv: 1 }, ""); depth.current++; setPlayer(p); }, []);
  const go = (t: "home" | "search" | "list") => { setTab(t); setStack([{ v: t }]); window.scrollTo(0, 0); };
  const open = useCallback((it: Item) => {
    if (it.u) push({ v: "title", u: it.u });
  }, [push]);

  if (!signedIn) return <Login notice={notice} onDone={() => setSignedIn(true)} />;

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none bg-[#07080b] text-white" id="nvscroll"
      style={{ fontFamily: "var(--font-body), system-ui, -apple-system, sans-serif", WebkitTapHighlightColor: "transparent" }}>
      <div className="pb-[calc(84px+env(safe-area-inset-bottom))]">
        {view.v === "home" && <Home open={open} push={push} play={play} trialDays={user?.trialDays ?? null} onSignedOut={() => setSignedIn(false)} />}
        {view.v === "search" && <Search open={open} />}
        {view.v === "list" && <MyList open={open} play={play} />}
        {view.v === "see" && <SeeAll title={view.title} items={view.items} open={open} back={back} />}
        {view.v === "title" && <TitlePage key={view.u} u={view.u} back={back} play={play} open={open} />}
      </div>
      {/* bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#07080b]/90 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-xl">
          {([["home", "⌂", "Home"], ["search", "⌕", "Search"], ["list", "▶", "Continue"]] as const).map(([k, ic, label]) => (
            <button key={k} onClick={() => go(k)} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[12px] font-semibold ${tab === k ? "text-white" : "text-white/45"}`}>
              <span className="text-[22px] leading-none" style={{ color: tab === k ? ACCENT : undefined }}>{ic}</span>{label}
            </button>
          ))}
        </div>
      </nav>
      {player && <Player req={player} close={back} replace={(p) => setPlayer(p)} />}
      <InstallHint />
    </div>
  );
}

// ================================================================ sign in
function Login({ notice, onDone }: { notice: string | null; onDone: () => void }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(notice || ""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/nexavideo/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p, webapp: true }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) onDone(); else setErr(j.error || "Could not sign in.");
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#07080b] px-5 text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]" style={{ background: "radial-gradient(closest-side, #4FA3FF, #a78bfa 55%, transparent)" }} />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
        <div className="mb-6 text-center">
          <span className="text-3xl font-black tracking-[0.2em]" style={{ color: ACCENT }}>NEXA</span>
          <span className="ml-2 text-xs font-semibold tracking-[0.4em] text-white/50">VIDEO</span>
          <p className="mt-3 text-[15px] text-white/60">Sign in with the username and password from your invite.</p>
        </div>
        <input value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="Username"
          className="mb-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-[17px] outline-none focus:border-[#4FA3FF]" />
        <input value={p} onChange={(e) => setP(e.target.value)} type="password" placeholder="Password"
          className="mb-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-[17px] outline-none focus:border-[#4FA3FF]" />
        {err && <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-[15px] text-red-200">{err}</div>}
        <button disabled={busy} className="w-full rounded-xl bg-white py-3.5 text-[17px] font-bold text-[#07080b] disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
        <a href="/nexavideo" className="mt-5 block text-center text-[14px] text-white/45">No account? Request access</a>
      </form>
    </div>
  );
}

// ================================================================ shared bits
function useData<T>(path: string | null, onSignedOut?: () => void) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!path) return;
    let alive = true;
    setErr("");
    api<T>(path).then((d) => alive && setData(d)).catch((e) => {
      if (!alive) return;
      if (e instanceof SignedOut) { onSignedOut ? onSignedOut() : location.reload(); return; }
      setErr(e.message);
    });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return { data, err };
}

function Poster({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#1a2440] to-[#0d0f16] p-2 text-center text-[13px] font-semibold text-white/60 ${className}`}>{alt}</div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}

function Tile({ it, onClick, wide }: { it: Item; onClick: () => void; wide?: boolean }) {
  return (
    <button onClick={onClick} className={`group shrink-0 text-left ${wide ? "w-full" : "w-[124px] md:w-[150px]"}`}>
      <div className="relative overflow-hidden rounded-xl bg-white/5 shadow-lg ring-1 ring-white/10 transition group-active:scale-95">
        <Poster src={it.p} alt={it.t} className="aspect-[2/3] w-full" />
        {!!it.r && <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[12px] font-bold text-amber-300 backdrop-blur">★ {it.r.toFixed(1)}</span>}
        {it.k === "t" && <span className="absolute right-1.5 top-1.5 rounded-md bg-[#4FA3FF]/85 px-1.5 py-0.5 text-[10px] font-black tracking-wider">TV</span>}
      </div>
      <div className="mt-1.5 line-clamp-2 text-[13.5px] font-semibold leading-tight text-white/90">{it.t}</div>
      {it.y && <div className="text-[12px] text-white/45">{it.y}</div>}
    </button>
  );
}

function Row({ title, items, open, onSeeAll, sub }: { title: string; items: Item[]; open: (i: Item) => void; onSeeAll?: () => void; sub?: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-7">
      <button onClick={onSeeAll} className="mb-2.5 flex w-full items-end justify-between px-4 text-left">
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight">{title}</h2>
          {sub && <div className="text-[13px] text-white/45">{sub}</div>}
        </div>
        {onSeeAll && <span className="text-[14px] font-semibold" style={{ color: ACCENT }}>See all ›</span>}
      </button>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
        {items.slice(0, 14).map((it, i) => <div key={(it.u || it.id || "") + i} style={{ scrollSnapAlign: "start" }}><Tile it={it} onClick={() => open(it)} /></div>)}
      </div>
    </section>
  );
}

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-white/50">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#4FA3FF]" />
      {label && <div className="text-[14px]">{label}</div>}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="mx-4 mt-10 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-center text-[15px] text-red-100">{msg}</div>;
}

// ================================================================ home
type HomeData = { featured: Item[]; recent: Item[] };
type Chart = { on: Item[]; soon: Item[] };

function Home({ open, push, play, trialDays, onSignedOut }: { open: (i: Item) => void; push: (v: View) => void; play: (p: PlayReq) => void; trialDays: number | null; onSignedOut: () => void }) {
  const home = useData<HomeData>("home", onSignedOut);
  const mov = useData<Chart>("chart?c=MOST_POPULAR_MOVIES", onSignedOut);
  const tv = useData<Chart>("chart?c=MOST_POPULAR_TV_SHOWS", onSignedOut);
  const [cont, setCont] = useState<[string, Saved][]>([]);
  useEffect(() => { setCont(Object.entries(loadPos()).sort((a, b) => b[1].at - a[1].at).slice(0, 12)); }, []);
  const hero = useMemo(() => (home.data?.featured || []).filter((i) => i.p).slice(0, 6), [home.data]);
  const [hi, setHi] = useState(0);
  useEffect(() => { if (hero.length < 2) return; const t = setInterval(() => setHi((x) => (x + 1) % hero.length), 7000); return () => clearInterval(t); }, [hero.length]);
  const see = (title: string, items: Item[]) => () => push({ v: "see", title, items });

  if (home.err && !home.data) return <ErrorBox msg={home.err} />;
  if (!home.data) return <Spinner label="Loading Nexa…" />;
  const h = hero[hi];
  return (
    <div>
      {/* hero */}
      {h && (
        <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden">
          <Poster src={h.p} alt={h.t} className="absolute inset-0 h-full w-full scale-110 opacity-60 blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/40 to-[#07080b]/30" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
            <div><span className="text-[22px] font-black tracking-[0.2em]" style={{ color: ACCENT }}>NEXA</span><span className="ml-1.5 text-[10px] font-semibold tracking-[0.4em] text-white/60">VIDEO</span></div>
            {trialDays !== null && <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[12px] font-semibold text-amber-200">Trial · {trialDays} day{trialDays === 1 ? "" : "s"} left</span>}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 px-4 pb-6">
            <button onClick={() => open(h)} className="w-[112px] shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20"><Poster src={h.p} alt={h.t} className="aspect-[2/3] w-full" /></button>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black tracking-[0.3em]" style={{ color: ACCENT }}>NEW ON NEXA</div>
              <h1 className="mt-1 line-clamp-2 text-[28px] font-black leading-[1.05] tracking-tight">{h.t}</h1>
              <div className="mt-1 text-[14px] text-white/65">{[h.y, h.r ? "★ " + h.r.toFixed(1) : "", h.g].filter(Boolean).join("  ·  ")}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => open(h)} className="rounded-xl bg-white px-5 py-2.5 text-[15px] font-bold text-black">▶ Watch</button>
                <button onClick={() => open(h)} className="rounded-xl bg-white/15 px-4 py-2.5 text-[15px] font-semibold backdrop-blur">Details</button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {hero.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === hi ? "w-5 bg-white" : "w-1.5 bg-white/35"}`} />)}
          </div>
        </div>
      )}

      {cont.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2.5 px-4 text-[20px] font-extrabold tracking-tight">Continue watching</h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
            {cont.map(([key, s]) => (
              <button key={key} onClick={() => play({ u: s.u, label: s.label, key, poster: s.poster, show: s.show })} className="w-[220px] shrink-0 text-left">
                <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
                  <Poster src={s.poster} alt={s.label} className="aspect-video w-full" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-[34px]">▶</div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><div className="h-full" style={{ width: `${s.dur ? Math.min(100, (s.pos / s.dur) * 100) : 0}%`, background: ACCENT }} /></div>
                </div>
                <div className="mt-1.5 line-clamp-1 text-[13.5px] font-semibold">{s.label}</div>
                <div className="text-[12px] text-white/45">{s.dur ? clock(s.dur - s.pos) + " left" : ""}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <Row title="Trending movies" sub="Most popular on IMDb right now" items={mov.data?.on || []} open={open} onSeeAll={see("Trending movies", mov.data?.on || [])} />
      <Row title="Trending TV shows" sub="Most popular on IMDb right now" items={tv.data?.on || []} open={open} onSeeAll={see("Trending TV shows", tv.data?.on || [])} />
      <Row title="New on Nexa" items={home.data.featured} open={open} onSeeAll={see("New on Nexa", home.data.featured)} />
      <Row title="Recently added" items={home.data.recent} open={open} onSeeAll={see("Recently added", home.data.recent)} />
      {SHOW_NOT_ON_NEXA && (mov.data?.soon?.length || 0) > 0 && (
        <Row title="Not on Nexa yet" sub="Hot right now — tap for the trailer" items={mov.data!.soon}
          open={(it) => it.id && api<{ url?: string; type?: string }>("trailer?id=" + it.id).then((t) => t.url && play({ src: { url: t.url, type: t.type || "mp4" }, label: it.t + " — trailer", key: "trailer" })).catch(() => {})} />
      )}
      {(!mov.data || !tv.data) && <div className="mt-8 text-center text-[13px] text-white/35">Loading trending lists…</div>}
    </div>
  );
}

function SeeAll({ title, items, open, back }: { title: string; items: Item[]; open: (i: Item) => void; back: () => void }) {
  return (
    <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}>
      <TopBar title={title} back={back} />
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-4 pt-3 sm:grid-cols-4 md:grid-cols-6">
        {items.map((it, i) => <Tile key={(it.u || "") + i} it={it} wide onClick={() => open(it)} />)}
      </div>
    </div>
  );
}

function TopBar({ title, back }: { title?: string; back: () => void }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <button onClick={back} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[22px] backdrop-blur">‹</button>
      {title && <h1 className="truncate text-[20px] font-extrabold">{title}</h1>}
    </div>
  );
}

// ================================================================ search
function Search({ open }: { open: (i: Item) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (q.trim().length < 2) { setItems(null); return; }
    setBusy(true);
    const t = setTimeout(() => {
      api<{ items: Item[] }>("search?q=" + encodeURIComponent(q.trim()))
        .then((d) => { setItems(d.items); setErr(""); }).catch((e) => setErr(e.message)).finally(() => setBusy(false));
    }, 450);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="sticky top-0 z-20 bg-[#07080b]/95 px-4 pb-3 pt-1 backdrop-blur-xl">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Movies and TV shows" enterKeyHint="search"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-3.5 text-[17px] outline-none focus:border-[#4FA3FF]" />
      </div>
      {busy && <Spinner />}
      {err && <ErrorBox msg={err} />}
      {!busy && items && items.length === 0 && <div className="py-20 text-center text-white/45">Nothing found for “{q}”.</div>}
      {!busy && items && (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-4 pt-2 sm:grid-cols-4 md:grid-cols-6">
          {items.map((it, i) => <Tile key={(it.u || "") + i} it={it} wide onClick={() => open(it)} />)}
        </div>
      )}
      {!items && !busy && <div className="py-24 text-center text-[15px] text-white/35">Search the whole Nexa catalogue.</div>}
    </div>
  );
}

// ================================================================ continue watching
function MyList({ open, play }: { open: (i: Item) => void; play: (p: PlayReq) => void }) {
  const [list, setList] = useState<[string, Saved][]>([]);
  useEffect(() => { setList(Object.entries(loadPos()).sort((a, b) => b[1].at - a[1].at)); }, []);
  return (
    <div className="px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}>
      <h1 className="mb-4 text-[26px] font-black">Continue watching</h1>
      {list.length === 0 && <div className="py-20 text-center text-white/40">Anything you start watching shows up here.</div>}
      <div className="space-y-3">
        {list.map(([key, s]) => (
          <div key={key} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-2.5 ring-1 ring-white/10">
            <button onClick={() => play({ u: s.u, label: s.label, key, poster: s.poster, show: s.show })} className="relative w-[120px] shrink-0 overflow-hidden rounded-lg">
              <Poster src={s.poster} alt={s.label} className="aspect-video w-full" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-[24px]">▶</div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><div className="h-full" style={{ width: `${s.dur ? (s.pos / s.dur) * 100 : 0}%`, background: ACCENT }} /></div>
            </button>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[15px] font-semibold">{s.label}</div>
              <div className="text-[13px] text-white/45">{s.dur ? clock(s.dur - s.pos) + " left" : clock(s.pos)}</div>
              {s.show && <button onClick={() => open({ t: s.show!.t, u: s.show!.u })} className="mt-1 text-[13px] font-semibold" style={{ color: ACCENT }}>All episodes ›</button>}
            </div>
            <button onClick={() => { savePos(key, null); setList((l) => l.filter(([k]) => k !== key)); }} className="px-2 text-[20px] text-white/35">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================ title page
function TitlePage({ u, back, play, open }: { u: string; back: () => void; play: (p: PlayReq) => void; open: (i: Item) => void }) {
  const { data: t, err } = useData<Title>("title?u=" + encodeURIComponent(u));
  const [season, setSeason] = useState<number | null>(null);
  const [eps, setEps] = useState<Ep[] | null>(null);
  const [castOpen, setCastOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [busyTrailer, setBusyTrailer] = useState(false);

  useEffect(() => {
    if (!t || t.k !== "t") return;
    // the page lists the newest season; open on the season last watched here, else the first one
    const last = Object.values(loadPos()).filter((s) => s.show?.u === t.u).sort((a, b) => b.at - a.at)[0];
    const lastS = last ? Number(/· S(\d+) E/.exec(last.label)?.[1]) : NaN;
    const s0 = lastS && t.seasons.includes(lastS) ? lastS : t.seasons.length ? Math.min(...t.seasons) : t.episodes[0]?.s ?? 1;
    setSeason(s0); setEps(t.episodes[0]?.s === s0 ? t.episodes : null);
  }, [t]);
  useEffect(() => {
    if (!t || season === null || !t.showId) return;
    if (t.episodes[0]?.s === season) { setEps(t.episodes); return; }
    setEps(null);
    api<{ episodes: Ep[] }>(`season?u=${encodeURIComponent(t.u)}&id=${t.showId}&s=${season}`).then((d) => setEps(d.episodes)).catch(() => setEps([]));
  }, [season, t]);

  if (err) return <div style={{ paddingTop: "env(safe-area-inset-top)" }}><TopBar back={back} /><ErrorBox msg={err} /></div>;
  if (!t) return <div style={{ paddingTop: "env(safe-area-inset-top)" }}><TopBar back={back} /><Spinner /></div>;

  const x = t.x;
  const poster = x?.p || t.p;
  const rating = x?.r;
  const meta = [t.y, x?.cert, x?.min ? (t.k === "t" ? `${x.min}m episodes` : `${Math.floor(x.min / 60) ? Math.floor(x.min / 60) + "h " : ""}${x.min % 60}m`) : "", t.k === "t" && t.seasons.length ? `${t.seasons.length} season${t.seasons.length > 1 ? "s" : ""}` : ""].filter(Boolean);
  const saved = loadPos();
  const w = watched();
  const show = { u: t.u, t: t.t, p: poster };
  const playEp = (list: Ep[], i: number) => {
    const e = list[i];
    play({ u: e.u, label: `${t.t} · S${e.s} E${e.n} · ${e.t}`, key: e.u, poster, show, eps: list, idx: i });
  };
  // series: resume the last started episode of this season, else the first not yet watched
  let nextEp: number = -1;
  if (eps?.length) {
    const started = eps.map((e, i) => [i, saved[e.u]?.at || 0] as const).filter(([, a]) => a).sort((a, b) => b[1] - a[1])[0];
    nextEp = started ? started[0] : Math.max(0, eps.findIndex((e) => !w[e.u]));
  }
  const movieSaved = t.k !== "t" ? saved[t.u] : undefined;
  const desc = x?.pl || t.desc;

  async function trailer() {
    if (!t?.imdb) return;
    setBusyTrailer(true);
    try {
      const tr = await api<{ url?: string; type?: string }>("trailer?id=" + t.imdb);
      if (tr.url) play({ src: { url: tr.url, type: tr.type || "mp4" }, label: t.t + " — trailer", key: "trailer" });
    } catch { /* no trailer */ }
    setBusyTrailer(false);
  }

  return (
    <div>
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <Poster src={poster} alt="" className="h-full w-full scale-125 opacity-40 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07080b]/30 via-[#07080b]/70 to-[#07080b]" />
        </div>
        <div className="relative px-2" style={{ paddingTop: "env(safe-area-inset-top)" }}><TopBar back={back} /></div>
        <div className="relative flex gap-4 px-4 pb-4 pt-1">
          <div className="w-[128px] shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/15 md:w-[180px]"><Poster src={poster} alt={t.t} className="aspect-[2/3] w-full" /></div>
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-[26px] font-black leading-[1.08] tracking-tight md:text-[36px]">{t.t}</h1>
            <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[14px] text-white/65">
              {!!rating && <span className="font-bold text-amber-300">★ {rating.toFixed(1)}</span>}
              {meta.map((m) => <span key={m}>{m}</span>)}
            </div>
            {x?.g && <div className="mt-1 text-[13.5px] text-white/50">{x.g}</div>}
          </div>
        </div>
        <div className="relative flex gap-2.5 px-4">
          {t.k === "t" ? (
            eps && eps.length > 0 && nextEp >= 0 && (
              <button onClick={() => playEp(eps, nextEp)} className="flex-1 rounded-xl bg-white py-3.5 text-[16px] font-bold text-black">
                ▶ {saved[eps[nextEp].u] ? "Resume" : "Play"} S{eps[nextEp].s} E{eps[nextEp].n}
              </button>
            )
          ) : (
            <button onClick={() => play({ u: t.u, label: t.t + (t.y ? ` (${t.y})` : ""), key: t.u, poster })} className="flex-1 rounded-xl bg-white py-3.5 text-[16px] font-bold text-black">
              ▶ {movieSaved ? `Resume ${clock(movieSaved.pos)}` : "Play"}
            </button>
          )}
          {t.imdb && <button onClick={trailer} disabled={busyTrailer} className="rounded-xl bg-white/12 px-5 py-3.5 text-[16px] font-semibold ring-1 ring-white/15 disabled:opacity-50">{busyTrailer ? "…" : "Trailer"}</button>}
        </div>
      </div>

      <div className="px-4">
        {desc && <p className="mt-5 text-[16px] leading-relaxed text-white/80">{desc}</p>}
        {x?.credits?.map((c) => <div key={c} className="mt-2 text-[14px] text-white/55">{c}</div>)}

        {t.k === "t" && (
          <section className="mt-7">
            {t.seasons.length > 1 && (
              <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
                {[...t.seasons].sort((a, b) => a - b).map((s) => (
                  <button key={s} onClick={() => setSeason(s)} className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold ${season === s ? "bg-white text-black" : "bg-white/10 text-white/75"}`}>Season {s}</button>
                ))}
              </div>
            )}
            {!eps && <Spinner />}
            <div className="space-y-2">
              {eps?.map((e, i) => {
                const sp = saved[e.u];
                return (
                  <button key={e.u} onClick={() => playEp(eps, i)} className="flex w-full gap-3 rounded-xl bg-white/[0.04] p-3 text-left ring-1 ring-white/[0.07] active:bg-white/10">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${w[e.u] ? "bg-white/10 text-white/40" : "bg-[#4FA3FF]/20 text-[#8cc4ff]"}`}>{w[e.u] ? "✓" : e.n}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold">{e.n}. {e.t}</div>
                      {e.date && <div className="text-[12.5px] text-white/40">{e.date}</div>}
                      {e.desc && <div className="mt-0.5 line-clamp-2 text-[13.5px] text-white/60">{e.desc}</div>}
                      {sp && sp.dur > 0 && <div className="mt-1.5 h-1 rounded bg-white/15"><div className="h-full rounded" style={{ width: `${(sp.pos / sp.dur) * 100}%`, background: ACCENT }} /></div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!!x?.cast?.length && (
          <section className="mt-8">
            <h2 className="mb-3 text-[19px] font-extrabold">Cast</h2>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {(castOpen ? x.cast : x.cast.slice(0, 8)).map((p) => (
                <div key={p.name + p.role} className="text-center">
                  <Poster src={p.photo} alt={p.name.split(" ").map((s) => s[0]).join("")} className="mx-auto aspect-square w-full rounded-full ring-1 ring-white/10" />
                  <div className="mt-1.5 line-clamp-2 text-[12.5px] font-semibold leading-tight">{p.name}</div>
                  {p.role && <div className="line-clamp-1 text-[11.5px] text-white/45">{p.role}</div>}
                </div>
              ))}
            </div>
            {x.cast.length > 8 && <button onClick={() => setCastOpen(!castOpen)} className="mt-3 text-[14px] font-semibold" style={{ color: ACCENT }}>{castOpen ? "Show less" : `Show all ${x.cast.length}`}</button>}
          </section>
        )}
      </div>

      {!!x?.similar?.length && (
        <section className="mt-8">
          <h2 className="mb-2.5 px-4 text-[19px] font-extrabold">More like this</h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
            {x.similar.slice(0, moreOpen ? 16 : 12).map((s) => <Tile key={s.id} it={s} onClick={() => (s.u ? open(s) : findAndOpen(s, open, () => setMoreOpen(true)))} />)}
          </div>
        </section>
      )}
    </div>
  );
}

/** "More like this" is IMDb data → find the title in the catalogue, open it */
async function findAndOpen(s: Item, open: (i: Item) => void, miss: () => void) {
  try {
    const d = await api<{ items: Item[] }>("search?q=" + encodeURIComponent(s.t));
    const n = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const hit = d.items.find((i) => i.id === s.id) || d.items.find((i) => n(i.t) === n(s.t) && (!s.y || !i.y || Math.abs(+i.y - +s.y) <= 1));
    if (hit) open(hit); else { alert(`${s.t} isn't on Nexa yet.`); miss(); }
  } catch { /* offline */ }
}

// ================================================================ player
function Player({ req, close, replace }: { req: PlayReq; close: () => void; replace: (p: PlayReq) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const hls = useRef<HlsType | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const next = req.eps && req.idx !== undefined && req.idx + 1 < req.eps.length ? req.eps[req.idx + 1] : null;
  const isTrailer = req.key === "trailer";

  const goNext = useCallback(() => {
    if (!next || !req.eps || req.idx === undefined) return;
    markWatched(req.key); savePos(req.key, null);
    const show = req.show;
    replace({ u: next.u, label: `${show?.t || ""} · S${next.s} E${next.n} · ${next.t}`, key: next.u, poster: req.poster, show, eps: req.eps, idx: req.idx + 1 });
  }, [next, req, replace]);

  useEffect(() => {
    let alive = true;
    const v = video.current!;
    setStatus("loading"); setMsg(""); setCountdown(null); setLeft(null);
    (async () => {
      try {
        const src = req.src || await api<{ url: string; type: string }>("play?u=" + encodeURIComponent(req.u!));
        if (!alive) return;
        const resume = !isTrailer ? loadPos()[req.key] : undefined;
        const start = resume && resume.pos > 20 && (!resume.dur || resume.pos < resume.dur - 60) ? resume.pos : 0;
        const Hls = (await import("hls.js")).default;
        if (!alive) return;
        if (src.type === "hls" && Hls.isSupported()) {
          const h = new Hls({ startPosition: start || -1, maxBufferLength: 60, enableWorker: true });
          hls.current = h;
          h.on(Hls.Events.ERROR, (_e, d) => {
            if (!d.fatal) return;
            if (d.type === Hls.ErrorTypes.MEDIA_ERROR) { h.recoverMediaError(); return; }
            setStatus("error"); setMsg(d.response?.code === 403 ? "This mirror refused the stream." : "The stream stopped loading.");
          });
          // like the Android app: subtitles off by default, English audio when the stream offers several
          h.on(Hls.Events.MANIFEST_PARSED, () => {
            h.subtitleTrack = -1; h.subtitleDisplay = false;
            const en = h.audioTracks.findIndex((a) => /^en/i.test(a.lang || "") || /english/i.test(a.name || ""));
            if (en >= 0 && h.audioTracks.length > 1) h.audioTrack = en;
          });
          h.loadSource(src.url);
          h.attachMedia(v);
        } else {
          v.src = src.url;
          if (start) v.addEventListener("loadedmetadata", () => { v.currentTime = start; }, { once: true });
        }
        v.play().catch(() => { /* needs a tap: the native controls are showing */ });
      } catch (e) {
        if (!alive) return;
        setStatus("error"); setMsg(e instanceof Error ? e.message : "Could not start this video.");
      }
    })();
    return () => { alive = false; hls.current?.destroy(); hls.current = null; v.removeAttribute("src"); v.load(); };
  }, [req, attempt, isTrailer]);

  // save the spot every few seconds; "up next" near the end
  useEffect(() => {
    const v = video.current!;
    let last = 0;
    const save = () => {
      if (isTrailer || !v.duration || !isFinite(v.duration) || !req.u) return;
      if (v.duration - v.currentTime < 45) { savePos(req.key, null); markWatched(req.key); return; }
      if (v.currentTime > 15) savePos(req.key, { pos: v.currentTime, dur: v.duration, label: req.label, poster: req.poster, u: req.u, show: req.show, at: Date.now() });
    };
    const onTime = () => {
      if (status !== "ready" && v.currentTime > 0) setStatus("ready");
      if (v.duration && isFinite(v.duration)) setLeft(v.duration - v.currentTime);
      if (Date.now() - last > 5000) { last = Date.now(); save(); }
    };
    const onEnded = () => { save(); if (next) setCountdown(8); };
    v.addEventListener("timeupdate", onTime); v.addEventListener("pause", save); v.addEventListener("ended", onEnded);
    window.addEventListener("pagehide", save);
    return () => { save(); v.removeEventListener("timeupdate", onTime); v.removeEventListener("pause", save); v.removeEventListener("ended", onEnded); window.removeEventListener("pagehide", save); };
  }, [req, next, status, isTrailer]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { goNext(); return; }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, goNext]);

  const showUpNext = !!next && left !== null && left < 40 && left > 0;
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={video} className="h-full w-full" controls playsInline autoPlay poster={req.poster || undefined} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-3 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}>
        <button onClick={close} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-[20px] backdrop-blur">✕</button>
        <div className="line-clamp-1 text-[15px] font-semibold text-white/90">{req.label}</div>
      </div>
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/20 border-t-[#4FA3FF]" />
          <div className="text-[14px]">{isTrailer ? "Loading trailer…" : "Finding the best stream…"}</div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-8 text-center">
          <div className="text-[17px] text-white/85">{msg}</div>
          <div className="flex gap-3">
            <button onClick={() => setAttempt((a) => a + 1)} className="rounded-xl bg-white px-6 py-3 font-bold text-black">Try again</button>
            <button onClick={close} className="rounded-xl bg-white/15 px-6 py-3 font-semibold">Close</button>
          </div>
        </div>
      )}
      {(showUpNext || countdown !== null) && next && (
        <div className="absolute bottom-24 right-4 w-[300px] rounded-2xl bg-[#101218]/95 p-4 ring-1 ring-white/15 backdrop-blur" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <div className="text-[11px] font-black tracking-[0.25em] text-white/50">UP NEXT</div>
          <div className="mt-1 line-clamp-2 text-[16px] font-bold">S{next.s} E{next.n} · {next.t}</div>
          <div className="mt-1 text-[13px]" style={{ color: ACCENT }}>{countdown !== null ? `Starting in ${countdown}…` : `Next episode in ${clock(left || 0)}`}</div>
          <button onClick={goNext} className="mt-3 w-full rounded-xl bg-white py-2.5 text-[15px] font-bold text-black">▶ Play now</button>
        </div>
      )}
    </div>
  );
}

// ================================================================ "Add to Home Screen" hint (iPhone Safari, not installed yet)
function InstallHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone || matchMedia("(display-mode: standalone)").matches;
    let dismissed = false;
    try { dismissed = localStorage.getItem("nv_install_hint") === "1"; } catch { /* */ }
    setShow(ios && !standalone && !dismissed);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-3 z-40 rounded-2xl bg-[#1b2030]/95 p-4 text-[14.5px] text-white/85 shadow-2xl ring-1 ring-white/15 backdrop-blur" style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}>
      <button onClick={() => { setShow(false); try { localStorage.setItem("nv_install_hint", "1"); } catch { /* */ } }} className="absolute right-3 top-2 text-[20px] text-white/40">✕</button>
      <b className="text-white">Put Nexa Video on your home screen</b><br />
      Tap <span className="mx-1 inline-block rounded bg-white/15 px-1.5">Share ⬆︎</span> below, then <b>Add to Home Screen</b>. It opens full screen like an app.
    </div>
  );
}
