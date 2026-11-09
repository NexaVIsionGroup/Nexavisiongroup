"use client";

import { ArrowRight, Check } from "lucide-react";
import { BUSINESS_NAME, CATCHPHRASE, MOTTO, defaultPackage, money, type PublicProposal } from "@/lib/proposals/types";
import { useOpenTracking } from "./signing";

/** One-screen version of a proposal for people who won't read the whole page. Price comes from the package. */
export function ShortSummary({ proposal: p, token, previewKey }: { proposal: PublicProposal; token: string; previewKey?: string }) {
  const preview = !!previewKey;
  useOpenTracking(preview, token, "short");
  const c = p.content;
  const s = c.summary!;
  const pkg = defaultPackage(c);
  const full = preview ? `/preview/${token}?k=${previewKey}` : `/project/${token}`;
  const company = p.client_company || p.client_name || "";

  const price: { value: string; label: string }[] = [];
  if (pkg) {
    if (pkg.price > 0) price.push({ value: money(pkg.price), label: `${(pkg.setupLabel || "Setup").toLowerCase()}, one time` });
    const first = pkg.ramp?.[0];
    if (first) price.push({ value: `${money(first.monthly)}/mo`, label: pkg.rampNote ? "until your numbers grow" :first.label.toLowerCase() });
    if (pkg.monthly > 0) price.push({ value: `${money(pkg.monthly)}/mo`, label: (pkg.monthlyLabel || (first ? "after that" : "monthly")).toLowerCase() });
    if (pkg.percent) price.push({ value: `+${pkg.percent.rate}%`, label: pkg.percent.of.split(".")[0] });
  }

  return (
    <main className="nxp-short">
      {c.hero?.image && <div className="nxp-short-bg" style={{ backgroundImage: `url(${c.hero.image})` }} aria-hidden />}
      <div className="nxp-short-in">
        <p className="nxp-short-brand"><strong>NexaVision</strong> Group<span> · {MOTTO}</span></p>
        <p className="nxp-short-for">The short version{company ? ` for ${company}` : ""}</p>
        <h1>{s.headline}</h1>
        {s.lead && <p className="nxp-short-lead">{s.lead}</p>}

        <section aria-label="Today">
          <h2>Today</h2>
          <div className="nxp-short-today">
            {s.today.map((t) => <div key={t.label}><b>{t.value}</b><span>{t.label}</span></div>)}
          </div>
        </section>

        <section aria-label="With us">
          <h2>With us</h2>
          <ul className="nxp-short-list">
            {s.changes.map((x) => <li key={x}><Check size={20} aria-hidden /><span>{x}</span></li>)}
          </ul>
        </section>

        {price.length > 0 && (
          <section aria-label="Cost" className="nxp-short-price">
            <h2>What it costs</h2>
            <div className="nxp-short-tiles">
              {price.map((t) => <div key={t.value + t.label}><b>{t.value}</b><span>{t.label}</span></div>)}
            </div>
          </section>
        )}

        {s.proof && <blockquote className="nxp-short-proof">{s.proof}</blockquote>}

        <div className="nxp-short-cta">
          {!p.signed_at && <a className="pr-btn pr-btn-gold" href={preview ? `/project/${token}/sign?k=${previewKey}` : `/project/${token}/sign`}>Sign and get started <ArrowRight size={20} /></a>}
          <a className="pr-btn pr-btn-ghost" href={full}>{p.signed_at ? "Open your agreement" : "Read the full proposal"}</a>
        </div>
        <p className="nxp-short-foot">{BUSINESS_NAME} · {CATCHPHRASE} · <a href="mailto:info@nexavisiongroup.com">info@nexavisiongroup.com</a></p>
      </div>
    </main>
  );
}
