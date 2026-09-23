"use client";

import { motion } from "framer-motion";
import Title from "./Title";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Every Galaxy statement here is checkable: Samsung ships US Galaxy phones
// with locked bootloaders and removed unlocking worldwide in One UI 8;
// Galaxy S Ultras top out at 5,000 mAh, 45-60W wired, IP68, 120Hz.
const ROWS: [string, string, string][] = [
  ["Full bars, no internet", "Signal Engine moves you to a tower that's delivering", "Toggle airplane mode and hope"],
  ["Exact tower", "Lock to the one tower you choose", "Whatever tower the network hands you"],
  ["Exact frequency", "Lock to the band and channel you choose", "Band settings at best, if any"],
  ["Access", "Full system access, built in", "Locked by Samsung, can't be opened"],
  ["Network control", "Rules per app, per connection, system-wide", "Basic data on and off"],
  ["Out of the box", "Nothing you didn't ask for", "Samsung and carrier apps preloaded"],
  ["Updates", "Only when you approve them", "Pushed by Samsung and your carrier"],
  ["Battery", "Up to 7,500 mAh", "5,000 mAh"],
  ["Fastest charging", "Up to 100W wired, 80W wireless", "Up to 60W wired, 25W wireless"],
  ["Toughest rating", "IP69K, survives hot high-pressure washdown", "IP68"],
  ["Screen speed", "Up to 165Hz", "120Hz"],
  ["Who sets it up", "Programmed, tested and backed by our shop", "A carrier store"],
];

const CAPS = [
  {
    title: "We build them",
    body: "Every phone is opened up, flashed with our in-house Nexa Pro build and tuned for signal before it ships.",
  },
  {
    title: "We program them",
    body: "Your apps, your tower profiles, your lockdown rules and network policies, loaded before it reaches your crew.",
  },
  {
    title: "We back them",
    body: "Our techs repair, reprogram and swap phones in-house. Add Nexa Care for two years of priority coverage.",
  },
];

export default function WhyNexa() {
  return (
    <section className="np-section" id="why" style={{ paddingTop: 0 }}>
      <div className="np-wrap">
        <Title text="Why not just buy a Galaxy?" style={{ maxWidth: "10em" }} />
        <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
          A Galaxy Ultra is a great phone, built for everyone, and Samsung keeps it locked. You can&apos;t choose its
          tower, you can&apos;t lock its frequency, and you can&apos;t change how its radio behaves. That control is the
          whole point of a Nexa Pro, and it&apos;s why our customers buy them.
        </p>

        <div className="np-why-table">
          <div className="np-why-cols">
            <span>Nexa Pro</span>
            <span>Galaxy S Ultra</span>
          </div>
          {ROWS.map(([label, us, them], i) => (
            <motion.div
              key={label}
              className="np-why-row"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.04, ease: EASE }}
            >
              <div>
                <small>{label}</small>
                <b>{us}</b>
              </div>
              <div>
                <small>{label}</small>
                <b>{them}</b>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="np-shop-caps">
          {CAPS.map((c) => (
            <div key={c.title} className="np-shop-cap">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
        <p className="np-footnote">
          Nexa figures are the best across the lineup; each phone&apos;s page shows its own. Galaxy figures are US launch
          specs for the S22 through S26 Ultra.
        </p>
      </div>
    </section>
  );
}
