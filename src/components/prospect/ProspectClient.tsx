"use client";

import { useMemo, useState } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { getTemplate, sectionProgress, visibleSections } from "@/lib/questionnaires";
import { useCheckup } from "./useCheckup";
import Briefing from "./Briefing";
import Setup from "./Setup";

// Prospect check-up: a findings briefing (the pitch) followed by the setup
// wizard (access + questions). Same token link, same autosave API as the
// household questionnaire; see src/lib/prospects/README.md.

export default function ProspectClient({ token }: { token: string }) {
  const q = useCheckup(token);
  const [step, setStep] = useState(-1); // -1 briefing, 0..n-1 sections, n review
  const template = useMemo(() => getTemplate(q.data?.template), [q.data?.template]);
  const sections = useMemo(() => visibleSections(template, q.answers, q.data?.extra_questions), [template, q.answers, q.data?.extra_questions]);
  const n = sections.length;
  const brief = template.brief;

  if (q.error) {
    return (
      <div className="pr pr-center">
        <div>
          <CloudOff size={40} style={{ margin: "0 auto 16px", color: "var(--gold)" }} />
          <p className="pr-h3">{q.error}</p>
          <p className="pr-lede" style={{ margin: "12px auto 0" }}>Please reach out to admin@nexavisiongroup.com and we'll send a fresh link.</p>
        </div>
      </div>
    );
  }
  if (!q.data || !brief) {
    return <div className="pr pr-center"><Loader2 size={36} className="animate-spin" style={{ color: "var(--gold)" }} /></div>;
  }

  const doneCount = sections.filter((s) => sectionProgress(s, q.answers).answered > 0).length;
  const go = (i: number) => {
    const next = Math.max(-1, Math.min(n, i));
    setStep(next);
    q.flush(next >= 0 && next < n ? { current_section: next } : {});
    window.scrollTo({ top: 0, behavior: next === -1 ? "auto" : "smooth" });
  };
  const start = () => go(doneCount > 0 ? Math.min(Math.max(0, q.data!.current_section || 0), n - 1) : 0);

  return (
    <div className="pr">
      {step === -1 ? (
        <Briefing brief={brief} answers={q.answers} progress={{ done: doneCount, total: n }} onStart={start} />
      ) : (
        <Setup
          title={q.data.title}
          sections={sections}
          step={step}
          go={go}
          answers={q.answers}
          setAnswer={q.setAnswer}
          save={q.save}
          savedAt={q.savedAt}
          contactEmail={brief.contact.email}
          onBriefing={() => go(-1)}
          submit={q.submit}
          submitting={q.submitting}
          submittedAt={q.submittedAt}
        />
      )}
    </div>
  );
}
