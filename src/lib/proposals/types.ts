// Shared by the admin editor, the customer page and the server. No server-only imports here.

export type CompareRow = { source: string; value: string; odd?: boolean };
export type BarRow = { label: string; value: number; note?: string };
export type Finding = {
  title: string;
  detail: string;
  image?: string;
  // ── optional "rich" fields, used by the animated chaptered layout ──
  /** big number or word on the card, e.g. "$63.5K" or "765" */
  stat?: string;
  statLabel?: string;
  tone?: "warn" | "money" | "info" | "good";
  /** extra paragraphs after `detail` */
  body?: string[];
  /** what we'd do about it */
  fix?: string;
  /** side-by-side values that should agree but don't (shown when there's no image) */
  compare?: CompareRow[];
  /** animated dollar bars (shown when there's no image or compare) */
  bars?: BarRow[];
  caption?: string;
  /** how we know, and what is an estimate */
  source?: string;
};
export type WorkArea = { area: string; detail?: string; items: string[] };
export type Milestone = { label: string; when: string; note?: string };
export type RampStep = { label: string; monthly: number };
export type ProposalPackage = {
  id: string;
  name: string;
  description?: string;
  /** one-time price in dollars */
  price: number;
  /** monthly price in dollars (the steady-state price once any `ramp` ends) */
  monthly: number;
  includes: string[];
  recommended?: boolean;
  /** monthly price steps that come before `monthly`, e.g. months 1–3 */
  ramp?: RampStep[];
  /** a share on top, e.g. 3.5% of orders through the site we build */
  percent?: { rate: number; of: string };
  /** label for the one-time price, default "Setup" */
  setupLabel?: string;
  /** label for the steady monthly price tile, default "After that" (with a ramp) or "Monthly" */
  monthlyLabel?: string;
  /** plain-English rule for when the ramp ends, e.g. once measured momentum is clear */
  rampNote?: string;
};
export type AutopayOffer = { offer: boolean; recommended?: boolean; title?: string; text?: string };
export type PaymentTerms = {
  /** "none" skips the payment step entirely. */
  mode: "none" | "fixed" | "percent";
  value: number;
  /** 4% card surcharge on the amount due at signing */
  surcharge: boolean;
  /** Plain-English note about later payments */
  notes?: string;
  /** optional "set up automatic monthly billing" choice the customer makes at signing */
  autopay?: AutopayOffer;
  /** optional at-a-glance list of when each charge happens, shown under the amount due */
  schedule?: { when: string; amount: number; note?: string }[];
};
export type Term = { title: string; text: string };
export type Feature = { icon?: string; image?: string; title: string; body: string };
export type HeroBlock = { image?: string; seamImage?: string; eyebrow?: string; headline?: string; accent?: string; lead?: string; place?: string };
export type Comparison = { heading?: string; rows: { label: string; today: string; after: string }[] };
export type ProposalContent = {
  intro: string;
  findings: Finding[];
  goals: string[];
  work: WorkArea[];
  timeline: Milestone[];
  packages: ProposalPackage[];
  payment: PaymentTerms;
  terms: Term[];
  // ── optional "rich" sections ──
  hero?: HeroBlock;
  /** strip of quick facts under the hero */
  facts?: { value: string; label: string }[];
  /** what's going well, same shape as findings, rendered as good news */
  strengths?: Finding[];
  /** what we'll build, as image cards */
  features?: Feature[];
  /** today vs. with us, in plain statements */
  comparison?: Comparison;
  closing?: { headline?: string; lead?: string };
  /** one-screen version at /project/<token>/short for people who won't read the whole page; price comes from the package */
  summary?: Summary;
  /** where the short link (/go/<code>) lands before signing: the full proposal (default), the one-screen summary, or the agreement page */
  entry?: "full" | "short" | "sign";
};
export type Summary = {
  headline: string;
  lead?: string;
  /** what it costs them today, as big numbers */
  today: { value: string; label: string }[];
  /** what changes with us, one line each */
  changes: string[];
  /** one proof line, e.g. a similar customer's result */
  proof?: string;
};

export const BUSINESS_NAME = "NexaVision Group";
export const CATEGORY = "Managed Digital Operations";
// The brand line. Keep this wording exact everywhere.
export const MOTTO = "Empowering Your Digital Ecosystem.";
export const CATCHPHRASE = "We build it. We run it. You run your business.";
export const ONE_LINER = "We're your outsourced tech and marketing department.";

export const DIVISIONS = ["Restaurants", "Contractors & Home Services", "Automotive", "Other"] as const;

const SHARED = ["Website", "Custom Admin App", "Google Business Profile", "Marketing", "Graphic Design & Logos"];
export const WORK_CATALOG: Record<string, string[]> = {
  Restaurants: [...SHARED, "Menu Management", "Menu Pricing", "DoorDash", "Uber Eats", "Clover & POS"],
  "Contractors & Home Services": [...SHARED, "Estimates & Jobs", "Employee Management", "Vehicle Tracking"],
  Automotive: [...SHARED, "Inventory", "Online Booking", "Employee Management", "Vehicle Tracking"],
  Other: [...SHARED, "Employee Management", "Vehicle Tracking"],
};

