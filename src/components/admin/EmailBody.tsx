"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Renders an HTML email inside a sandboxed iframe (no scripts, no forms):
 *  - the email's own CSS can no longer restyle the app around it;
 *  - links open in a new tab (<base target="_blank">);
 *  - images shrink to the screen, and fixed-width layouts (the classic 600 px newsletter table) are zoomed
 *    to fit the phone instead of forcing sideways scrolling;
 *  - in dark mode the email is colour-inverted, with images inverted back, unless `original` is set.
 * The iframe grows to the email's height, so the conversation scrolls as one page.
 */
type Props = { html: string; dark: boolean; original?: boolean; className?: string };

const BASE_CSS = `
html,body{margin:0;padding:0;min-height:0}
html{overflow-x:hidden}
body{padding:14px 14px 12px;font:15px/1.55 -apple-system,BlinkMacSystemFont,Roboto,"Segoe UI",Helvetica,Arial,sans-serif;overflow-wrap:anywhere;word-break:break-word;-webkit-text-size-adjust:100%}
img,video,svg{max-width:100%!important;height:auto!important}
table{max-width:100%!important;height:auto!important}
td,th{word-break:break-word}
pre{white-space:pre-wrap!important}
blockquote{margin:8px 0;padding-left:10px;border-left:3px solid rgba(128,128,128,.35)}
a{color:#0f8f82}
`;
const LIGHT_CSS = `:root{color-scheme:light}body{background:#ffffff;color:#1f2a3a}`;
const DARK_INVERT_CSS = `:root{color-scheme:light}body{background:#e9ecf1;color:#1f2a3a}
html{filter:invert(1) hue-rotate(180deg)}
img,video,picture,canvas,svg,[style*="background-image"],[background]{filter:invert(1) hue-rotate(180deg)}`;

function buildDoc(html: string, css: string) {
  const safe = (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<base[^>]*>/gi, "")
    .replace(/<meta[^>]+viewport[^>]*>/gi, "");
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">`;
  // our stylesheet goes LAST so it wins over the email's own <style> blocks
  const tail = `<style>${BASE_CSS}${css}</style>`;
  if (/<head[\s>]/i.test(safe)) return safe.replace(/<head([^>]*)>/i, `<head$1>${head}`) + tail;
  if (/<html[\s>]/i.test(safe)) return safe.replace(/<html([^>]*)>/i, `<html$1><head>${head}</head>`) + tail;
  return `<!doctype html><html><head>${head}</head><body>${safe}</body></html>${tail}`;
}

export default function EmailBody({ html, dark, original, className }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(140);
  const doc = useMemo(() => buildDoc(html, dark && !original ? DARK_INVERT_CSS : LIGHT_CSS), [html, dark, original]);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let stopped = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const fit = () => {
      if (stopped) return;
      try {
        const d = frame.contentDocument;
        if (!d?.body || !d.documentElement) return;
        const body = d.body as HTMLElement & { style: CSSStyleDeclaration & { zoom?: string } };
        body.style.zoom = "1";
        d.documentElement.style.overflowX = "hidden";
        const cw = frame.clientWidth;
        const sw = Math.max(d.documentElement.scrollWidth, body.scrollWidth);
        if (cw && sw > cw + 2) {
          const z = cw / sw;
          if (z >= 0.55) body.style.zoom = String(z);          // zoom the layout to the phone's width
          else d.documentElement.style.overflowX = "auto";     // absurdly wide: scroll inside the email only
        }
        const sh = Math.max(d.documentElement.scrollHeight, body.scrollHeight);
        if (sh) setHeight(Math.ceil(sh) + 4);
      } catch { /* cross-origin guard; never happens with srcdoc */ }
    };
    // The iframe's load event waits for every image in the email (slow newsletters), so don't depend on it:
    // measure right away and keep re-measuring while content arrives, plus watch the email's own body size.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fit()) : null;
    ro?.observe(frame);
    let innerObserved = false;
    const watchInner = () => {
      if (innerObserved || !ro) return;
      try { const b = frame.contentDocument?.body; if (b) { ro.observe(b); innerObserved = true; } } catch { /* ignore */ }
    };
    const tick = () => { watchInner(); fit(); };
    const onLoad = () => { tick(); [100, 400, 1000, 2500, 5000].forEach((ms) => timers.push(setTimeout(tick, ms))); };
    frame.addEventListener("load", onLoad);
    [0, 50, 150, 300, 600, 1000, 1500, 2200, 3000, 4500, 6000, 9000].forEach((ms) => timers.push(setTimeout(tick, ms)));
    return () => { stopped = true; frame.removeEventListener("load", onLoad); ro?.disconnect(); timers.forEach(clearTimeout); };
  }, [doc]);

  return (
    <iframe
      ref={ref}
      title="Email"
      srcDoc={doc}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      scrolling="no"
      className={className || "block w-full border-0"}
      style={{ height, colorScheme: dark && !original ? "dark" : "light" }}
    />
  );
}
