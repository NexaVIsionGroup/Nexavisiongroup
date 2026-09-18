"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

// Tabbed rack terminal — Termux-style. Each tab is an independent ttyd connection
// (a fresh root shell on the rack), so you can `listc` into a different Claude
// session per tab and have several live at once. Tabs stay mounted when you switch
// (visibility, not unmount) so their sessions and scrollback survive.
const MAX_TABS = 6;

export function RackTerminal({ url }: { url: string }) {
  const [tabs, setTabs] = useState<number[]>([1]);
  const [active, setActive] = useState(1);
  const [next, setNext] = useState(2);

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
    <div className="rounded-nv-md overflow-hidden bg-black border border-nv-teal/20">
      <div className="flex items-stretch gap-1 bg-[#0a0a0a] border-b border-[#222] px-1.5 py-1.5 overflow-x-auto">
        {tabs.map((id, i) => (
          <div
            key={id}
            onClick={() => setActive(id)}
            className={`group flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] cursor-pointer whitespace-nowrap select-none transition-colors ${
              active === id
                ? "bg-[#243b52] text-[#8ac6ff]"
                : "bg-[#161616] text-nv-text-secondary hover:text-nv-text-primary"
            }`}
          >
            <span>Session {i + 1}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  close(id);
                }}
                aria-label="Close session"
                className="opacity-50 group-hover:opacity-100 hover:text-nv-error"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={add}
          disabled={tabs.length >= MAX_TABS}
          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] bg-[#161616] text-nv-teal hover:bg-[#1d2630] disabled:opacity-40"
        >
          <Plus size={13} /> Tab
        </button>
      </div>

      <div className="relative w-full h-[70vh] bg-black">
        {tabs.map((id) => (
          <iframe
            key={id}
            src={url}
            title={`Rack terminal ${id}`}
            allow="fullscreen; clipboard-read; clipboard-write"
            allowFullScreen
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
