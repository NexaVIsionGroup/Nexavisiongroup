"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { getTemplate, sectionProgress, visibleSections } from "@/lib/questionnaires";
import { useCheckup } from "./useCheckup";
import { useTrack } from "./track";
import Briefing from "./Briefing";
import Setup from "./Setup";

// Prospect check-up: a findings briefing (the pitch) followed by the setup
// wizard (access + questions). Same token link, same autosave API as the
// household questionnaire; see src/lib/prospects/README.md.

export default function ProspectClient({ token }: { token: string }) {
  const q = useCheckup(token);
  const track = useTrack(token);
  const [step, setStep] = useState(-1); // -1 briefing, 0..n-1 sections, n review
  const [resumed, setResumed] = useState(false);
  const template = useMemo(() => getTemplate(q.data?.template), [q.data?.template]);
  const sections = useMemo(() => visibleSections(template, q.answers, q.data?.extra_questions), [template, q.answers, q.data?.extra_questions]);
  const n = sections.length;
  const brief = template.brief;

  // Coming back after starting: skip the pitch and land where they left off
  // (the review page if they already sent it). First visit: the briefing.
  // Layout effect so the briefing never paints first on a return visit.
  useLayoutEffect(() => {
    if (!q.data) return;
    const started = Object.keys(q.data.answers || {}).length > 0;
    if (!started) return;
    const total = visibleSections(template, q.data.answers, q.data.extra_questions).length;
    setStep(q.data.submitted_at ? total : Math.min(Math.max(0, q.data.current_section || 0), total - 1));
    setResumed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);

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
    if (next === -1) track("back");
    else track("step", next < n ? sections[next].id : "review", { index: next });
    setStep(next);
    q.flush(next >= 0 && next < n ? { current_section: next } : {});
    window.scrollTo({ top: 0, behavior: next === -1 ? "auto" : "smooth" });
  };
  const start = () => {
    track("start", undefined, { resumed: doneCount > 0 });
    go(doneCount > 0 ? Math.min(Math.max(0, q.data!.current_section || 0), n - 1) : 0);
  };
  const submit = async () => {
    const ok = await q.submit();
    if (ok) track("send");
    return ok;
  };

  return (
    <div className="pr">
      {step === -1 ? (
        <Briefing brief={brief} answers={q.answers} progress={{ done: doneCount, total: n }} onStart={start} track={track} />
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
          resumed={resumed}
          onDismissResumed={() => setResumed(false)}
          submit={submit}
          track={track}
          submitting={q.submitting}
          submittedAt={q.submittedAt}
        />
      )}
    </div>
  );
}
