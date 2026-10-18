"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2, Lock, Lightbulb, Info } from "lucide-react";
import type { Answers, Field, Freq, ListField, MoneyField, MoneyValue, Option } from "@/lib/questionnaires";
import { FREQ_LABEL, isVisible, personalize } from "@/lib/questionnaires";

// Large, high-contrast inputs for older eyes and less steady hands.
// Sizes are in em so the page-level text-size toggle scales everything.

const FREQS: Freq[] = ["weekly", "biweekly", "twice_monthly", "monthly", "quarterly", "semiannual", "yearly"];

const inputBase =
  "w-full rounded-xl border-2 border-[#d8cfc2] bg-white px-[0.8em] py-[0.6em] text-[1em] text-[#1f2328] placeholder:text-[#9a9187] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/15";

type SetFn = (id: string, value: any) => void;

export function FieldView({ field, answers, value, onChange, scope }: {
  field: Field;
  answers: Answers;
  value: any;
  onChange: (v: any) => void;
  /** id prefix for list rows, keeps label/input ids unique */
  scope?: string;
}) {
  const label = personalize(field.label, answers);
  const help = field.help ? personalize(field.help, answers) : null;
  const htmlId = `f_${scope || ""}${field.id}`;

  if (field.type === "info") {
    const tone = field.tone || "note";
    const Icon = tone === "privacy" ? Lock : tone === "tip" ? Lightbulb : Info;
    const cls =
      tone === "privacy"
        ? "bg-[#fff6e5] border-[#f0c36d] text-[#6b4a00]"
        : tone === "tip"
        ? "bg-[#e9f6f3] border-[#9fd6cb] text-[#0b4f49]"
        : "bg-[#f3efe8] border-[#ddd3c4] text-[#4a443d]";
    return (
      <div className={`flex gap-[0.6em] rounded-2xl border-2 px-[1em] py-[0.8em] ${cls}`}>
        <Icon className="mt-[0.15em] h-[1.1em] w-[1.1em] shrink-0" aria-hidden />
        <p className="text-[0.95em] leading-relaxed">{label}</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={htmlId} className="block text-[1.05em] font-bold leading-snug text-[#1f2328]">
        {label}
      </label>
      {help && <p className="mt-[0.25em] text-[0.88em] leading-relaxed text-[#5f5850]">{help}</p>}
      <div className="mt-[0.6em]">
        <Control field={field} answers={answers} value={value} onChange={onChange} htmlId={htmlId} />
      </div>
    </div>
  );
}

function Control({ field, answers, value, onChange, htmlId }: {
  field: Field;
  answers: Answers;
  value: any;
  onChange: (v: any) => void;
  htmlId: string;
}) {
  switch (field.type) {
    case "text":
    case "phone":
    case "email":
      return (
        <input
          id={htmlId}
          type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : "text"}
          inputMode={field.type === "phone" ? "tel" : undefined}
          autoComplete="off"
          className={inputBase}
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "textarea":
      return (
        <textarea
          id={htmlId}
          rows={3}
          className={`${inputBase} min-h-[5.5em] resize-y leading-relaxed`}
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <div className="flex items-center gap-[0.5em]">
          <input
            id={htmlId}
            type="text"
            inputMode="decimal"
            className={`${inputBase} max-w-[9em]`}
            placeholder={field.placeholder}
            value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, "");
              onChange(raw === "" ? null : raw);
            }}
          />
          {field.suffix && <span className="text-[0.95em] text-[#5f5850]">{field.suffix}</span>}
        </div>
      );
    case "money":
      return <MoneyInput field={field} value={value} onChange={onChange} htmlId={htmlId} />;
    case "yesno": {
      const options: Option[] = [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        ...(field.unsure === false ? [] : [{ value: "not_sure", label: "Not sure" }]),
      ];
      return <ChoiceButtons options={options} value={value} onChange={onChange} answers={answers} inline />;
    }
    case "choice":
      if (field.dropdown) {
        return (
          <select id={htmlId} className={`${inputBase} cursor-pointer`} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">Choose…</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {personalize(o.label, answers)}
              </option>
            ))}
          </select>
        );
      }
      return <ChoiceButtons options={field.options} value={value} onChange={onChange} answers={answers} />;
    case "multi":
      return <MultiButtons options={field.options} value={value} onChange={onChange} answers={answers} />;
    case "list":
      return <ListInput field={field} answers={answers} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function MoneyInput({ field, value, onChange, htmlId }: { field: MoneyField; value: MoneyValue | null; onChange: (v: any) => void; htmlId: string }) {
  const recurring = field.recurring !== false;
  const freq: Freq = value?.f || field.freq || "monthly";
  const [text, setText] = useState(value?.a != null ? String(value.a) : "");

  // keep in sync if the value is replaced from outside (e.g. reload)
  useEffect(() => {
    const ext = value?.a != null ? String(value.a) : "";
    if (Number(ext || 0) !== Number(text || 0)) setText(ext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.a]);

  const commit = (t: string, f: Freq) => {
    const clean = t.replace(/[^0-9.]/g, "");
    const n = clean === "" || clean === "." ? null : Math.round(Number(clean) * 100) / 100;
    // recurring values keep the chosen frequency even before an amount is typed
    onChange(recurring ? { a: n, f } : n == null ? null : { a: n });
  };

  return (
    <div className="flex flex-wrap items-center gap-[0.5em]">
      <div className="relative w-full max-w-[11em]">
        <span className="pointer-events-none absolute left-[0.8em] top-1/2 -translate-y-1/2 text-[1em] font-bold text-[#5f5850]">$</span>
        <input
          id={htmlId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={`${inputBase} pl-[1.7em] font-bold tabular-nums`}
          placeholder="0"
          value={text}
          onChange={(e) => {
            const t = e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, "");
            setText(t);
            commit(t, freq);
          }}
        />
      </div>
      {recurring && (
        <select
          aria-label="How often"
          className="cursor-pointer rounded-xl border-2 border-[#d8cfc2] bg-[#faf7f2] px-[0.7em] py-[0.6em] text-[0.95em] font-semibold text-[#1f2328] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/15"
          value={freq}
          onChange={(e) => {
            commit(text, e.target.value as Freq);
          }}
        >
          {FREQS.map((f) => (
            <option key={f} value={f}>
              {FREQ_LABEL[f]}
            </option>
          ))}
        </select>
      )}
      {(value?.a != null) && (
        <button type="button" onClick={() => { setText(""); onChange(null); }} className="text-[0.85em] font-semibold text-[#5f5850] underline underline-offset-4 hover:text-[#1f2328]">
          Clear
        </button>
      )}
    </div>
  );
}

function ChoiceButtons({ options, value, onChange, answers, inline }: { options: Option[]; value: any; onChange: (v: any) => void; answers: Answers; inline?: boolean }) {
  return (
    <div role="radiogroup" className={inline ? "flex flex-wrap gap-[0.5em]" : "grid gap-[0.5em] sm:grid-cols-2"}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? null : o.value)}
            className={`group flex min-h-[3em] items-center gap-[0.6em] rounded-xl border-2 px-[0.9em] py-[0.55em] text-left transition ${
              inline ? "min-w-[6.5em] justify-center" : ""
            } ${on ? "border-[#0f766e] bg-[#e9f6f3] text-[#0b4f49]" : "border-[#d8cfc2] bg-white text-[#1f2328] hover:border-[#9fd6cb]"}`}
          >
            <span className={`flex h-[1.25em] w-[1.25em] shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-[#0f766e] bg-[#0f766e]" : "border-[#b9ae9f]"}`}>
              {on && <Check className="h-[0.8em] w-[0.8em] text-white" strokeWidth={3.5} />}
            </span>
            <span>
              <span className="block text-[0.98em] font-semibold leading-snug">{personalize(o.label, answers)}</span>
              {o.hint && <span className="block text-[0.82em] text-[#5f5850]">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MultiButtons({ options, value, onChange, answers }: { options: Option[]; value: any; onChange: (v: any) => void; answers: Answers }) {
  const sel: string[] = Array.isArray(value) ? value : [];
  const exclusive = new Set(["none", "nothing_right_now", "neither", "not_sure", "no_other_way"]);
  const toggle = (v: string) => {
    let next = sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v];
    // "None" style answers clear the others, and vice versa
    if (!sel.includes(v)) next = exclusive.has(v) ? [v] : next.filter((x) => !exclusive.has(x));
    onChange(next.length ? next : null);
  };
  return (
    <div className="grid gap-[0.5em] sm:grid-cols-2">
      {options.map((o) => {
        const on = sel.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(o.value)}
            className={`flex min-h-[3em] items-center gap-[0.6em] rounded-xl border-2 px-[0.9em] py-[0.55em] text-left transition ${
              on ? "border-[#0f766e] bg-[#e9f6f3] text-[#0b4f49]" : "border-[#d8cfc2] bg-white text-[#1f2328] hover:border-[#9fd6cb]"
            }`}
          >
            <span className={`flex h-[1.25em] w-[1.25em] shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-[#0f766e] bg-[#0f766e]" : "border-[#b9ae9f]"}`}>
              {on && <Check className="h-[0.85em] w-[0.85em] text-white" strokeWidth={3.5} />}
            </span>
            <span className="text-[0.98em] font-semibold leading-snug">{personalize(o.label, answers)}</span>
          </button>
        );
      })}
    </div>
  );
}

