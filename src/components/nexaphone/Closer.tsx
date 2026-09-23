import Image from "next/image";
import { GUIDE_MAIL, QUOTE_MAIL } from "./data";
import { Mark } from "./Nav";
import Title from "./Title";

export default function Closer() {
  return (
    <>
      <section className="np-section np-closer">
        <div className="np-closer-photo">
          <Image src="/nexaphone/stock/tower-moon.jpg" alt="" fill sizes="100vw" />
        </div>
        <div className="np-closer-rings" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="np-wrap">
          <Title text="Put your crew on the right tower." style={{ maxWidth: "9em" }} />
          <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
            Online ordering opens soon. Tell us how many phones you need and where they&apos;ll work, and
            we&apos;ll quote your fleet today. Want the details? Ask for the technical guide.
          </p>
          <div className="np-hero-ctas" style={{ marginTop: 30 }}>
            <a href={QUOTE_MAIL} className="np-btn np-btn-lock np-shine">Get a quote</a>
            <a href={GUIDE_MAIL} className="np-btn np-btn-ghost">Request the technical guide</a>
          </div>
        </div>
      </section>
      <footer className="np-footer">
        <div className="np-wrap np-footer-row">
          <a href="#top" className="np-wordmark" style={{ fontSize: 20 }}>
            <Mark />
            Nexa Pro
          </a>
          <span>A NexaVision Group company. Stock photography from Pexels.</span>
        </div>
      </footer>
    </>
  );
}
