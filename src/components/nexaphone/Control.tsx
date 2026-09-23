import { Ban, Wrench, SlidersHorizontal, CalendarCheck, Lock, PackageCheck } from "lucide-react";
import { controls } from "./data";

const ICONS = [Ban, Wrench, SlidersHorizontal, CalendarCheck, Lock, PackageCheck];

export default function Control() {
  return (
    <section className="np-section" id="control" style={{ paddingTop: 0 }}>
      <div className="np-wrap">
        <h2 className="np-display np-h2" style={{ maxWidth: "10em" }}>
          A phone that answers to you.
        </h2>
        <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
          Every Nexa Pro ships with full control opened up. The same access that lets it choose a tower
          also lets you strip it down, lock it down and make it yours.
        </p>
        <div className="np-control">
          {controls.map((c, i) => {
            const Icon = ICONS[i];
            return (
              <div key={c.title}>
                <Icon size={26} strokeWidth={1.7} />
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
