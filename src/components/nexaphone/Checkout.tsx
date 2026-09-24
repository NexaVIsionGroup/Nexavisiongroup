"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { money, productBySlug } from "./catalog";
import { unitPrice, useCart } from "./cart";
import Scramble from "./Scramble";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Field({
  label,
  name,
  type = "text",
  auto,
  required = true,
  half = false,
}: {
  label: string;
  name: string;
  type?: string;
  auto?: string;
  required?: boolean;
  half?: boolean;
}) {
  return (
    <label className="np-field" data-half={half}>
      <input name={name} type={type} autoComplete={auto} required={required} placeholder=" " />
      <span>
        {label}
        {!required && <em> (optional)</em>}
      </span>
    </label>
  );
}

export default function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/nexaphone/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: g("name"), email: g("email"), phone: g("phone"), company: g("company") },
          address: { line1: g("line1"), line2: g("line2"), city: g("city"), state: g("state"), zip: g("zip") },
          notes: g("notes"),
          website: g("website"),
          items: lines.map(({ slug, ram, storage, color, addons, qty }) => ({ slug, ram, storage, color, addons, qty })),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      try {
        navigator.vibrate?.([20, 60, 40]);
      } catch {
        /* no haptics */
      }
      clear();
      setDone(j.orderNumber);
      if (j.payUrl) {
        setPayUrl(j.payUrl);
        setTimeout(() => window.location.assign(j.payUrl), 2500);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <section className="np-checkout np-done">
        <div className="np-wrap">
          <motion.div className="np-done-ring" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
            <Check size={44} />
          </motion.div>
          <h1 className="np-display np-h2">Order locked in.</h1>
          <p className="np-done-num np-num">
            <Scramble text={done} speed={30} />
          </p>
          {payUrl ? (
            <>
              <p className="np-lede">Taking you to secure checkout to pay for your order…</p>
              <a href={payUrl} className="np-btn np-btn-lock np-shine" style={{ marginTop: 20 }}>
                Pay securely now
              </a>
            </>
          ) : (
            <>
              <p className="np-lede">
                We&apos;re reserving your phones now. Within one business day you&apos;ll get a secure payment link by
                email, with tax calculated for your address. Nothing is charged until you pay that link.
              </p>
              <Link href="/nexaphone" className="np-btn np-btn-ghost" style={{ marginTop: 28 }}>
                Back to Nexa Pro
              </Link>
            </>
          )}
        </div>
      </section>
    );

  return (
    <section className="np-checkout">
      <div className="np-wrap">
        <Link href="/nexaphone#shop" className="np-back">
          <ArrowLeft size={18} /> Keep shopping
        </Link>
        <h1 className="np-display np-h2" style={{ margin: "18px 0 26px" }}>
          Checkout
        </h1>

        {lines.length === 0 ? (
          <div className="np-panel-dark">
            <p>Your cart is empty.</p>
            <Link href="/nexaphone#shop" className="np-btn np-btn-lock" style={{ marginTop: 16 }}>
              See the lineup
            </Link>
          </div>
        ) : (
          <div className="np-checkout-grid">
            <aside className="np-panel-dark np-summary">
              <h2>Your order</h2>
              <ul>
                {lines.map((l) => {
                  const p = productBySlug(l.slug)!;
                  return (
                    <li key={l.key}>
                      <span className="np-cart-swatch" style={{ background: p.colors.find((c) => c.name === l.color)?.hex }} />
                      <div>
                        <strong>
                          {p.name} × {l.qty}
                        </strong>
                        <small>
                          {l.ram}GB / {l.storage}, {l.color}
                        </small>
                      </div>
                      <b className="np-num">{money(unitPrice(l) * l.qty)}</b>
                    </li>
                  );
                })}
              </ul>
              <div className="np-sum-row">
                <span>Subtotal</span>
                <b className="np-num">{money(subtotal)}</b>
              </div>
              <div className="np-sum-row">
                <span>Shipping</span>
                <b>Free, insured</b>
              </div>
              <div className="np-sum-row">
                <span>Tax</span>
                <b>On your payment link</b>
              </div>
            </aside>

            <form className="np-form" onSubmit={submit}>
              <fieldset>
                <legend>Contact</legend>
                <Field label="Full name" name="name" auto="name" />
                <Field label="Email" name="email" type="email" auto="email" />
                <Field label="Phone" name="phone" type="tel" auto="tel" required={false} half />
                <Field label="Company" name="company" auto="organization" required={false} half />
              </fieldset>
              <fieldset>
                <legend>Ship to</legend>
                <Field label="Street address" name="line1" auto="address-line1" />
                <Field label="Apt, suite, unit" name="line2" auto="address-line2" required={false} />
                <Field label="City" name="city" auto="address-level2" />
                <Field label="State" name="state" auto="address-level1" half />
                <Field label="ZIP" name="zip" auto="postal-code" half />
              </fieldset>
              <fieldset>
                <legend>Anything we should know?</legend>
                <label className="np-field">
                  <textarea name="notes" rows={3} placeholder=" " />
                  <span>
                    Notes <em>(optional)</em>
                  </span>
                </label>
              </fieldset>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="np-hp" aria-hidden />

              <AnimatePresence>
                {err && (
                  <motion.p className="np-err" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {err}
                  </motion.p>
                )}
              </AnimatePresence>

              <button className="np-btn np-btn-lock np-shine np-submit" disabled={busy}>
                {busy ? "Placing order…" : `Place order, ${money(subtotal)}`}
              </button>
              <motion.p className="np-footnote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, ease: EASE }}>
                You won&apos;t be charged yet. We confirm stock, then email a secure payment link with tax for your
                address.
              </motion.p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
