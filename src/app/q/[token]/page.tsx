import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import QuestionnaireClient from "./QuestionnaireClient";

// Atkinson Hyperlegible: designed by the Braille Institute for low-vision readers.
const legible = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Household Check-up",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function QuestionnairePage({ params }: { params: { token: string } }) {
  return (
    <div className={legible.className}>
      <QuestionnaireClient token={params.token} />
    </div>
  );
}
