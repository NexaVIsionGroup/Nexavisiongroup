"use client";

import { useEffect, useState } from "react";

// Nexa Cloud — the sign-in page IS the phone's lock screen.
// One idea, spent in one place: a device that is already on and waiting for you. The page
// powers on once at load; signing in slides the lock screen away. On a handset the lock screen
// fills the display; from 640px up it sits inside a device frame with a slow aurora behind it.

export const CLOUD_INPUT =
  "w-full rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3.5 text-[16px] text-white " +
  "placeholder:text-white/35 outline-none transition-colors focus:border-[#00E5CC]/70 focus:bg-white/[0.09]";
export const CLOUD_LABEL = "block text-[13px] text-white/60 mb-1.5 pl-1";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// Boot sequence shown while the user's phone really starts on the rack (~35 s). `progress` is 0..1.
export type BootState = { progress: number; stage: number; done: boolean };
export const BOOT_STAGES = ["Finding your phone", "Powering on", "Starting Android", "Restoring your apps", "Connecting the screen"];

function BootScreen({ boot }: { boot: BootState }) {
  const R = 92, C = 2 * Math.PI * R;
  const pct = Math.round(boot.progress * 100);
  return (
    <div className={"nc-boot" + (boot.done ? " nc-boot-done" : "")} role="status" aria-live="polite">
      <div className="nc-core">
        <svg viewBox="0 0 220 220" className="nc-ring" aria-hidden>
          <defs>
            <linearGradient id="ncg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7CFFEA" /><stop offset="55%" stopColor="#00E5CC" /><stop offset="100%" stopColor="#19B8FF" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r={R} className="nc-ring-track" />
          <circle cx="110" cy="110" r={R} className="nc-ring-fill" stroke="url(#ncg)"
            strokeDasharray={C} strokeDashoffset={C * (1 - boot.progress)} />
          <circle cx="110" cy="110" r="74" className="nc-ring-inner" />
        </svg>
        <div className="nc-orbit" aria-hidden><i /></div>
        <div className="nc-orbit nc-orbit-2" aria-hidden><i /></div>
        <div className="nc-pct"><span>{pct}</span><small>%</small></div>
      </div>
      <ol className="nc-stages">
        {BOOT_STAGES.map((label, i) => (
          <li key={label} className={i < boot.stage || boot.done ? "is-done" : i === boot.stage ? "is-now" : ""}>
            <span className="nc-tick" aria-hidden>{i < boot.stage || boot.done ? "\u2713" : ""}</span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function CloudShell({
  subtitle, unlocking = false, boot = null, children,
}: { subtitle: string; unlocking?: boolean; boot?: BootState | null; children: React.ReactNode }) {
  const now = useClock();
  const time = now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "") : "";
  const date = now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";

  return (
    <div className="nc-stage">
      {/* raw HTML on purpose: as a text child React escapes the quotes in the CSS on the server but not on
          the client, which is a hydration mismatch */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="nc-aurora" aria-hidden />
      <div className="nc-device">
        <div className="nc-island" aria-hidden />
        <div className={"nc-screen" + (unlocking ? " nc-unlocking" : "")}>
          <div className="nc-status">
            <span>Nexa Cloud</span>
            <span className="nc-on"><i aria-hidden /> Always on</span>
          </div>

          {boot ? (
            <>
              <div className="nc-boot-head">
                <h1 className="nc-title">Nexa Cloud</h1>
                <p className="nc-sub" style={{ marginBottom: 0 }}>{subtitle}</p>
              </div>
              <BootScreen boot={boot} />
              <div className="nc-boot-foot">{children}</div>
            </>
          ) : (
            <>
              <div className="nc-clock" aria-hidden>
                <div className="nc-time">{time || " "}</div>
                <div className="nc-date">{date || " "}</div>
              </div>

              <div className="nc-panel">
                <h1 className="nc-title">Nexa Cloud</h1>
                <p className="nc-sub">{subtitle}</p>
                {children}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const CSS = `
.nc-stage{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;
  background:#03070F;overflow:hidden;font-family:var(--font-body),system-ui,sans-serif}
.nc-aurora{position:absolute;inset:-30%;
  background:
    radial-gradient(38% 34% at 28% 30%,rgba(0,229,204,.34),transparent 70%),
    radial-gradient(34% 40% at 74% 64%,rgba(123,94,167,.42),transparent 72%),
    radial-gradient(30% 30% at 60% 18%,rgba(56,132,255,.26),transparent 70%);
  filter:blur(60px);animation:nc-drift 26s ease-in-out infinite alternate}
@keyframes nc-drift{from{transform:translate3d(-3%,-2%,0) rotate(0deg) scale(1)}
  to{transform:translate3d(4%,3%,0) rotate(14deg) scale(1.12)}}

.nc-device{position:relative;width:100%;height:100dvh;display:flex}
.nc-island{display:none}
.nc-screen{position:relative;flex:1;display:flex;flex-direction:column;overflow-y:auto;
  padding:max(14px,env(safe-area-inset-top)) 22px max(22px,env(safe-area-inset-bottom));
  background:linear-gradient(180deg,rgba(6,12,26,.18) 0%,rgba(5,10,22,.62) 40%,rgba(5,10,22,.94) 62%,#050A16 100%);
  animation:nc-power 1.25s cubic-bezier(.2,.7,.2,1) both}
@keyframes nc-power{0%{opacity:0;filter:brightness(.2) saturate(.4)}
  55%{opacity:1;filter:brightness(1.18) saturate(1.1)}100%{opacity:1;filter:none}}

.nc-status{display:flex;justify-content:space-between;align-items:center;
  font-size:12.5px;font-weight:500;color:rgba(255,255,255,.78);letter-spacing:.01em}
.nc-on{display:inline-flex;align-items:center;gap:6px;color:rgba(255,255,255,.62)}
.nc-on i{width:7px;height:7px;border-radius:50%;background:#00E5CC;box-shadow:0 0 10px 2px rgba(0,229,204,.7);
  animation:nc-pulse 2.6s ease-in-out infinite}
@keyframes nc-pulse{50%{opacity:.35;box-shadow:0 0 4px 0 rgba(0,229,204,.4)}}

.nc-clock{text-align:center;margin-top:clamp(28px,9dvh,84px);
  animation:nc-rise .9s .35s cubic-bezier(.2,.7,.2,1) both}
.nc-time{font-family:var(--font-display),system-ui,sans-serif;font-weight:400;line-height:.92;
  font-size:clamp(76px,23vw,118px);letter-spacing:-.045em;color:#fff;
  font-variant-numeric:tabular-nums;text-shadow:0 0 42px rgba(0,229,204,.28)}
.nc-date{margin-top:10px;font-size:16px;color:rgba(255,255,255,.72)}
@keyframes nc-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

.nc-panel{margin-top:auto;padding-top:28px;animation:nc-rise .9s .6s cubic-bezier(.2,.7,.2,1) both}
.nc-title{font-family:var(--font-display),system-ui,sans-serif;font-weight:700;font-size:30px;
  letter-spacing:-.025em;line-height:1.05;color:#fff}
.nc-sub{margin:6px 0 20px;font-size:15px;color:rgba(255,255,255,.62)}

.nc-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
  border:0;border-radius:999px;padding:15px 18px;font-size:16px;font-weight:700;cursor:pointer;
  font-family:var(--font-display),system-ui,sans-serif;color:#03121A;
  background:linear-gradient(135deg,#7CFFEA 0%,#00E5CC 45%,#19B8FF 100%);
  box-shadow:0 10px 34px -10px rgba(0,229,204,.75);transition:transform .15s,box-shadow .15s,opacity .15s}
.nc-btn:hover{transform:translateY(-1px);box-shadow:0 14px 40px -10px rgba(0,229,204,.9)}
.nc-btn:active{transform:translateY(0) scale(.99)}
.nc-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
.nc-btn:focus-visible,.nc-stage input:focus-visible{outline:2px solid #7CFFEA;outline-offset:2px}
.nc-error{font-size:14px;color:#FFB4B4;background:rgba(255,80,80,.10);border:1px solid rgba(255,120,120,.28);
  border-radius:14px;padding:10px 13px}
.nc-foot{margin-top:16px;text-align:center;font-size:13px;color:rgba(255,255,255,.45)}
.nc-row{margin-top:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.nc-pay{flex:none;display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;cursor:pointer;
  font-size:13px;font-weight:600;color:#7CFFEA;background:rgba(0,229,204,.08);border:1px solid rgba(0,229,204,.35);
  transition:background .15s,border-color .15s}
.nc-pay:hover{background:rgba(0,229,204,.16);border-color:rgba(0,229,204,.6)}
.nc-pay:focus-visible,.nc-link:focus-visible{outline:2px solid #7CFFEA;outline-offset:2px}
.nc-link{display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:4px 2px;cursor:pointer;
  font-size:14px;color:rgba(255,255,255,.6)}
.nc-link:hover{color:#fff}
.nc-note{font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.78);background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:12px 14px}

/* ---- boot sequence: the phone is really starting on the rack ---- */
.nc-boot-head{margin-top:clamp(18px,5dvh,44px);text-align:center;animation:nc-rise .7s .1s both}
.nc-boot{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(18px,4dvh,34px);padding:10px 0}
.nc-core{position:relative;width:min(62vw,236px);aspect-ratio:1;animation:nc-rise .8s .25s both}
.nc-core::before{content:"";position:absolute;inset:-18%;border-radius:50%;
  background:radial-gradient(circle,rgba(0,229,204,.34) 0%,rgba(25,184,255,.16) 38%,transparent 66%);
  filter:blur(14px);animation:nc-breathe 2.8s ease-in-out infinite}
@keyframes nc-breathe{50%{transform:scale(1.1);opacity:.72}}
.nc-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.nc-ring-track{fill:none;stroke:rgba(255,255,255,.08);stroke-width:7}
.nc-ring-fill{fill:none;stroke-width:7;stroke-linecap:round;transition:stroke-dashoffset .9s cubic-bezier(.3,.7,.2,1);
  filter:drop-shadow(0 0 9px rgba(0,229,204,.85))}
.nc-ring-inner{fill:rgba(3,10,22,.55);stroke:rgba(124,255,234,.16);stroke-width:1}
.nc-orbit{position:absolute;inset:-5%;animation:nc-spin 3.2s linear infinite}
.nc-orbit i{position:absolute;top:0;left:50%;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;
  background:#fff;box-shadow:0 0 14px 4px rgba(124,255,234,.95),0 0 34px 10px rgba(0,229,204,.45)}
.nc-orbit-2{inset:9%;animation-duration:5.4s;animation-direction:reverse;opacity:.7}
.nc-orbit-2 i{width:5px;height:5px;margin-left:-2.5px;box-shadow:0 0 10px 3px rgba(25,184,255,.9)}
@keyframes nc-spin{to{transform:rotate(360deg)}}
.nc-pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:2px;color:#fff;
  font-family:var(--font-display),system-ui,sans-serif;font-variant-numeric:tabular-nums}
.nc-pct span{font-size:clamp(46px,14vw,62px);font-weight:500;letter-spacing:-.04em;line-height:1;text-shadow:0 0 30px rgba(0,229,204,.5)}
.nc-pct small{font-size:18px;color:rgba(255,255,255,.55);margin-top:12px}
.nc-stages{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px;width:min(100%,280px);
  animation:nc-rise .8s .45s both}
.nc-stages li{display:flex;align-items:center;gap:11px;font-size:15px;color:rgba(255,255,255,.30);transition:color .4s}
.nc-stages li.is-now{color:#fff}
.nc-stages li.is-done{color:rgba(255,255,255,.62)}
.nc-tick{flex:none;width:18px;height:18px;border-radius:50%;border:1.5px solid rgba(255,255,255,.18);
  display:inline-flex;align-items:center;justify-content:center;font-size:11px;line-height:1;color:#03121A;transition:all .35s}
.is-now .nc-tick{border-color:#7CFFEA;box-shadow:0 0 0 4px rgba(0,229,204,.16);animation:nc-pulse 1.4s ease-in-out infinite}
.is-done .nc-tick{background:#00E5CC;border-color:#00E5CC}
.nc-boot-foot{text-align:center;padding-bottom:4px}
/* ready: the ring flares, then the whole screen lifts away into the phone */
.nc-boot-done .nc-ring-fill{filter:drop-shadow(0 0 22px rgba(124,255,234,1))}
.nc-boot-done .nc-core{animation:nc-flare .9s ease-out forwards}
.nc-boot-done .nc-orbit{opacity:0;transition:opacity .3s}
@keyframes nc-flare{35%{transform:scale(1.08);filter:brightness(1.6)}100%{transform:scale(1.9);opacity:0;filter:brightness(2.2)}}
.nc-boot-done .nc-stages{animation:nc-unlock .5s .15s ease-in forwards}

/* signing in: the lock screen slides away */
.nc-unlocking .nc-clock,.nc-unlocking .nc-panel,.nc-unlocking .nc-status{
  animation:nc-unlock .55s cubic-bezier(.5,0,.8,.4) forwards}
@keyframes nc-unlock{to{opacity:0;transform:translateY(-46px) scale(.97)}}

/* from tablet up: show the device itself */
@media (min-width:640px){
  .nc-device{width:392px;height:min(820px,calc(100dvh - 48px));padding:11px;border-radius:56px;
    background:linear-gradient(145deg,#2A3346 0%,#0C111C 38%,#05080F 100%);
    box-shadow:0 0 0 1px rgba(255,255,255,.10) inset,0 0 0 1.5px #000,
      0 50px 120px -30px rgba(0,0,0,.9),0 0 140px -20px rgba(0,229,204,.30)}
  .nc-screen{border-radius:46px;padding:20px 26px 28px;
    background:linear-gradient(180deg,rgba(6,12,26,.42) 0%,rgba(5,10,22,.80) 42%,#050A16 100%)}
  .nc-island{display:block;position:absolute;z-index:2;top:24px;left:50%;transform:translateX(-50%);
    width:96px;height:27px;border-radius:999px;background:#000;box-shadow:0 0 0 1px rgba(255,255,255,.05)}
  .nc-status{padding:0 6px}
  .nc-time{font-size:104px}
}
@media (prefers-reduced-motion:reduce){
  .nc-aurora,.nc-on i,.nc-core::before,.is-now .nc-tick{animation:none}
  .nc-orbit{display:none}
  .nc-screen,.nc-clock,.nc-panel{animation-duration:.01s;animation-delay:0s}
}
`;
