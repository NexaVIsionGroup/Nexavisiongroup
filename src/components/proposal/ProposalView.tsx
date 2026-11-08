"use client";

import { Check, Download, Loader2, Lock, Target, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { BUSINESS_NAME, money, type PublicProposal } from "@/lib/proposals/types";
import { SignaturePad, useOpenTracking, useSigning } from "./signing";

// Fixed time zone so the server and the customer's browser print the same date (no hydration mismatch).
const longDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
const stamp = (d: string) => new Date(d).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/New_York" }) + " ET";

/** Plain, static proposal page. Proposals with rich sections render through RichProposal instead. */
export function ProposalView({ proposal: p, token, preview = false, share = false, payError = false, from }: {
  proposal: PublicProposal; token: string; preview?: boolean; share?: boolean; payError?: boolean; from?: string;
}) {
  const c = p.content;
  const s = useSigning(p, token, preview);
  useOpenTracking(preview, token, from);
  const { signed, pkg, pkgId, due, fee } = s;

  const who = p.client_company || p.client_name;
  const selected = signed ? pkg : null;

  return (
    <div className="nxp-page">
      <header className="nxp-hero">
        <div className="nxp-wrap nxp-hero-in">
          <div className="nxp-brand"><Logo uid="prop" /></div>
          <p className="nxp-kind">{signed ? "Signed agreement" : "Proposal"} {p.number}</p>
          <h1>{p.title}</h1>
          <p className="nxp-for">
            {who && <>Prepared for <b>{who}</b></>}
            {p.sent_at && <> on {longDate(p.sent_at)}</>}
          </p>
          {!signed && p.expires_at && <p className="nxp-for">Good through {longDate(p.expires_at)}</p>}
        </div>
      </header>

      <main className="nxp-wrap nxp-main">
        {preview && <p className="nxp-note nxp-note-sun"><TriangleAlert size={18} aria-hidden />{share ? "This is a preview copy for review. Signing is turned off here; the link to sign arrives by email." : "You're previewing this as the customer will see it. Views here aren't counted, and signing is off."}</p>}

        {signed && (
          <section className="nxp-done" aria-label="Signing status">
            <h2><Check size={24} aria-hidden /> You&apos;re signed</h2>
            <p>{p.signed_name} signed this on {stamp(p.signed_at!)}. A signed copy went to {p.client_email || "your email"}.</p>
            {payError && <p className="nxp-error" role="alert">We couldn&apos;t open the payment page just now. Try again in a minute, or reply to your signed-copy email.</p>}
            <div className="nxp-actions">
              {due > 0 && !p.paid_at && !preview && <a className="nxp-btn" href={`/project/${token}/${p.autopay_opt_in ? "card" : "pay"}`}>{p.autopay_opt_in ? `Pay ${money(due + fee)} and save your card` : `Pay ${money(due + fee)}`}</a>}
              {p.autopay_opt_in && (!(due > 0) || p.paid_at) && !preview && <a className="nxp-btn nxp-btn-ghost" href={`/project/${token}/card`}>Save or update your card</a>}
              <a className="nxp-btn nxp-btn-ghost" href={`/api/project/${token}/pdf`}><Download size={18} aria-hidden /> Download signed copy</a>
            </div>
            {due > 0 && p.paid_at && <p className="nxp-paid"><Check size={18} aria-hidden /> Payment received on {longDate(p.paid_at)}. Thank you.</p>}
          </section>
        )}

        {!!c.intro && <p className="nxp-intro">{c.intro}</p>}

        {c.findings.length > 0 && (
          <section>
            <h2>What we found</h2>
            <div className="nxp-findings">
              {c.findings.map((f, i) => (
                <article key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.image && <img src={f.image} alt="" loading="lazy" />}
                  <h3>{f.title}</h3>
                  {f.detail && <p>{f.detail}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {c.goals.length > 0 && (
          <section>
            <h2>Your goals</h2>
            <ul className="nxp-goals">{c.goals.map((g, i) => <li key={i}><Target size={20} aria-hidden /><span>{g}</span></li>)}</ul>
          </section>
        )}

        {c.work.length > 0 && (
          <section>
            <h2>What we&apos;ll do</h2>
            <div className="nxp-work">
              {c.work.map((w, i) => (
                <article key={i}>
                  <h3>{w.area}</h3>
                  {w.detail && <p>{w.detail}</p>}
                  {w.items.length > 0 && <ul>{w.items.map((it, n) => <li key={n}>{it}</li>)}</ul>}
                </article>
              ))}
            </div>
          </section>
        )}

        {c.timeline.length > 0 && (
          <section>
            <h2>Timeline</h2>
            <ol className="nxp-time">{c.timeline.map((t, i) => <li key={i}><b>{t.label}</b><span>{t.when}</span></li>)}</ol>
          </section>
        )}

        {c.packages.length > 0 && (
          <section>
            <h2>{signed ? "What you chose" : c.packages.length > 1 ? "Choose your package" : "Your investment"}</h2>
            <div className="nxp-pkgs" role={!signed && c.packages.length > 1 ? "radiogroup" : undefined} aria-label="Packages">
              {(selected ? [selected] : c.packages).map((x) => {
                const on = x.id === pkgId;
                const body = (
                  <>
                    <span className="nxp-pkg-head">
                      <b>{x.name}</b>
                      {x.recommended && !signed && c.packages.length > 1 && <em>Our recommendation</em>}
                    </span>
                    <span className="nxp-price">
                      {Number(x.price) > 0 && <strong>{money(x.price)}</strong>}
                      {Number(x.price) > 0 && Number(x.monthly) > 0 && <i>plus</i>}
                      {Number(x.monthly) > 0 && <strong>{money(x.monthly)}<small>/month</small></strong>}
                    </span>
                    {x.description && <span className="nxp-pkg-text">{x.description}</span>}
                    {x.includes.length > 0 && <span className="nxp-inc">{x.includes.map((it, n) => <span key={n}><Check size={16} aria-hidden />{it}</span>)}</span>}
                  </>
                );
                return signed || c.packages.length === 1
                  ? <div key={x.id} className="nxp-pkg is-on">{body}</div>
                  : <button key={x.id} type="button" role="radio" aria-checked={on} className={`nxp-pkg${on ? " is-on" : ""}`} onClick={() => s.setPkgId(x.id)}>{body}</button>;
              })}
            </div>
          </section>
        )}

        {(due > 0 || c.payment.notes) && (
          <section>
            <h2>Payment</h2>
            {due > 0 && (
              <dl className="nxp-due">
                <div><dt>Due at signing</dt><dd>{money(due)}</dd></div>
                {fee > 0 && <div><dt>4% card fee</dt><dd>{money(fee)}</dd></div>}
                {fee > 0 && <div className="is-total"><dt>Total at signing</dt><dd>{money(due + fee)}</dd></div>}
              </dl>
            )}
            {c.payment.notes && <p className="nxp-pay-note">{c.payment.notes}</p>}
          </section>
        )}

        <section>
          <h2>Terms</h2>
          <div className="nxp-terms">
            {c.terms.map((t, i) => <div key={i}><h3>{t.title}</h3><p>{t.text}</p></div>)}
          </div>
        </section>

        {signed ? (
          <section aria-label="Signature">
            <h2>Signature</h2>
            <div className="nxp-signed">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.signature_data && <img src={p.signature_data} alt={`Signature of ${p.signed_name}`} />}
              <p><b>{p.signed_name}</b>{p.signed_title ? `, ${p.signed_title}` : ""}</p>
              <p className="nxp-fine">Signed {stamp(p.signed_at!)}. Locked version fingerprint: {p.signed_hash?.slice(0, 16)}</p>
            </div>
          </section>
        ) : (
          <section>
            <h2>Agree and sign</h2>
            <form className="nxp-sign" onSubmit={s.sign} noValidate>
              <div className="nxp-fields">
                <label>Your full name<input id="sign-name" value={s.name} onChange={(e) => s.setName(e.target.value)} autoComplete="name" required /></label>
                <label>Your title (optional)<input id="sign-title" value={s.title} onChange={(e) => s.setTitle(e.target.value)} autoComplete="organization-title" /></label>
              </div>
              <div>
                <p className="nxp-label">Draw your signature</p>
                <SignaturePad onChange={s.setSig} />
              </div>
              {s.offerAutopay && (
                <fieldset className="nxp-autopay">
                  <legend>{c.payment.autopay?.title || "Automatic monthly billing"}</legend>
                  {c.payment.autopay?.text && <p>{c.payment.autopay.text}</p>}
                  <label><input type="radio" name="autopay" checked={s.autopay === true} onChange={() => s.setAutopay(true)} /> Yes, bill my card automatically each month{c.payment.autopay?.recommended ? " (recommended)" : ""}</label>
                  <label><input type="radio" name="autopay" checked={s.autopay === false} onChange={() => s.setAutopay(false)} /> I&apos;ll pay each monthly invoice myself</label>
                </fieldset>
              )}
              <label className="nxp-agree">
                <input id="sign-agree" type="checkbox" checked={s.agreed} onChange={(e) => s.setAgreed(e.target.checked)} />
                <span>I have read this proposal and its terms, I can sign for {p.client_company || "this business"}, and I agree to sign electronically with {BUSINESS_NAME}.</span>
              </label>
              {s.err && <p className="nxp-error" role="alert">{s.err}</p>}
              <button className="nxp-btn nxp-btn-big" type="submit" disabled={s.busy}>
                {s.busy ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <Lock size={18} aria-hidden />}
                {s.busy ? "Saving your signature" : due > 0 ? "Sign and continue to payment" : s.autopay === true ? "Sign and continue to your card" : "Sign proposal"}
              </button>
            </form>
          </section>
        )}
      </main>

      <footer className="nxp-foot">
        <div className="nxp-wrap">
          <p><b>{BUSINESS_NAME}</b></p>
          <p>Questions? Email <a href="mailto:info@nexavisiongroup.com">info@nexavisiongroup.com</a></p>
        </div>
      </footer>
    </div>
  );
}