const WIDTH: Record<string, string> = {
  sm: "w-full sm:w-[10em]",
  md: "w-full sm:w-[15em]",
  lg: "w-full",
};

function ListInput({ field, answers, value, onChange }: { field: ListField; answers: Answers; value: any; onChange: (v: any) => void }) {
  const rows: any[] = Array.isArray(value) ? value : [];
  const set = (i: number, k: string, v: any) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const add = () => onChange([...rows, {}]);
  const remove = (i: number) => {
    const next = rows.filter((_, j) => j !== i);
    onChange(next.length ? next : null);
  };
  return (
    <div className="space-y-[0.75em]">
      {rows.map((row, i) => (
        <div key={i} className="rounded-2xl border-2 border-[#e4dccf] bg-[#fcfaf6] p-[0.9em]">
          <div className="mb-[0.5em] flex items-center justify-between">
            <span className="text-[0.85em] font-bold uppercase tracking-wide text-[#8a7f72]">
              {field.itemLabel} {i + 1}
            </span>
            <button type="button" onClick={() => remove(i)} className="flex items-center gap-[0.3em] rounded-lg px-[0.5em] py-[0.3em] text-[0.85em] font-semibold text-[#9b2c2c] hover:bg-[#fdecec]">
              <Trash2 className="h-[1em] w-[1em]" /> Remove
            </button>
          </div>
          <div className="flex flex-wrap gap-x-[1em] gap-y-[0.9em]">
            {field.columns
              .filter((c) => isVisible(c.showIf, row))
              .map((c) => (
                <div key={c.id} className={c.type === "money" ? "w-full" : WIDTH[c.width || "lg"]}>
                  <FieldView field={c} answers={answers} value={row[c.id]} onChange={(v) => set(i, c.id, v)} scope={`${field.id}_${i}_`} />
                </div>
              ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-[0.5em] rounded-2xl border-2 border-dashed border-[#9fd6cb] bg-[#f3fbf9] px-[1em] py-[0.8em] text-[1em] font-bold text-[#0f766e] transition hover:border-[#0f766e] hover:bg-[#e9f6f3]"
      >
        <Plus className="h-[1.1em] w-[1.1em]" strokeWidth={3} /> {field.addLabel}
      </button>
    </div>
  );
}

export function fieldWidthClass(f: Field): string {
  if (f.type === "text" || f.type === "number" || f.type === "phone" || f.type === "email") return WIDTH[f.width || "lg"];
  return "w-full";
}

export type { SetFn };
