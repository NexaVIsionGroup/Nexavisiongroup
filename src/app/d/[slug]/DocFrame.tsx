"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Printer } from "lucide-react";

// Full-viewport host for a shared client document. The document itself runs in
// a sandboxed iframe (no same-origin access), so this wrapper can safely carry
// the branded link preview, the password gate and a light toolbar.
export default function DocFrame({
  src,
  title,
  showToolbar = true,
}: {
  src: string;
  title: string;
  showToolbar?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [dim, setDim] = useState(false);

  // Fade the toolbar out while the reader is idle so it never fights the design.
  useEffect(() => {
    if (!showToolbar) return;
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setDim(false);
      clearTimeout(t);
      t = setTimeout(() => setDim(true), 4000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake);
    window.addEventListener("scroll", wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("scroll", wake);
    };
  }, [showToolbar]);

  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        ref={frame}
        src={src}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox"
      />

      {showToolbar && (
        <div
          className={
            "fixed bottom-4 right-4 z-10 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 px-1.5 py-1.5 shadow-lg transition-opacity duration-500 " +
            (dim ? "opacity-20 hover:opacity-100" : "opacity-100")
          }
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            onClick={() => frame.current?.contentWindow?.print()}
            title="Print / save as PDF"
            aria-label="Print or save as PDF"
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Printer size={16} />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            title="Open full screen"
            aria-label="Open full screen"
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Maximize2 size={16} />
          </a>
        </div>
      )}
    </div>
  );
}
