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

export default function CloudShell({
  subtitle, unlocking = false, children,
}: { subtitle: string; unlocking?: boolean; children: React.ReactNode }) {
  const now = useClock();
  const time = now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "") : "";
  const date = now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";

  return (
    <div className="nc-stage">
      <style>{CSS}</style>
      <div className="nc-aurora" aria-hidden />
      <div className="nc-device">
        <div className="nc-island" aria-hidden />
        <div className={"nc-screen" + (unlocking ? " nc-unlocking" : "")}>
          <div className="nc-status">
            <span>Nexa Cloud</span>
            <span className="nc-on"><i aria-hidden /> Always on</span>
          </div>

          <div className="nc-clock" aria-hidden>
            <div className="nc-time">{time || " "}</div>
            <div className="nc-date">{date || " "}</div>
          </div>

          <div className="nc-panel">
            <h1 className="nc-title">Nexa Cloud</h1>
            <p className="nc-sub">{subtitle}</p>
            {children}
          </div>
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
  .nc-aurora,.nc-on i{animation:none}
  .nc-screen,.nc-clock,.nc-panel{animation-duration:.01s;animation-delay:0s}
}
`;
