import Link from "next/link";
import { fromPrice, money, products } from "./catalog";

/** A quiet buy prompt at the end of a story section. */
export default function MiniCta({ light = false }: { light?: boolean }) {
  const hero = products.find((p) => p.bestSeller) ?? products[0];
  return (
    <div className="np-wrap">
      <div className="np-minicta" data-light={light}>
        <span>
          Ready? The {hero.name} starts at <b className="np-num">{money(fromPrice(hero))}</b>.
        </span>
        <div>
          <Link href={`/nexaphone/phones/${hero.slug}`} className="np-btn np-btn-lock">
            Shop {hero.name}
          </Link>
          <Link href="#shop" className="np-btn np-btn-ghost">
            All models
          </Link>
        </div>
      </div>
    </div>
  );
}
