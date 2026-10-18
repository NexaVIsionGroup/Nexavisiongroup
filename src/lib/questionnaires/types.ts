// Client Questionnaire engine — template types.
// A template is plain data: sections → fields. Answers are stored as a flat
// JSON object keyed by field id (list fields store an array of row objects).
// To ask new questions, edit the template file (or add per-link follow-up
// questions from /admin/questionnaires/[id]); no database change is needed.

export type Freq =
  | "weekly"
  | "biweekly"
  | "twice_monthly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "yearly";

export const FREQ_LABEL: Record<Freq, string> = {
  weekly: "per week",
  biweekly: "every 2 weeks",
  twice_monthly: "twice a month",
  monthly: "per month",
  quarterly: "every 3 months",
  semiannual: "every 6 months",
  yearly: "per year",
};

/** multiply an amount at this frequency to get a monthly amount */
export const FREQ_TO_MONTHLY: Record<Freq, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  twice_monthly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  yearly: 1 / 12,
};

export type MoneyRole = "income" | "expense" | "debt" | "asset";

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

/** show a field/section only when another answer matches */
export interface ShowIf {
  field: string;
  /** answer (or, for multi fields, any selected value) is one of these */
  in?: string[];
  /** no answer value is one of these (an empty answer is the value "") */
  notIn?: string[];
}

interface FieldBase {
  id: string;
  label: string;
  help?: string;
  showIf?: ShowIf;
  /** for list columns: render narrower */
  width?: "sm" | "md" | "lg";
}

export interface TextField extends FieldBase {
  type: "text" | "textarea" | "phone" | "email";
  placeholder?: string;
}
export interface NumberField extends FieldBase {
  type: "number";
  suffix?: string;
  placeholder?: string;
}
export interface MoneyField extends FieldBase {
  type: "money";
  role?: MoneyRole;
  /** budget bucket used in totals (e.g. "Housing") */
  category?: string;
  /** default frequency shown; defaults to monthly */
  freq?: Freq;
  /** false = a one-time amount (balances, values) with no frequency picker */
  recurring?: boolean;
}
export interface ChoiceField extends FieldBase {
  type: "choice";
  options: Option[];
  /** render as a compact dropdown instead of big buttons */
  dropdown?: boolean;
}
export interface MultiField extends FieldBase {
  type: "multi";
  options: Option[];
}
export interface YesNoField extends FieldBase {
  type: "yesno";
  /** add a third "Not sure" button (default true) */
  unsure?: boolean;
}
export interface ListField extends FieldBase {
  type: "list";
  itemLabel: string;
  addLabel: string;
  columns: Field[];
}
export interface InfoField extends FieldBase {
  type: "info";
  tone?: "note" | "privacy" | "tip";
}

export type Field =
  | TextField
  | NumberField
  | MoneyField
  | ChoiceField
  | MultiField
  | YesNoField
  | ListField
  | InfoField;

export interface Section {
  id: string;
  title: string;
  /** short label for the progress rail */
  short: string;
  icon: string; // lucide icon name, resolved in the UI
  intro?: string;
  showIf?: ShowIf;
  fields: Field[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  welcome: { heading: string; body: string[] };
  sections: Section[];
}

export interface MoneyValue {
  a: number | null;
  f?: Freq;
}

export type Answers = Record<string, any>;

/** follow-up question added by an admin to one specific link */
export interface ExtraQuestion {
  id: string;
  label: string;
  help?: string;
  type: "text" | "textarea" | "money" | "yesno";
  created_at: string;
}
