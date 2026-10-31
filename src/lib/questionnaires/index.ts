import { householdBudget } from "./household-budget";
import { PROSPECT_TEMPLATES } from "@/lib/prospects";
import type {
  Answers,
  ExtraQuestion,
  Field,
  Freq,
  MoneyField,
  MoneyValue,
  Section,
  ShowIf,
  Template,
} from "./types";
import { FREQ_TO_MONTHLY } from "./types";

export * from "./types";

export const TEMPLATES: Record<string, Template> = {
  [householdBudget.id]: householdBudget,
  // prospect check-ups staged on the Nexa stack (src/lib/prospects)
  ...Object.fromEntries(PROSPECT_TEMPLATES.map((t) => [t.id, t])),
};

export function getTemplate(id: string | null | undefined): Template {
  return TEMPLATES[id || ""] || householdBudget;
}

/** Replace {p1}/{p2} with the names typed on the household page. */
export function personalize(text: string, answers: Answers): string {
  const p1 = String(answers.p1_first || "").trim() || "Person 1";
  const p2 = String(answers.p2_first || "").trim() || "Person 2";
  return text.replace(/\{p1\}/g, p1).replace(/\{p2\}/g, p2);
}

function asValues(v: any): string[] {
  if (v == null || v === "") return [""];
  if (Array.isArray(v)) return v.length ? v.map(String) : [""];
  if (typeof v === "object" && "a" in v) return v.a == null || v.a === "" ? [""] : [String(v.a)];
  return [String(v)];
}

export function isVisible(rule: ShowIf | undefined, answers: Answers): boolean {
  if (!rule) return true;
  const vals = asValues(answers[rule.field]);
  if (rule.in && !vals.some((v) => rule.in!.includes(v))) return false;
  if (rule.notIn && vals.some((v) => rule.notIn!.includes(v))) return false;
  return true;
}

/** Turn admin follow-up questions into a normal section shown first. */
export function extraSection(extra: ExtraQuestion[] | null | undefined): Section | null {
  if (!extra || extra.length === 0) return null;
  return {
    id: "followup",
    title: "A few more questions",
    short: "New questions",
    icon: "MessageCircleQuestion",
    intro: "We added these after looking at your answers. Thank you!",
    fields: extra.map((q): Field => {
      const id = `x_${q.id}`;
      if (q.type === "money") return { type: "money", id, label: q.label, help: q.help };
      if (q.type === "yesno") return { type: "yesno", id, label: q.label, help: q.help };
      return { type: q.type, id, label: q.label, help: q.help };
    }),
  };
}

export function visibleSections(t: Template, answers: Answers, extra?: ExtraQuestion[]): Section[] {
  const x = extraSection(extra);
  const list = x ? [x, ...t.sections] : t.sections;
  return list.filter((s) => isVisible(s.showIf, answers));
}

export function monthly(v: MoneyValue | null | undefined, field: MoneyField): number {
  if (!v || v.a == null || isNaN(Number(v.a))) return 0;
  if (field.recurring === false) return Number(v.a);
  const f: Freq = v.f || field.freq || "monthly";
  return Number(v.a) * (FREQ_TO_MONTHLY[f] ?? 1);
}

export interface MoneyLine {
  sectionId: string;
  fieldId: string;
  label: string;
  role: NonNullable<MoneyField["role"]>;
  category: string;
  /** monthly for recurring, raw amount for balances/assets */
  amount: number;
  raw: MoneyValue;
}

/** Every answered money value in visible sections (including list rows). */
export function moneyLines(t: Template, answers: Answers, extra?: ExtraQuestion[]): MoneyLine[] {
  const out: MoneyLine[] = [];
  for (const s of visibleSections(t, answers, extra)) {
    for (const f of s.fields) {
      if (!isVisible(f.showIf, answers)) continue;
      if (f.type === "money" && f.role) {
        const v = answers[f.id] as MoneyValue | undefined;
        if (v && v.a != null) {
          out.push({ sectionId: s.id, fieldId: f.id, label: personalize(f.label, answers), role: f.role, category: f.category || "Other", amount: monthly(v, f), raw: v });
        }
      }
      if (f.type === "list") {
        const rows: any[] = Array.isArray(answers[f.id]) ? answers[f.id] : [];
        rows.forEach((row, i) => {
          const name = String(row.name || row.lender || row.source || row.company || row.what || row.kind || `${f.itemLabel} ${i + 1}`);
          for (const c of f.columns) {
            if (c.type !== "money" || !c.role) continue;
            const v = row[c.id] as MoneyValue | undefined;
            if (v && v.a != null) {
              out.push({ sectionId: s.id, fieldId: `${f.id}[${i}].${c.id}`, label: `${name} · ${c.label}`, role: c.role, category: c.category || "Other", amount: monthly(v, c), raw: v });
            }
          }
        });
      }
    }
  }
  return out;
}

export interface Totals {
  income: number;
  expenses: number;
  gap: number;
  debt: number;
  assets: number;
  byCategory: { role: string; category: string; amount: number }[];
}

export function totals(t: Template, answers: Answers, extra?: ExtraQuestion[]): Totals {
  const lines = moneyLines(t, answers, extra);
  const sum = (r: string) => lines.filter((l) => l.role === r).reduce((a, l) => a + l.amount, 0);
  const cat = new Map<string, { role: string; category: string; amount: number }>();
  for (const l of lines) {
    const k = `${l.role}:${l.category}`;
    const cur = cat.get(k) || { role: l.role, category: l.category, amount: 0 };
    cur.amount += l.amount;
    cat.set(k, cur);
  }
  const income = sum("income");
  const expenses = sum("expense");
  return {
    income,
    expenses,
    gap: income - expenses,
    debt: sum("debt"),
    assets: sum("asset"),
    byCategory: Array.from(cat.values()).sort((a, b) => b.amount - a.amount),
  };
}

/** answered / visible counts for progress */
export function sectionProgress(s: Section, answers: Answers): { answered: number; total: number } {
  let answered = 0;
  let total = 0;
  for (const f of s.fields) {
    if (f.type === "info" || !isVisible(f.showIf, answers)) continue;
    total++;
    const v = answers[f.id];
    if (v == null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v) && "a" in v && (v.a == null || v.a === "")) continue;
    answered++;
  }
  return { answered, total };
}

export const fmtMoney = (n: number, cents = false) =>
  (n < 0 ? "-" : "") +
  "$" +
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

export function newToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
}
