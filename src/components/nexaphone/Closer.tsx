import Image from "next/image";
import { MODEL_COUNT } from "./lineup";
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
          <video className="np-closer-video" src="/nexaphone/v4/closer-loop.mp4" poster="/nexaphone/v2/closer.jpg" autoPlay muted loop playsInline preload="metadata" aria-hidden />
        </div>
        <div className="np-closer-rings" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="np-wrap">
          <Title text={t("Bust your phone out. Rank up.", "Get on the right tower. Rank up.")} style={{ maxWidth: "9em" }} />
          <p className="np-lede" style={{ marginTop: 22, color: "#cfd9df" }}>
            {t(
              "Buy one today and it walks out of our shop set up, tested and locked on. Running a team, a LAN or a work crew? Tell us how many and where they'll play, and we'll quote it. Want the details? Ask for the technical guide.",
              "Buy one today. Running a team, a LAN or a work crew? Tell us how many and where they'll play, and we'll quote it. Want the details? Ask for the technical guide."
            )}
          </p>
          <div className="np-hero-ctas" style={{ marginTop: 30 }}>
            <Link href="#shop" className="np-btn np-btn-lock np-shine">Shop all {MODEL_COUNT} models</Link>
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
