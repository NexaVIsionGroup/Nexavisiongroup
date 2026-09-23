"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { places } from "./data";

export default function Places() {
  const rail = useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".np-place");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 14), behavior: "smooth" });
  };

  return (
    <section className="np-section" id="where">
      <div className="np-wrap">
        <h2 className="np-display np-h2" style={{ maxWidth: "10em" }}>
          Built for the places signal goes to die.
        </h2>
        <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
          Metal, concrete, crowds and distance all push ordinary phones onto weak connections. Nexa Pro is
          made for exactly those spots.
        </p>
        <div className="np-rail" ref={rail}>
          {places.map((p) => (
            <article className="np-place" key={p.title}>
              <Image src={p.img} alt="" fill sizes="(max-width: 700px) 82vw, 380px" />
              <div className="np-place-copy">
                <h3 className="np-display np-h3">{p.title}</h3>
                <p>{p.line}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="np-rail-hint">
          <button aria-label="Previous" onClick={() => nudge(-1)}>
            <ChevronLeft size={22} />
          </button>
          <button aria-label="Next" onClick={() => nudge(1)}>
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}
