"use client";

// Signing state shared by the plain and the chaptered proposal layouts.

import { useEffect, useMemo, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { defaultPackage, dueAtSigning, surchargeOn, type PublicProposal } from "@/lib/proposals/types";

export function SignaturePad({ onChange, ink = "#10211f", className = "nxp-pad", clearClass = "nxp-clear" }: {
  onChange: (png: string | null) => void; ink?: string; className?: string; clearClass?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inked = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = c.getBoundingClientRect();
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [ink]);

  const at = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div>
      <canvas
        ref={ref}
        className={className}
        aria-label="Signature box. Draw your signature here."
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drawing.current = true;
          const ctx = ref.current!.getContext("2d")!;
          const { x, y } = at(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const { x, y } = at(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          inked.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (inked.current) onChange(ref.current!.toDataURL("image/png"));
        }}
      />
      <button
        type="button"
        className={clearClass}
        onClick={() => {
          const c = ref.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          inked.current = false;
          onChange(null);
        }}
      >
        <Eraser size={16} aria-hidden /> Clear signature
      </button>
    </div>
  );
}

/** Counts the open and the time on page from the browser, so link previews and mail scanners don't look like the customer. */
export function useOpenTracking(preview: boolean, token: string, from?: string) {
  useEffect(() => {
    if (preview) return;
    const url = `/api/project/${token}/event`;
    fetch(url, { method: "POST", body: JSON.stringify({ type: "open", from }), keepalive: true }).catch(() => {});
    const began = Date.now();
    const leave = () => {
      const seconds = Math.round((Date.now() - began) / 1000);
      if (seconds > 2) navigator.sendBeacon?.(url, JSON.stringify({ type: "time", seconds }));
    };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [preview, token, from]);
}

export function useSigning(p: PublicProposal, token: string, preview: boolean) {
  const c = p.content;
  const signed = !!p.signed_at;
  const offerAutopay = !!c.payment.autopay?.offer;
  const [pkgId, setPkgId] = useState<string | null>(p.selected_package_id || defaultPackage(c)?.id || null);
  const [name, setName] = useState(p.client_name || "");
  const [title, setTitle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [autopay, setAutopay] = useState<boolean | null>(offerAutopay && c.payment.autopay?.recommended ? true : null);
  const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pkg = useMemo(() => c.packages.find((x) => x.id === pkgId) || null, [c.packages, pkgId]);
  const due = signed ? Number(p.due_amount) || 0 : dueAtSigning(c, pkg);
  const fee = surchargeOn(c, due);

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (preview) return setErr("This is your preview, so signing is turned off.");
    if (c.packages.length && !pkg) return setErr("Choose a package first.");
    if (name.trim().length < 2) return setErr("Type your full name.");
    if (!sig) return setErr("Draw your signature in the box.");
    if (offerAutopay && autopay === null) return setErr("Choose how you'd like to pay your monthly invoices.");
    if (!agreed) return setErr("Check the box to agree to the terms.");
    setBusy(true);
    try {
      const r = await fetch(`/api/project/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, agreed, signature_data: sig, package_id: pkg?.id, version: p.updated_at, autopay: offerAutopay ? autopay === true : undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j.error || "We could not save your signature. Please try again.");
        setBusy(false);
        return;
      }
      window.location.assign(`/project/${token}`);
    } catch {
      setErr("Your connection dropped before we could save this. Check your connection and try again.");
      setBusy(false);
    }
  }

  return { signed, offerAutopay, pkgId, setPkgId, pkg, due, fee, name, setName, title, setTitle, agreed, setAgreed, autopay, setAutopay, sig, setSig, busy, err, sign };
}
