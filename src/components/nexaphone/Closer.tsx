import Image from "next/image";
import { t } from "./theme";
import Link from "next/link";
import { LeadButton } from "./lead";
import TalkToUs from "./TalkToUs";
import { Mark } from "./Nav";
import Title from "./Title";

export default function Closer() {
  return (
    <>
      <section className="np-section np-closer">
        <div className="np-closer-photo">
          <Image src="/nexaphone/v2/closer.jpg" alt="" fill sizes="100vw" />
        </div>
        <div className="np-closer-rings" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="np-wrap">
          <Title text={t("Bust your crew's phones out.", "Put your crew on the right tower.")} style={{ maxWidth: "9em" }} />
          <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
            {t(
              "Buy one today and it walks out of our shop set up, tested and locked on. Or tell us how many phones you need and where they'll work and we'll quote your fleet. Want the details? Ask for the technical guide.",
              "Buy one today, or tell us how many phones you need and where they'll work and we'll quote your fleet. Want the details? Ask for the technical guide."
            )}
          </p>
          <div className="np-hero-ctas" style={{ marginTop: 30 }}>
            <Link href="#shop" className="np-btn np-btn-lock np-shine">Shop all 8 models</Link>
            <LeadButton kind="quote" className="np-btn np-btn-ghost">Get a fleet quote</LeadButton>
            <LeadButton kind="guide" className="np-btn np-btn-ghost">Request the technical guide</LeadButton>
          </div>
          <TalkToUs title="Rather talk it through?" />
        </div>
      </section>
      <footer className="np-footer">
        <div className="np-wrap np-footer-row">
          <a href="#top" className="np-wordmark" style={{ fontSize: 20 }}>
            <Mark />
            Nexa Pro
          </a>
          <span>A NexaVision Group company. Photography from Pexels.</span>
        </div>
      </footer>
    </>
  );
}
