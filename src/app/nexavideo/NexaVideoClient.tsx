"use client";

import { useState } from "react";

// Nexa Video landing — cinematic dark page: hero + sign-in / download card, features, screenshots, install steps.
// Signed out: sign-in card (accounts come from invite links). Signed in: the download button for the newest build.

type Props = {
  user: { username: string } | null;
  release: { name: string; size: number | null; notes: string; date: string } | null;
  shots: { src: string; caption: string; tall?: boolean }[];
  notice?: string | null;
};

const FEATURES = [
  { icon: "🔥", title: "Trending, every day", text: "Trending and top-rated movies and TV from IMDb, with ★ ratings on every poster." },
  { icon: "🔎", title: "Search everything", text: "Results as you type — movies and full series with every season and episode." },
  { icon: "🎬", title: "Trailers & cast", text: "Watch the trailer first. Cast photos, creators, age rating, runtime, more like this." },
  { icon: "⚡", title: "Native player", text: "Smooth hardware playback, English subtitles on demand, 10s / 30s skips, resume anywhere." },
  { icon: "⏭️", title: "Auto next episode", text: "An Up Next card near the end — binge a whole season without touching the phone." },
  { icon: "📁", title: "Your own videos", text: "Movies and shows you downloaded play in the same app, grouped by folder." },
  { icon: "▶️", title: "Continue watching", text: "Every show picks up where you stopped, with a progress bar on the poster." },
  { icon: "📺", title: "Made for the TV", text: "Plug the phone into a TV — full-screen, mouse-friendly, big readable layout." },
];

function mb(n: number | null) { return n ? `${(n / 1048576).toFixed(0)} MB` : ""; }

