import Nav from "@/components/nexaphone/Nav";
import Hero from "@/components/nexaphone/Hero";
import SignalStory from "@/components/nexaphone/SignalStory";
import LockSequence from "@/components/nexaphone/LockSequence";
import Marquee from "@/components/nexaphone/Marquee";
import Places from "@/components/nexaphone/Places";
import Control from "@/components/nexaphone/Control";
import Lineup from "@/components/nexaphone/Lineup";
import WhyNexa from "@/components/nexaphone/WhyNexa";
import Gallery from "@/components/nexaphone/Gallery";
import Closer from "@/components/nexaphone/Closer";

export default function NexaPhonePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SignalStory />
        <LockSequence />
        <Marquee />
        <Places />
        <Control />
        <WhyNexa />
        <Lineup />
        <Gallery />
        <Closer />
      </main>
    </>
  );
}
