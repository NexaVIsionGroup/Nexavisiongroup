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

/**
 * "Give us access to X" card (prospect check-ups). The answer is an
 * AccessValue. A typed password never comes back to the browser: the public
 * API seals it into `pass_enc` (see ./secrets) and only admins can reveal it.
 */
export interface AccessField extends FieldBase {
  type: "access";
  /** short platform name, e.g. "Clover" */
  platform: string;
  /** what it is for them, e.g. "Your POS and card payments" */
  what: string;
  /** why we want it and what we'll look at (read-only) */
  why: string;
  priority?: "key" | "helpful";
  /** brand color for the card's badge */
  color?: string;
  /** steps to add us as a user; omit when the platform has no invite option */
  invite?: { steps: string[]; role?: string; url?: string };
  /** where they sign in, shown next to the login fields */
  loginUrl?: string;
  /** label for the username box (default "Email or username") */
  userLabel?: string;
}

export type AccessVia = "invite" | "login" | "call" | "unknown" | "none";

export interface AccessValue {
  via?: AccessVia;
  /** they finished sending the invite */
  done?: boolean;
  user?: string;
  /** plain text only on its way in; replaced by pass_enc on save */
  pass?: string;
  pass_enc?: string;
  pass_saved?: boolean;
  /** clear a saved password */
  pass_clear?: boolean;
  note?: string;
}

export type Field =
  | TextField
  | NumberField
  | MoneyField
  | ChoiceField
  | MultiField
  | YesNoField
  | ListField
  | InfoField
  | AccessField;

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
  /** "prospect" templates open on a findings briefing (see Brief) */
  kind?: "household" | "prospect";
  brief?: Brief;
}

// ── Prospect briefing (shown before the questions) ─────────────
export interface BriefFinding {
  id: string;
  /** big number / word on the card */
  stat: string;
  statLabel: string;
  title: string;
  body: string[];
  /** what we'd do about it */
  fix: string;
  image?: { src: string; alt: string; caption?: string };
  /** side-by-side values that should agree but don't (shown when no image) */
  compare?: { source: string; value: string; odd?: boolean }[];
  tone?: "warn" | "money" | "info";
}

export interface BriefFeature {
  icon: string; // lucide icon name
  title: string;
  body: string;
  image?: string;
}

export interface Brief {
  business: string;
  /** e.g. "Babylon, NY" */
  place: string;
  /** brand accent for the business, hex */
  accent: string;
  /** greeting shown before we know their first name */
  hello: string;
  headline: string;
  /** second headline line, set in the accent style */
  headlineAccent?: string;
  lead: string;
  /** hero background photo */
  heroImage?: string;
  /** photo used as the transition between chapters */
  seamImage?: string;
  /** delivery-zone map: the business sits at 0,0; towns in miles (x east, y north) */
  zone?: { radii: number[]; defaultRadius: number; towns: { name: string; x: number; y: number }[]; water?: string };
  /** scrolling strip of every place a customer can order (own = theirs) */
  doors?: { names: string[]; own: string; caption: string };
  /** strip of quick facts under the hero */
  facts: { value: string; label: string }[];
  findings: BriefFinding[];
  calculator: {
    /** current reseller fee on own-site orders, percent */
    resellerPct: number;
    /** typical delivery-app commission, percent */
    appPct: number;
    note: string;
  };
  features: BriefFeature[];
  proof?: { text: string; url?: string; label?: string };
  promise: { title: string; points: string[] };
  steps: { title: string; body: string }[];
  contact: { email: string; name: string };
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
