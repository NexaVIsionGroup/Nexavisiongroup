"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Minimize2, Maximize2 } from "lucide-react";

// Tabbed rack terminal — Termux-style. Renders windowed (embedded in the device
// page) by default, with a button to expand to a full-screen overlay and back.
// Each tab is an independent ttyd connection (a fresh root shell on the rack) —
// `listc` a different Claude session per tab. Tabs stay mounted when you switch
// (visibility, not unmount) so their sessions + scrollback survive.
//
// Fullscreen renders through a portal to <body>: the admin page has framer-motion
// ancestors with CSS transforms, and a transformed ancestor traps `position: fixed`
// (anchors it to that box, not the viewport). The portal escapes the transform.
// NOTE: toggling windowed<->fullscreen reparents the iframes, which reloads them
// (the ttyd shell reconnects; the tmux/claude sessions survive — re-`listc`).
const MAX_TABS = 6;

export function RackTerminal({ url, onClose }: { url: string; onClose?: () => void }) {
  const [tabs, setTabs] = useState<number[]>([1]);
  const [active, setActive] = useState(1);
  const [next, setNext] = useState(2);
  const [full, setFull] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const body = (
    <>
      {/* Tab strip */}
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
          onClick={() => setFull((f) => !f)}
          aria-label={full ? "Windowed" : "Fullscreen"}
          title={full ? "Windowed" : "Fullscreen"}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] bg-[#161616] text-nv-teal hover:bg-[#1d2630] shrink-0 ml-1"
        >
          {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close terminal"
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] bg-[#161616] text-nv-text-secondary hover:text-nv-text-primary shrink-0 ml-1"
          >
            Close
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
    </>
  );

  // Fullscreen: portal to <body> so `position: fixed` escapes transformed ancestors.
  if (full) {
    if (!mounted) return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[200] flex flex-col bg-black"
        style={{ paddingTop: "env(safe-area-inset-top,0px)" }}
      >
        {body}
      </div>,
      document.body
    );
  }

  // Windowed: embedded in the page (not fixed, so no transform trap).
  return (
    <div className="flex flex-col h-[70vh] rounded-nv-md overflow-hidden bg-black border border-nv-teal/20">
      {body}
    </div>
  );
}
