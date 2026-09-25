"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Truck } from "lucide-react";
import { money, productBySlug } from "./catalog";
import { unitPrice, useCart } from "./cart";
import Scramble from "./Scramble";

// Mirrors NEXA_TAX_RATE on the JHPS side (percent of the merchandise; shipping is untaxed).
const TAX_RATE = 6;

const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

type ShipOption = { id: string; carrier: string; service: string; days: number | null; amount: number };
type Ship =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; options: ShipOption[]; token: string; key: string };

const eta = (d: number | null) => (d == null ? "" : d <= 1 ? "Next business day" : `${d} business days`);
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Field({
  label,
  name,
  type = "text",
  auto,
  required = true,
  half = false,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  auto?: string;
  required?: boolean;
  half?: boolean;
  inputMode?: "numeric" | "tel" | "email" | "text";
}) {
  return (
    <label className="np-field" data-half={half}>
      <input name={name} type={type} autoComplete={auto} required={required} placeholder=" " inputMode={inputMode} />
      <span>
        {label}
        {!required && <em> (optional)</em>}
      </span>
    </label>
  );
}

export default function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const phones = lines.reduce((n, l) => n + l.qty, 0);
  const [ship, setShip] = useState<Ship>({ status: "idle" });
  const [pick, setPick] = useState<string>("");
  const chosen = ship.status === "ready" ? ship.options.find((o) => o.id === pick) : undefined;
  const shipping = chosen?.amount ?? 0;
  const tax = Math.round(subtotal * TAX_RATE) / 100;
  const total = subtotal + shipping + tax;
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const asked = useRef("");

  // Live rates: as soon as the address has a ZIP and a state, and again if the phone count changes.
  const quote = useCallback(
    async (force = false) => {
      const f = form.current;
      if (!f || phones < 1) return;
      const g = (k: string) => String(new FormData(f).get(k) ?? "").trim();
      const zip = g("zip").slice(0, 5);
      const state = g("state");
      if (!/^\d{5}$/.test(zip) || !/^[A-Z]{2}$/.test(state)) return;
      const key = `${zip}|${state}|${phones}`;
      if (!force && key === asked.current) return;
      asked.current = key;
      setShip({ status: "loading" });
      try {
        const r = await fetch("/api/nexaphone/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zip, state, city: g("city"), street: g("line1"), phones }),
        });
        const j = await r.json();
        if (asked.current !== key) return; // a newer request is in flight
        if (!r.ok || !j.options?.length) throw new Error(j.error || "We couldn't get shipping rates for that address.");
        setShip({ status: "ready", options: j.options, token: j.token, key });
        setPick((cur) => (j.options.some((o: ShipOption) => o.id === cur) ? cur : j.options[0].id));
      } catch (x) {
        if (asked.current !== key) return;
        asked.current = "";
        setShip({ status: "error", message: x instanceof Error ? x.message : "We couldn't get shipping rates." });
      }
    },
    [phones]
  );
  const onAddress = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => quote(), 450);
  };
  useEffect(() => {
    if (asked.current) quote(true);
  }, [phones, quote]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chosen) {
      setErr("Enter your ZIP and state, then pick a shipping option.");
      return;
    }
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
          shipping: ship.status === "ready" ? { token: ship.token, option: pick } : undefined,
          website: g("website"),
          items: lines.map(({ slug, ram, storage, color, addons, qty }) => ({ slug, ram, storage, color, addons, qty })),
        }),
      });
      const j = await r.json();
      if (r.status === 409) quote(true); // quote expired or address changed: fetch fresh rates
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
                email, with shipping and tax included. Nothing is charged until you pay that link.
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
                <span>Shipping{chosen ? `, ${chosen.carrier} ${chosen.service}` : ""}</span>
                <b className="np-num">{chosen ? money(shipping) : "Enter address"}</b>
              </div>
              <div className="np-sum-row">
                <span>Sales tax ({TAX_RATE}%)</span>
                <b className="np-num">{money(tax)}</b>
              </div>
              <div className="np-sum-row np-sum-total">
                <span>Total</span>
                <b className="np-num">{money(total)}</b>
              </div>
            </aside>

            <form className="np-form" onSubmit={submit} ref={form} onChange={onAddress}>
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
                <label className="np-field np-field-select" data-half="true">
                  <select name="state" autoComplete="address-level1" required defaultValue="">
                    <option value="" disabled>
                      Select
                    </option>
                    {STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <span>State</span>
                </label>
                <Field label="ZIP" name="zip" auto="postal-code" half inputMode="numeric" />
              </fieldset>
              <fieldset className="np-ship" aria-live="polite">
                <legend>Shipping</legend>
                {ship.status === "idle" && (
                  <p className="np-ship-note">
                    <Truck size={18} /> Enter your ZIP and state to see live carrier rates.
                  </p>
                )}
                {ship.status === "loading" && (
                  <p className="np-ship-note">
                    <Loader2 size={18} className="np-db-spin" /> Checking carrier rates for your address…
                  </p>
                )}
                {ship.status === "error" && (
                  <p className="np-ship-note" data-error="true">
                    {ship.message}{" "}
                    <button type="button" onClick={() => quote(true)}>
                      Try again
                    </button>
                  </p>
                )}
                {ship.status === "ready" &&
                  ship.options.map((o) => (
                    <label key={o.id} className="np-ship-opt" data-on={pick === o.id}>
                      <input type="radio" name="ship" value={o.id} checked={pick === o.id} onChange={() => setPick(o.id)} />
                      <span className="np-ship-name">
                        <b>
                          {o.carrier} {o.service}
                        </b>
                        <small>{eta(o.days)}</small>
                      </span>
                      <b className="np-num">{money(o.amount)}</b>
                    </label>
                  ))}
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

              <button className="np-btn np-btn-lock np-shine np-submit" disabled={busy || !chosen}>
                {busy ? "Placing order…" : chosen ? `Continue to payment, ${money(total)}` : "Pick shipping to continue"}
              </button>
              <motion.p className="np-footnote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, ease: EASE }}>
                Next step is secure payment{chosen ? ` for ${money(total)}, shipping and tax included` : ""}. Every phone is
                covered by our shop warranty, and we confirm stock before anything ships.
              </motion.p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
