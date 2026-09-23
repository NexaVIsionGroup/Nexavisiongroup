import Nav from "@/components/nexaphone/Nav";
import Hero from "@/components/nexaphone/Hero";
import SignalStory from "@/components/nexaphone/SignalStory";
import Places from "@/components/nexaphone/Places";
import Control from "@/components/nexaphone/Control";
import Lineup from "@/components/nexaphone/Lineup";
import Gallery from "@/components/nexaphone/Gallery";
import Closer from "@/components/nexaphone/Closer";

export default function NexaPhonePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SignalStory />
        <Places />
        <Control />
        <Lineup />
        <Gallery />
        <Closer />
      </main>
    </>
  );
}
