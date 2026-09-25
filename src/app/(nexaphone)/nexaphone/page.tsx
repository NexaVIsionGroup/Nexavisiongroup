import Nav from "@/components/nexaphone/Nav";
import Hero from "@/components/nexaphone/Hero";
import SignalStory from "@/components/nexaphone/SignalStory";
import DeadBars from "@/components/nexaphone/DeadBars";
import LockSequence from "@/components/nexaphone/LockSequence";
import Marquee from "@/components/nexaphone/Marquee";
import Places from "@/components/nexaphone/Places";
import Control from "@/components/nexaphone/Control";
import ShopRail from "@/components/nexaphone/ShopRail";
import LandingBar from "@/components/nexaphone/LandingBar";
import MiniCta from "@/components/nexaphone/MiniCta";
import WhyNexa from "@/components/nexaphone/WhyNexa";
import Faq from "@/components/nexaphone/Faq";
import Gallery from "@/components/nexaphone/Gallery";
import Closer from "@/components/nexaphone/Closer";

export default function NexaPhonePage() {
  return (
    <>
      <Nav dock={false} />
      <main>
        <Hero />
        <ShopRail />
        <DeadBars />
        <SignalStory />
        <LockSequence />
        <MiniCta />
        <Marquee />
        <Places />
        <Control />
        <WhyNexa />
        <Faq />
        <MiniCta />
        <Gallery />
        <Closer />
      </main>
      <LandingBar />
    </>
  );
}
