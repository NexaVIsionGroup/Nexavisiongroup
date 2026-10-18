import type { Answers } from "./types";
import { getTemplate, personalize, totals, fmtMoney } from "./index";

// Admin-only "opportunities" read of a household-budget questionnaire.
// These are leads to check, not determinations: each says what to look into
// and why, based on the answers given so far.

export type FlagLevel = "urgent" | "opportunity" | "review" | "info";

export interface Flag {
  level: FlagLevel;
  title: string;
  detail: string;
  area: string;
}

const has = (a: Answers, id: string, ...vals: string[]) => {
  const v = a[id];
  if (Array.isArray(v)) return vals.some((x) => v.includes(x));
  return vals.includes(String(v ?? ""));
};
const amt = (a: Answers, id: string) => Number(a[id]?.a || 0);

export function analyze(answers: Answers, templateId = "household-budget"): Flag[] {
  const a = answers || {};
  const t = getTemplate(templateId);
  const tot = totals(t, a);
  const flags: Flag[] = [];
  const p2 = has(a, "p2_exists", "yes");
  const people = p2 ? ["p1", "p2"] : ["p1"];
  const owner = has(a, "home_status", "own_free", "own_mortgage", "reverse", "mobile_lot");
  const benefits: string[] = Array.isArray(a.benefits_now) ? a.benefits_now : [];

  // ── Cash flow ─────────────────────────────────────────────
  if (tot.income > 0 && tot.expenses > 0) {
    if (tot.gap < 0) {
      flags.push({ level: "urgent", area: "Cash flow", title: `Spending is ${fmtMoney(-tot.gap)}/mo more than income`, detail: `Income entered ${fmtMoney(tot.income)}/mo vs. spending ${fmtMoney(tot.expenses)}/mo. The shortfall is being covered by debt, skipped bills or going without.` });
    } else {
      flags.push({ level: "info", area: "Cash flow", title: `${fmtMoney(tot.gap)}/mo left after entered spending`, detail: "If they still run short, some spending is missing. Compare against bank statements." });
    }
  }
  if (has(a, "food_runout", "almost_every_month", "most_months")) {
    flags.push({ level: "urgent", area: "Food", title: "Food runs out most months", detail: "Immediate food help: SNAP (see below), local pantries, Meals on Wheels / senior dining through the Volusia aging services provider." });
  }

  // ── SNAP ──────────────────────────────────────────────────
  if (!has(a, "snap_status", "getting") && !benefits.includes("snap")) {
    const why = has(a, "snap_status", "denied", "used_to") ? ` They were ${a.snap_status === "denied" ? "denied" : "cut off"} before (${a.snap_when || "date/reason not given"}). Re-check with the elderly rules below; denials often miss the medical deduction.` : "";
    flags.push({ level: "opportunity", area: "SNAP", title: "Apply for SNAP (elderly household rules)", detail: "Households with someone 60+ only have to pass the net income test. Out-of-pocket medical costs over $35/mo are deductible and the shelter deduction isn't capped. Apply through Florida DCF MyACCESS." + why });
  } else if (amt(a, "snap_amount") > 0 && amt(a, "snap_amount") < 100) {
    flags.push({ level: "review", area: "SNAP", title: `SNAP amount looks low (${fmtMoney(amt(a, "snap_amount"))}/mo)`, detail: "Check whether medical expenses, property tax/insurance and the utility allowance were reported. Report changes to DCF to raise the benefit." });
  }

  // ── Medicare costs ────────────────────────────────────────
  for (const p of people) {
    const name = personalize(`{${p}}`, a);
    const partbPaid = has(a, `${p}_partb_taken`, "yes", "pay_myself");
    if (partbPaid && !has(a, `${p}_msp`, "yes") && !has(a, `${p}_medicaid`, "yes")) {
      flags.push({ level: "opportunity", area: "Medicare", title: `${name}: check Medicare Savings Program (QMB/SLMB/QI)`, detail: "If eligible, the state pays the Part B premium (about $200/mo in 2026), which goes straight back into the Social Security check. QMB also covers Medicare copays. Apply via DCF." });
    }
    const rxCost = (Array.isArray(a.meds) ? a.meds : []).filter((m: any) => (m.who || "p1") === p).reduce((s: number, m: any) => s + Number(m.cost?.a || 0), 0);
    if (!has(a, `${p}_extra_help`, "yes") && (rxCost > 0 || amt(a, `${p}_partd`) > 0 || has(a, `${p}_medicare`, "advantage"))) {
      flags.push({ level: "opportunity", area: "Medicare", title: `${name}: apply for Extra Help (LIS)`, detail: "Lowers Part D premiums, deductibles and drug copays to a few dollars. Apply at SSA (ssa.gov/extrahelp). Anyone on QMB/SLMB/Medicaid qualifies automatically." });
    }
    if (amt(a, `${p}_supp`) > 0 && has(a, `${p}_msp`, "yes")) {
      flags.push({ level: "review", area: "Medicare", title: `${name}: Medigap premium alongside QMB`, detail: "With QMB, a Medigap policy may be unnecessary. Review before canceling." });
    }
  }
  if (Array.isArray(a.skipped_care) && a.skipped_care.some((x: string) => x !== "none")) {
    flags.push({ level: "review", area: "Medical", title: "Putting off care because of cost", detail: `Skipped: ${a.skipped_care.filter((x: string) => x !== "none").join(", ").replace(/_/g, " ")}. Look at Advantage-plan extras (dental/vision/OTC), discount pharmacies and drug manufacturer programs.` });
  }

  // ── Housing ───────────────────────────────────────────────
  if (owner && !has(a, "homestead", "yes")) {
    flags.push({ level: "opportunity", area: "Property tax", title: "Confirm the Homestead Exemption", detail: "Look up the parcel on the Volusia County Property Appraiser site. Homestead takes up to $50,000 off the assessed value and caps yearly increases." });
  }
  if (owner && !has(a, "senior_exemption", "yes")) {
    flags.push({ level: "opportunity", area: "Property tax", title: "Check the senior (65+) low-income exemption", detail: "There's an extra exemption for homeowners 65+ under the yearly income limit. It has to be applied for with the Property Appraiser by March 1." });
  }
  const acRisk = has(a, "ac_age", "10_15_years", "over_15_years") || has(a, "ac_condition", "works_but_struggles_in_summer", "makes_noises_leaks", "broken_right_now");
  if (acRisk) {
    flags.push({ level: has(a, "ac_condition", "broken_right_now") ? "urgent" : "review", area: "Home", title: "A/C is at risk", detail: `Age: ${(a.ac_age || "unknown").replace(/_/g, " ")}, condition: ${(a.ac_condition || "unknown").replace(/_/g, " ")}. Look into the county home-repair and weatherization programs, utility-sponsored repair help, and a low-cost service visit to extend its life. Start an A/C sinking fund.` });
  }
  if (Array.isArray(a.repairs_needed) && a.repairs_needed.some((x: string) => x !== "nothing_right_now")) {
    flags.push({ level: "review", area: "Home", title: "Repairs needed", detail: a.repairs_needed.filter((x: string) => x !== "nothing_right_now").join(", ").replace(/_/g, " ") + (a.repairs_detail ? ` — ${a.repairs_detail}` : "") });
  }

  // ── Utilities ─────────────────────────────────────────────
  if (has(a, "utility_behind", "yes") || amt(a, "electric") > 200) {
    flags.push({ level: has(a, "utility_behind", "yes") ? "urgent" : "opportunity", area: "Utilities", title: "Electric bill help (LIHEAP)", detail: "LIHEAP helps pay the electric bill, with a separate crisis payment for shut-off notices. FPL and Duke also run hardship funds and budget billing. A free home energy check can lower summer bills." });
  }
  if (!has(a, "lifeline", "yes") && (amt(a, "cell") > 0 || amt(a, "internet") > 0)) {
    flags.push({ level: "opportunity", area: "Utilities", title: "Lifeline discount", detail: "If anyone is on SNAP, Medicaid, SSI or VA pension, they qualify for Lifeline ($9.25/mo off phone or internet, more on some plans). Also compare senior/prepaid phone plans." });
  }
  if (amt(a, "cable") > 0) {
    flags.push({ level: "review", area: "Utilities", title: `Cable/satellite at ${fmtMoney(amt(a, "cable"))}/mo`, detail: "Usually the easiest big cut. An antenna plus one streaming service, or a retention-department discount." });
  }

  // ── Debt & protection ─────────────────────────────────────
  const debts: any[] = Array.isArray(a.debts) ? a.debts : [];
  const highRate = debts.filter((d) => Number(d.rate) >= 20 || ["payday_title_loan", "buy_now_pay_later"].includes(d.kind));
  if (highRate.length) {
    flags.push({ level: "opportunity", area: "Debt", title: `${highRate.length} high-cost debt${highRate.length > 1 ? "s" : ""}`, detail: "Nonprofit credit counseling (NFCC member agency) can usually cut card interest to single digits on a debt management plan. Payday/title loans should be first to go." });
  }
  if (has(a, "collector_calls", "yes") || has(a, "garnish_threat", "yes") || debts.some((d) => ["in_collections"].includes(d.kind) || d.status === "stopped_paying")) {
    flags.push({ level: "urgent", area: "Debt", title: "Collections / garnishment threats", detail: "Private creditors generally can't garnish Social Security, and banks must protect 2 months of directly deposited benefits. Collectors often imply otherwise. Send debt-validation letters, and don't let them pull from the account. Medical debt: ask the hospital for financial assistance (charity care)." });
  }
  if (amt(a, "bank_fees") > 0) {
    flags.push({ level: "opportunity", area: "Debt", title: `Bank/overdraft fees ${fmtMoney(amt(a, "bank_fees"))}/mo`, detail: "Ask for a refund, turn off overdraft coverage, or move to a no-fee account." });
  }

  // ── Recurring charges & insurance ─────────────────────────
  const policies: any[] = Array.isArray(a.policies) ? a.policies : [];
  const dubious = policies.filter((p) => ["car_warranty", "cancer_accident_hospital", "identity_theft", "home_warranty"].includes(p.kind));
  if (dubious.length) {
    flags.push({ level: "review", area: "Insurance", title: `${dubious.length} ${dubious.length > 1 ? "policies" : "policy"} often not worth the cost`, detail: dubious.map((p) => `${String(p.kind).replace(/_/g, " ")} (${p.company || "?"}, ${p.premium?.a ? fmtMoney(Number(p.premium.a)) : "?"})`).join("; ") });
  }
  if (has(a, "unknown_charges", "yes", "not_sure")) {
    flags.push({ level: "review", area: "Subscriptions", title: "Unrecognized charges on statements", detail: "Go through the last 3 statements line by line. Common culprits are free trials that converted, old memberships and scam 'protection' plans." });
  }
  const subCats = tot.byCategory.find((c) => c.role === "expense" && c.category === "Subscriptions");
  if (subCats && subCats.amount > 40) {
    flags.push({ level: "review", area: "Subscriptions", title: `Subscriptions ${fmtMoney(subCats.amount)}/mo`, detail: "Rotate streaming (one at a time) and cancel anything unused." });
  }
  const giving = tot.byCategory.find((c) => c.role === "expense" && c.category === "Giving & family");
  if (giving && tot.gap < 0 && giving.amount > 0) {
    flags.push({ level: "review", area: "Giving", title: `Giving & family help ${fmtMoney(giving.amount)}/mo while short`, detail: "Sensitive. Talk it through gently. Check for mail or TV solicitations aimed at seniors." });
  }

  // ── Transportation ────────────────────────────────────────
  if (has(a, "truck_condition", "has_a_problem_now", "not_running")) {
    flags.push({ level: "urgent", area: "Truck", title: "Truck has a problem now", detail: a.truck_problems || "No details given yet." });
  }
  if (amt(a, "truck_ins") > 0) {
    flags.push({ level: "review", area: "Truck", title: "Shop the car insurance", detail: "On an older paid-off truck, check whether collision/comprehensive is still worth it, and ask about mature-driver course discounts (Florida requires a discount for drivers 55+ who complete an approved course)." });
  }

  // ── Veterans ──────────────────────────────────────────────
  if (people.some((p) => has(a, `${p}_veteran`, "yes")) && !(amt(a, "p1_va") > 0 || amt(a, "p2_va") > 0)) {
    flags.push({ level: "opportunity", area: "VA", title: "Veteran with no VA income", detail: "Check the VA pension (with Aid & Attendance), VA health care and the property-tax exemptions for veterans. A Volusia County Veterans Service Officer helps for free." });
  }

  const order: Record<FlagLevel, number> = { urgent: 0, opportunity: 1, review: 2, info: 3 };
  return flags.sort((x, y) => order[x.level] - order[y.level]);
}