export default function NexaVideoClient({ user, release, shots, notice }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // "Request access": they pick username + password now; the owner switches the account on in the admin
  const [mode, setMode] = useState<"signin" | "request" | "sent">("signin");
  const [rq, setRq] = useState({ name: "", contact: "", username: "", password: "", confirm: "", note: "", website: "" });
  const setR = (k: keyof typeof rq) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRq({ ...rq, [k]: e.target.value });

  async function requestAccess(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await fetch("/api/nexavideo/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rq) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) setMode("sent"); else setError(j.error || "Could not send your request.");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await fetch("/api/nexavideo/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { window.location.reload(); return; }
    setError(j.error || "Could not sign in."); setBusy(false);
  }

  async function signOut() {
    await fetch("/api/nexavideo/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#07080b] text-white" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      {/* atmosphere */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[720px] w-[1200px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
          style={{ background: "radial-gradient(closest-side, #2563eb 0%, #7c3aed 45%, transparent 75%)" }} />
        <div className="absolute bottom-0 right-0 h-[520px] w-[620px] rounded-full opacity-20 blur-[140px]"
          style={{ background: "radial-gradient(closest-side, #e11d48, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at top, black 10%, transparent 65%)", WebkitMaskImage: "radial-gradient(ellipse at top, black 10%, transparent 65%)" }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-24">
        {/* top bar */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-[0.2em] text-[#4FA3FF]">NEXA</span>
            <span className="text-xs font-semibold tracking-[0.4em] text-white/50">VIDEO</span>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs tracking-widest text-white/60">PRIVATE · INVITE ONLY</span>
        </header>

        {/* hero */}
        <section className="grid items-center gap-12 pt-6 md:grid-cols-[1.15fr_0.85fr] md:pt-14">
          <div>
            <h1 className="text-[44px] font-black leading-[1.02] tracking-tight md:text-[68px]">
              Your private<br />
              <span className="bg-gradient-to-r from-[#4FA3FF] via-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent">cinema.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
              Movies, TV shows and your own downloads in one beautiful Android app — trending lists, IMDb ratings,
              trailers, a buttery native player and auto-next episodes. Built for the phone and the big screen.
            </p>

            {/* sign-in / download card */}
            <div className="mt-9 max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              {user ? (
                <>
                  <div className="text-sm text-white/60">Signed in as <span className="font-semibold text-white">{user.username}</span></div>
                  {release ? (
                    <a href="/api/nexavideo/download"
                      className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-[#07080b] shadow-[0_10px_40px_-10px_rgba(79,163,255,0.7)] transition hover:scale-[1.02]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Download for Android
                    </a>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-white/10 px-5 py-4 text-white/70">The first build is on its way — check back soon.</div>
                  )}
                  {release && (
                    <div className="mt-3 text-center text-sm text-white/50">
                      Version {release.name}{release.size ? ` · ${mb(release.size)}` : ""} · Android 11+
                    </div>
                  )}
                  <button onClick={signOut} className="mt-4 w-full text-center text-sm text-white/40 hover:text-white/70">Sign out</button>
                </>
              ) : mode === "sent" ? (
                <div className="text-center">
                  <div className="text-4xl">🎬</div>
                  <div className="mt-3 text-xl font-bold">Request sent</div>
                  <div className="mt-2 text-white/60">Thanks{rq.name ? `, ${rq.name.split(" ")[0]}` : ""}! Once you&apos;re approved you can sign in here and in the app with
                    the username <span className="font-semibold text-white">{rq.username.trim().toLowerCase()}</span> and the password you chose.</div>
                  <button onClick={() => { setMode("signin"); setUsername(rq.username.trim().toLowerCase()); }} className="mt-5 text-sm text-[#4FA3FF]">Back to sign in</button>
                </div>
              ) : mode === "request" ? (
                <form onSubmit={requestAccess}>
                  <div className="text-base font-semibold">Request access</div>
                  <div className="mt-1 text-sm text-white/50">Pick the username and password you&apos;ll use. You can sign in as soon as you&apos;re approved.</div>
                  <input className="hidden" tabIndex={-1} autoComplete="off" value={rq.website} onChange={setR("website")} aria-hidden="true" />
                  <input className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" value={rq.name} onChange={setR("name")} placeholder="Your name" autoComplete="name" />
                  <input className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" value={rq.contact} onChange={setR("contact")} placeholder="Phone or email" autoComplete="email" />
                  <input className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" value={rq.username} onChange={setR("username")} placeholder="Choose a username" autoCapitalize="none" autoComplete="username" />
                  <input className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" value={rq.password} onChange={setR("password")} placeholder="Choose a password (8+ characters)" type="password" autoComplete="new-password" />
                  <input className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" value={rq.confirm} onChange={setR("confirm")} placeholder="Password again" type="password" autoComplete="new-password" />
                  <textarea className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" value={rq.note} onChange={setR("note")} placeholder="Anything to add? (optional)" rows={2} maxLength={300} />
                  {error && <div className="mt-3 text-sm text-rose-400">{error}</div>}
                  <button disabled={busy}
                    className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-6 py-4 text-lg font-bold transition hover:brightness-110 disabled:opacity-50">
                    {busy ? "Sending…" : "Send request"}
                  </button>
                  <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="mt-4 w-full text-center text-sm text-white/45 hover:text-white/70">
                    Already have an account? Sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={signIn}>
                  <div className="text-base font-semibold">Sign in to download</div>
                  <div className="mt-1 text-sm text-white/50">Got an invite link? Open it first to create your account.</div>
                  {notice && <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">{notice}</div>}
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoComplete="username" autoCapitalize="none"
                    className="mt-5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" autoComplete="current-password"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base outline-none placeholder:text-white/30 focus:border-[#4FA3FF]/60" />
                  {error && <div className="mt-3 text-sm text-rose-400">{error}</div>}
                  <button disabled={busy}
                    className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-6 py-4 text-lg font-bold transition hover:brightness-110 disabled:opacity-50">
                    {busy ? "Signing in…" : "Sign in"}
                  </button>
                  <button type="button" onClick={() => { setMode("request"); setError(""); }}
                    className="mt-3 w-full rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-base font-semibold text-white/85 transition hover:border-[#4FA3FF]/50 hover:text-white">
                    Request access
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* phone mockup */}
          <div className="relative mx-auto w-[270px] md:w-[300px]">
            <div className="absolute -inset-8 rounded-[3rem] opacity-60 blur-3xl" style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed,#e11d48)" }} />
            <div className="relative rounded-[2.6rem] border border-white/15 bg-[#0b0c10] p-2.5 shadow-2xl">
              <div className="overflow-hidden rounded-[2.1rem] bg-black">
                {shots[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shots[0].src} alt={shots[0].caption} className="block w-full" />
                ) : (
                  <div className="flex aspect-[9/19] items-center justify-center text-white/30">Nexa Video</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* features */}
        <section className="mt-28">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Everything in one app</h2>
          <p className="mt-2 text-white/55">No browser tabs, no pop-ups, no switching apps.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 transition hover:-translate-y-1 hover:border-[#4FA3FF]/40">
                <div className="text-3xl">{f.icon}</div>
                <div className="mt-4 text-lg font-bold">{f.title}</div>
                <div className="mt-2 text-[15px] leading-relaxed text-white/60">{f.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* screenshots */}
        {shots.length > 0 && (
          <section className="mt-28">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">A look inside</h2>
            <div className="mt-10 flex snap-x gap-6 overflow-x-auto pb-4">
              {shots.map((s) => (
                <figure key={s.src} className={`shrink-0 snap-start ${s.tall ? "w-[240px]" : "w-[560px] max-w-[85vw]"}`}>
                  <div className="overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.src} alt={s.caption} className="block w-full" loading="lazy" />
                  </div>
                  <figcaption className="mt-3 text-sm text-white/55">{s.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* install steps */}
        <section className="mt-28">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Install in a minute</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Download", "Sign in above on your Android phone and tap Download for Android."],
              ["2", "Allow the install", "Open the file. If Android asks, allow your browser to install apps, then tap Install."],
              ["3", "Sign in & watch", "Open Nexa Video and sign in with the same username and password. Updates arrive in the app."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-lg font-black">{n}</div>
                <div className="mt-4 text-lg font-bold">{t}</div>
                <div className="mt-2 text-[15px] leading-relaxed text-white/60">{d}</div>
              </div>
            ))}
          </div>
        </section>

        {release?.notes && user && (
          <section className="mt-16 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="text-sm font-semibold tracking-widest text-white/50">WHAT&apos;S NEW IN {release.name}</div>
            <div className="mt-3 whitespace-pre-line text-white/75">{release.notes}</div>
          </section>
        )}

        <footer className="mt-24 text-center text-sm text-white/35">Nexa Video · private build for invited friends · Android 11 or newer</footer>
      </div>
    </div>
  );
}
