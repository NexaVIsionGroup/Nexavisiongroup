"use client";

import Title from "./Title";
import { t } from "./theme";
import { CONTACT_PHONE, CONTACT_TEL } from "./data";

// The questions people ask before they call. Keep answers to what the rest of
// the site already promises; anything model-specific lives on the device page.
const QA: [string, string][] = [
  [
    "Will it work on my carrier?",
    "Yes. Every Nexa Pro runs on T-Mobile, AT&T and Verizon with a physical SIM. Bring the SIM from your current phone or ask us to source a plan. A few models have carrier notes on their page.",
  ],
  [
    "What happens if the tower I'm locked to goes down?",
    "It tells you, instead of silently hopping to a worse one. Moving to the next best tower is a one-minute profile change you can make yourself, or call us and we'll pick it with you from the survey.",
  ],
  [
    "Can I move it to another site?",
    t(
      "Yes. Tower profiles are per site, not per phone. Set a new profile yourself in about a minute, or send us the address and we'll build it. Once a phone is out, it stays out.",
      "Yes. Tower profiles are per site, not per phone. Set a new profile yourself in about a minute, or send us the address and we'll build it."
    ),
  ],
  [
    "Do I need an IT person to set it up?",
    "No. Each phone arrives configured for the site you tell us about, with your apps and rules loaded. Unbox, sign in, go to work. Fleet setup is a $25 add-on per phone if you want us to load everything.",
  ],
  [
    "What condition are the phones in?",
    "Like new. Every unit is inspected, battery-checked and tested in our shop before it ships. If a phone isn't good enough for our own crew, we don't sell it.",
  ],
  [
    "What about warranty and repairs?",
    "Our techs repair, reprogram and swap Nexa Pro phones in-house, so you're never routed to a carrier store. Add Nexa Care for two years of priority coverage and swaps.",
  ],
  [
    "How do I pay?",
    "Place the order here and you go straight to a secure payment page. Sales tax is 6%, shipping is free and insured, and we confirm stock before anything ships. Fleet orders of five or more can be quoted and invoiced.",
  ],
];

export default function Faq() {
  return (
    <section className="np-section np-faq" id="faq">
      <div className="np-wrap">
        <Title text="Questions, answered." style={{ maxWidth: "9em" }} />
        <div className="np-faq-list">
          {QA.map(([q, a]) => (
            <details key={q} className="np-faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <p className="np-faq-more">
          Something else? Call or text <a href={`tel:${CONTACT_TEL}`}>{CONTACT_PHONE}</a>. A tech answers, not a script.
        </p>
      </div>
    </section>
  );
}
