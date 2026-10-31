"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Answers, ExtraQuestion } from "@/lib/questionnaires";

// Load + autosave + submit for a /q/<token> link (same API as the household
// questionnaire). Differences: typed passwords are never written to
// localStorage, and once the server has sealed one the local copy is dropped.

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface Loaded {
  token: string;
  template: string;
  title: string;
  status: string;
  answers: Answers;
  extra_questions: ExtraQuestion[];
  current_section: number;
  submitted_at: string | null;
}

const lsKey = (t: string) => `nvq:${t}`;
const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

/** copy of a patch with every password removed (safe for localStorage) */
function noSecrets(p: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v && typeof v === "object" && !Array.isArray(v) && "pass" in v) {
      const { pass, ...rest } = v;
      out[k] = rest;
    } else out[k] = v;
  }
  return out;
}

export function useCheckup(token: string) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [save, setSave] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dirty = useRef<Record<string, any>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async (extra: Record<string, any> = {}, keepalive = false) => {
    const patch = dirty.current;
    dirty.current = {};
    if (timer.current) clearTimeout(timer.current);
    if (!Object.keys(patch).length && !Object.keys(extra).length) return;
    setSave("saving");
    try {
      const r = await fetch(`/api/q/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(Object.keys(patch).length ? { answers: patch } : {}), ...extra }),
        keepalive,
      });
      if (!r.ok) throw new Error();
      lsSet(lsKey(token), JSON.stringify(noSecrets(dirty.current)));
      // the server sealed any password in this patch: forget the plain text
      const sealed = Object.entries(patch).filter(([, v]) => v && typeof v === "object" && typeof v.pass === "string" && v.pass);
      if (sealed.length) {
        setAnswers((prev) => {
          const next = { ...prev };
          for (const [k, sent] of sealed) {
            const cur = next[k];
            if (cur && cur.pass === sent.pass) {
              const { pass, ...rest } = cur;
              next[k] = { ...rest, pass_saved: true };
            }
          }
          return next;
        });
      }
      setSave("saved");
      setSavedAt(new Date());
    } catch {
      dirty.current = { ...patch, ...dirty.current };
      lsSet(lsKey(token), JSON.stringify(noSecrets(dirty.current)));
      setSave("error");
      timer.current = setTimeout(() => flush(), 8000);
    }
  }, [token]);

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 900);
  }, [flush]);

  useEffect(() => {
    fetch(`/api/q/${token}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not open this link.");
        return j as Loaded;
      })
      .then((d) => {
        let a: Answers = d.answers || {};
        const pending = lsGet(lsKey(token));
        if (pending) {
          try {
            const p = JSON.parse(pending);
            if (p && typeof p === "object" && Object.keys(p).length) {
              a = { ...a, ...p };
              dirty.current = { ...p };
            }
          } catch {}
        }
        setData(d);
        setAnswers(a);
        setSubmittedAt(d.submitted_at);
        if (Object.keys(dirty.current).length) scheduleSave();
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const onHide = () => { if (Object.keys(dirty.current).length) flush({}, true); };
    const onVis = () => { if (document.visibilityState === "hidden") onHide(); };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flush]);

  const setAnswer = useCallback((id: string, v: any) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    dirty.current[id] = v;
    lsSet(lsKey(token), JSON.stringify(noSecrets(dirty.current)));
    setSave("saving");
    scheduleSave();
  }, [scheduleSave, token]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    await flush();
    try {
      const r = await fetch(`/api/q/${token}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSubmittedAt(j.submitted_at);
      return true;
    } catch {
      setSave("error");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [flush, token]);

  return { data, error, answers, setAnswer, save, savedAt, flush, submit, submitting, submittedAt };
}