export const DEFAULT_TERMS: Term[] = [
  { title: "Who this agreement is between", text: `This agreement is between ${BUSINESS_NAME} ("we") and the business named on this proposal ("you"). It covers the work and prices shown above. Anything not listed is outside this agreement until we both approve it in writing.` },
  { title: "Payment", text: "You agree to pay the amounts shown above when they are due. Monthly services are billed each month in advance. If a payment is more than 15 days late, we may pause work until it is paid." },
  { title: "Monthly services and cancelling", text: "Monthly services continue month to month. Either of us can cancel with 30 days written notice. Fees already paid for work completed are not refundable." },
  { title: "Changes", text: "If you want something added or changed, we will tell you the cost and timing first, and you approve it in writing before we start." },
  { title: "What we need from you", text: "Our timeline depends on getting logins, photos, approvals and answers from you. You confirm you have the right to give us access to your accounts and to use the content you send us." },
  { title: "Who owns what", text: "Once the work is paid in full, you own your website content, logos and designs we create for you, and any domain or account in your business's name. We keep ownership of our general tools and reusable code, and you may keep using them in your business while our services are active." },
  { title: "Other companies' services", text: "Google, DoorDash, Uber Eats, Clover and similar companies set their own rules, fees and outages. Their charges are yours to pay unless this proposal says otherwise, and we are not responsible for what they do." },
  { title: "Results", text: "We will do careful, professional work, but we cannot promise a specific ranking, sales figure or number of customers. Any pricing or menu advice is a suggestion, and the final decision is yours." },
  { title: "Limit of responsibility", text: "To the extent the law allows, our total responsibility under this agreement is limited to what you paid us in the 12 months before the claim, and neither of us is responsible for indirect or lost-profit damages." },
  { title: "Signing electronically", text: "You agree to do business and sign electronically. Your electronic signature is as binding as one on paper, and you can ask us for a paper copy at any time." },
];

export const blankContent = (): ProposalContent => ({
  intro: "",
  findings: [],
  goals: [],
  work: [],
  timeline: [],
  packages: [],
  payment: { mode: "none", value: 0, surcharge: false, notes: "" },
  terms: DEFAULT_TERMS.map((t) => ({ ...t })),
});

/** Fills gaps so old or partial rows never crash a page. */
export function normalizeContent(c: Partial<ProposalContent> | null | undefined): ProposalContent {
  const b = blankContent();
  const out: ProposalContent = {
    intro: c?.intro ?? b.intro,
    findings: c?.findings ?? [],
    goals: c?.goals ?? [],
    work: c?.work ?? [],
    timeline: c?.timeline ?? [],
    packages: c?.packages ?? [],
    payment: { ...b.payment, ...(c?.payment || {}) },
    terms: c?.terms?.length ? c.terms : b.terms,
  };
  // Rich sections ride along only when present, so plain proposals stay exactly as they were.
  if (c?.hero) out.hero = c.hero;
  if (c?.facts?.length) out.facts = c.facts;
  if (c?.strengths?.length) out.strengths = c.strengths;
  if (c?.features?.length) out.features = c.features;
  if (c?.comparison?.rows?.length) out.comparison = c.comparison;
  if (c?.closing) out.closing = c.closing;
  if (c?.summary?.headline) out.summary = c.summary;
  if (c?.entry && c.entry !== "full") out.entry = c.entry;
  return out;
}

/** True when the proposal carries the animated, chaptered layout. */
export const isRich = (c: ProposalContent) =>
  !!(c.hero || c.facts?.length || c.features?.length || c.findings.some((f) => f.stat || f.bars || f.compare));

/** Monthly price for the first billing period (the first ramp step, or the steady price). */
export const firstMonthly = (p: ProposalPackage) => (p.ramp?.length ? Number(p.ramp[0].monthly) || 0 : Number(p.monthly) || 0);

export const money = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2 });

export function defaultPackage(c: ProposalContent): ProposalPackage | null {
  return c.packages.find((p) => p.recommended) || c.packages[0] || null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** What's owed at signing, before any card surcharge. */
export function dueAtSigning(c: ProposalContent, pkg: ProposalPackage | null): number {
  const { mode, value } = c.payment;
  if (mode === "fixed") return round2(Math.max(0, Number(value) || 0));
  if (mode === "percent" && pkg) {
    const base = Number(pkg.price) > 0 ? Number(pkg.price) : Number(pkg.monthly) || 0;
    return round2((base * Math.max(0, Number(value) || 0)) / 100);
  }
  return 0;
}

export const surchargeOn = (c: ProposalContent, due: number) => (c.payment.surcharge ? round2(due * 0.04) : 0);

export type PublicProposal = {
  number: string;
  title: string;
  status: string;
  division: string | null;
  client_name: string | null;
  client_company: string | null;
  client_email: string | null;
  content: ProposalContent;
  sent_at: string | null;
  expires_at: string | null;
  updated_at: string;
  /** fingerprint of the signable content; sent back when signing */
  version: string;
  signed_at: string | null;
  signed_name: string | null;
  signed_title: string | null;
  signature_data: string | null;
  signed_hash: string | null;
  selected_package_id: string | null;
  due_amount: number | null;
  paid_at: string | null;
  /** the customer's automatic-billing choice at signing; null when it wasn't offered or not signed yet */
  autopay_opt_in: boolean | null;
};
