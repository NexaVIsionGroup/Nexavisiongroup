"use client";

import { useRef, useState } from "react";
import { Plus, X, Minimize2, Maximize } from "lucide-react";

// Tabbed rack terminal — Termux-style. Opens as a full-screen overlay so the tab
// strip is pinned at the very top of the viewport and always tappable (on a phone
// the terminal iframe captures all touch, so an inline tab bar buried in the page
// can't be reached). Each tab is an independent ttyd connection (a fresh root shell
// on the rack) — `listc` a different Claude session per tab. Tabs stay mounted when
// you switch (visibility, not unmount) so their sessions + scrollback survive.
const MAX_TABS = 6;

export function RackTerminal({ url, onClose }: { url: string; onClose?: () => void }) {
  const [tabs, setTabs] = useState<number[]>([1]);
  const [active, setActive] = useState(1);
  const [next, setNext] = useState(2);
  const rootRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  const add = () => {
    if (tabs.length >= MAX_TABS) return;
    setTabs((t) => [...t, next]);
    setActive(next);
    setNext((n) => n + 1);
  };

  const close = (id: number) => {
    if (tabs.length <= 1) return;
    const idx = tabs.indexOf(id);
    const rest = tabs.filter((t) => t !== id);
    setTabs(rest);
    if (active === id) setActive(rest[Math.min(idx, rest.length - 1)]);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      style={{ paddingTop: "env(safe-area-inset-top,0px)" }}
    >
      {/* Pinned tab strip — always at the top of the screen, above the terminals */}
      <div className="flex items-stretch gap-1 bg-[#0a0a0a] border-b border-[#222] px-1.5 py-1.5 shrink-0">
        <div className="flex items-stretch gap-1 overflow-x-auto flex-1 min-w-0">
          {tabs.map((id, i) => (
            <div
              key={id}
              onClick={() => setActive(id)}
              className={`group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] cursor-pointer whitespace-nowrap select-none transition-colors ${
                active === id
                  ? "bg-[#243b52] text-[#8ac6ff]"
                  : "bg-[#161616] text-nv-text-secondary hover:text-nv-text-primary"
              }`}
            >
              <span>S{i + 1}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    close(id);
                  }}
                  aria-label="Close session"
                  className={`opacity-60 hover:text-nv-error ${active === id ? "" : "opacity-40"}`}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={add}
            disabled={tabs.length >= MAX_TABS}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] bg-[#161616] text-nv-teal hover:bg-[#1d2630] disabled:opacity-40 shrink-0"
          >
            <Plus size={14} /> Tab
          </button>
        </div>
        <button
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] bg-[#161616] text-nv-teal hover:bg-[#1d2630] shrink-0 ml-1"
        >
          <Maximize size={14} />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close terminal"
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] bg-[#161616] text-nv-text-secondary hover:text-nv-text-primary shrink-0 ml-1"
          >
            <Minimize2 size={14} /> Done
          </button>
        )}
      </div>

      {/* Terminals — stacked and kept mounted; only the active one is visible */}
      <div className="relative flex-1 min-h-0 bg-black">
        {tabs.map((id) => (
          <iframe
            key={id}
            src={url}
            title={`Rack terminal ${id}`}
            allow="clipboard-read; clipboard-write"
            className="absolute inset-0 w-full h-full border-0 bg-black"
            style={{
              visibility: active === id ? "visible" : "hidden",
              zIndex: active === id ? 1 : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
