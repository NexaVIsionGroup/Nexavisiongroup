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
import SignalTest from "@/components/nexaphone/SignalTest";
import Performance from "@/components/nexaphone/Performance";
import Junction from "@/components/nexaphone/Junction";
import ChapterEnd from "@/components/nexaphone/ChapterEnd";
import Faq from "@/components/nexaphone/Faq";
import Gallery from "@/components/nexaphone/Gallery";
import Closer from "@/components/nexaphone/Closer";

export default function NexaPhonePage() {
  return (
    <>
      <Nav dock={false} />
      <main>
        <Hero />
        <Junction src="/nexaphone/placeholder/hands.jpg" from="dark" to="light" focus="50% 45%" />
        <ShopRail />
        <Junction src="/nexaphone/placeholder/shards.jpg" from="light" to="dark" focus="50% 50%" />
        <DeadBars />
        <ChapterEnd label="Signal" href="#signal" />
        <Junction src="/nexaphone/v2/g-tower.jpg" from="dark" to="light" focus="50% 40%" />
        <SignalStory />
        <Junction src="/nexaphone/placeholder/fps.jpg" from="light" to="dark" focus="50% 35%" />
        <SignalTest />
        <ChapterEnd label="Performance" href="#flagship" />
        <LockSequence />
        <Junction src="/nexaphone/placeholder/streaks.jpg" from="dark" to="light" focus="50% 50%" />
        <Performance />
        <Junction src="/nexaphone/placeholder/charge.jpg" from="light" to="dark" focus="50% 50%" />
        <MiniCta />
        <Marquee />
        <Places />
        <ChapterEnd label="Where it works" href="#control" />
        <Control />
        <ChapterEnd label="Control" href="#why" />
        <WhyNexa />
        <Junction src="/nexaphone/placeholder/rpg.jpg" from="dark" to="light" focus="50% 30%" />
        <Faq />
        <Junction src="/nexaphone/v2/g-tunnel.jpg" from="light" to="dark" focus="50% 50%" />
        <MiniCta />
        <Gallery />
        <Closer />
      </main>
      <LandingBar />
    </>
  );
}
