import type { Field, Option, Section, Template, MoneyField, Freq } from "./types";

// Household Budget & Benefits Check-up
// Built for retired households: every money question can be skipped, any
// amount can be entered weekly/monthly/yearly, and "{p1}" / "{p2}" in labels
// are replaced with the names entered on the first page.

const money = (
  id: string,
  label: string,
  role: MoneyField["role"],
  category: string,
  extra: Partial<MoneyField> = {}
): MoneyField => ({ type: "money", id, label, role, category, ...extra });

const exp = (id: string, label: string, category: string, extra: Partial<MoneyField> = {}) =>
  money(id, label, "expense", category, extra);
const inc = (id: string, label: string, category: string, extra: Partial<MoneyField> = {}) =>
  money(id, label, "income", category, extra);

const ynu = (id: string, label: string, help?: string, showIf?: Field["showIf"]): Field => ({
  type: "yesno",
  id,
  label,
  help,
  showIf,
});

const opts = (...labels: string[]): Option[] =>
  labels.map((l) => ({ value: l.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), label: l }));

const AGE_RANGES = opts("Under 5 years", "5–10 years", "10–15 years", "Over 15 years", "Not sure");
const SURE = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

const P2 = { field: "p2_exists", in: ["yes"] };

function incomeFor(p: "p1" | "p2"): Field[] {
  const who = `{${p}}`;
  return [
    {
      type: "info",
      id: `${p}_inc_note`,
      label: `Money that comes in for ${who}. Use the amount that actually lands in the bank. If you don't know an amount, skip it.`,
      tone: "tip",
    },
    inc(`${p}_ss`, "Social Security check", "Social Security", {
      help: "The deposit amount after Medicare is taken out. Your yearly benefit letter shows both numbers.",
    }),
    {
      type: "choice",
      id: `${p}_ss_day`,
      label: "When does the Social Security deposit arrive?",
      dropdown: true,
      options: opts(
        "The 3rd of the month",
        "2nd Wednesday",
        "3rd Wednesday",
        "4th Wednesday",
        "1st of the month (SSI)",
        "Not sure"
      ),
      showIf: { field: `${p}_ss`, notIn: [""] },
    },
    inc(`${p}_pension`, "Pension", "Pension"),
    { type: "text", id: `${p}_pension_from`, label: "Who pays the pension?", placeholder: "Former employer, union, military…", showIf: { field: `${p}_pension`, notIn: [""] } },
    inc(`${p}_va`, "VA benefits", "VA"),
    inc(`${p}_ssi`, "SSI (Supplemental Security Income)", "SSI"),
    inc(`${p}_retire`, "Money taken out of an IRA, 401(k) or annuity", "Retirement withdrawals"),
    inc(`${p}_work`, "Pay from any work (part-time, side jobs, cash work)", "Work"),
    {
      type: "list",
      id: `${p}_other_inc`,
      label: "Any other money coming in for " + who + "?",
      itemLabel: "Income",
      addLabel: "Add other income",
      columns: [
        { type: "text", id: "source", label: "Where it comes from", width: "lg" },
        inc("amount", "Amount", "Other income"),
      ],
    },
  ];
}

function medicalFor(p: "p1" | "p2"): Field[] {
  return [
    {
      type: "choice",
      id: `${p}_medicare`,
      label: `What kind of health coverage does {${p}} have?`,
      options: [
        { value: "original", label: "Original Medicare (red, white & blue card)" },
        { value: "advantage", label: "A Medicare Advantage plan", hint: "Humana, UnitedHealthcare, Aetna, Florida Blue, etc." },
        { value: "medicaid_only", label: "Medicaid only" },
        { value: "employer", label: "Retiree / employer insurance" },
        { value: "none", label: "No coverage" },
        { value: "not_sure", label: "Not sure" },
      ],
    },
    { type: "text", id: `${p}_plan_name`, label: "Plan name (from the insurance card)", placeholder: "e.g. Humana Gold Plus", showIf: { field: `${p}_medicare`, in: ["advantage", "employer"] } },
    {
      type: "choice",
      id: `${p}_partb_taken`,
      label: "Is the Medicare Part B premium taken out of the Social Security check?",
      help: "For most people in 2026 it's about $200 a month. If the state pays it, it isn't taken out.",
      options: [
        { value: "yes", label: "Yes, it's taken out" },
        { value: "state_pays", label: "No, the state / Medicaid pays it" },
        { value: "pay_myself", label: "No, I pay it myself" },
        { value: "not_sure", label: "Not sure" },
      ],
      showIf: { field: `${p}_medicare`, in: ["original", "advantage", "not_sure"] },
    },
    exp(`${p}_partb_self`, "Part B premium you pay yourself", "Medical", { showIf: { field: `${p}_partb_taken`, in: ["pay_myself"] } }),
    exp(`${p}_supp`, "Medicare Supplement (Medigap) premium", "Medical", {
      help: "Only if you pay one. Leave it blank if not.",
      showIf: { field: `${p}_medicare`, in: ["original", "not_sure"] },
    }),
    exp(`${p}_partd`, "Drug plan (Part D) premium", "Medical", { showIf: { field: `${p}_medicare`, in: ["original", "not_sure"] } }),
    exp(`${p}_plan_premium`, "Monthly premium for the plan (if any)", "Medical", { showIf: { field: `${p}_medicare`, in: ["advantage", "employer"] } }),
    { type: "choice", id: `${p}_medicaid`, label: "Does {" + p + "} have Medicaid?", options: SURE },
    {
      type: "choice",
      id: `${p}_msp`,
      label: "Is {" + p + "} on a Medicare Savings Program (QMB / SLMB)?",
      help: "These state programs pay the Part B premium and sometimes copays.",
      options: SURE,
    },
    {
      type: "choice",
      id: `${p}_extra_help`,
      label: "Does {" + p + "} get “Extra Help” for prescriptions?",
      help: "A Social Security program that lowers drug costs. Also called the Low-Income Subsidy.",
      options: SURE,
    },
  ];
}

const sections: Section[] = [
  {
    id: "household",
    title: "About your household",
    short: "Household",
    icon: "Home",
    intro: "Let's start with the basics. You can change any answer later.",
    fields: [
      { type: "text", id: "p1_first", label: "Your first name", width: "md" },
      { type: "text", id: "p1_last", label: "Last name", width: "md" },
      { type: "number", id: "p1_age", label: "Age", width: "sm" },
      { type: "yesno", id: "p2_exists", label: "Does a second person share the bills with you (spouse or partner)?", unsure: false },
      { type: "text", id: "p2_first", label: "Their first name", width: "md", showIf: P2 },
      { type: "text", id: "p2_last", label: "Last name", width: "md", showIf: P2 },
      { type: "number", id: "p2_age", label: "Age", width: "sm", showIf: P2 },
      {
        type: "choice",
        id: "relationship",
        label: "How are you two related?",
        options: opts("Married", "Partners", "Family", "Friends / roommates"),
        showIf: P2,
      },
      { type: "phone", id: "phone", label: "Best phone number" },
      { type: "email", id: "email", label: "Email (optional)" },
      {
        type: "choice",
        id: "contact_pref",
        label: "Best way to reach you?",
        options: opts("Phone call", "Text message", "Email"),
      },
      { type: "text", id: "contact_time", label: "Best time of day to reach you", placeholder: "e.g. weekday mornings" },
      { type: "text", id: "address", label: "Home address", width: "lg" },
      { type: "yesno", id: "others_home", label: "Does anyone else live in the home?", unsure: false },
      { type: "textarea", id: "others_home_who", label: "Who? Do they help with bills or food?", showIf: { field: "others_home", in: ["yes"] } },
      { type: "choice", id: "p1_veteran", label: "Is {p1} a veteran?", options: opts("Yes", "No") },
      { type: "choice", id: "p2_veteran", label: "Is {p2} a veteran (or a surviving spouse of one)?", options: opts("Yes", "No"), showIf: P2 },
    ],
  },
  {
    id: "income_p1",
    title: "Money coming in: {p1}",
    short: "Income · {p1}",
    icon: "Wallet",
    fields: incomeFor("p1"),
  },
  {
    id: "income_p2",
    title: "Money coming in: {p2}",
    short: "Income · {p2}",
    icon: "Wallet",
    showIf: P2,
    fields: incomeFor("p2"),
  },
  {
    id: "income_house",
    title: "Other household money",
    short: "Other income",
    icon: "HandCoins",
    fields: [
      inc("family_help", "Regular help from family or friends", "Family help"),
      inc("rental_inc", "Rent from a tenant or rental property", "Rental"),
      inc("snap_amount", "Food stamps (SNAP / EBT) you get now", "SNAP", { help: "Leave blank if you don't get SNAP right now." }),
      inc("tax_refund", "Yearly tax refund", "Tax refund", { freq: "yearly" }),
      {
        type: "choice",
        id: "income_steady",
        label: "Is the money coming in about the same every month?",
        options: opts("Yes, same every month", "It changes a little", "It changes a lot"),
      },
      {
        type: "choice",
        id: "short_days",
        label: "How many days before the next check do you usually run low on money?",
        options: opts("We don't run low", "A few days", "About a week", "Two weeks or more"),
      },
    ],
  },
  {
    id: "housing",
    title: "Your home",
    short: "Home",
    icon: "House",
    fields: [
      {
        type: "choice",
        id: "home_status",
        label: "Do you own or rent your home?",
        options: [
          { value: "own_free", label: "Own it, paid off" },
          { value: "own_mortgage", label: "Own it, still paying a mortgage" },
          { value: "reverse", label: "Own it, with a reverse mortgage" },
          { value: "rent", label: "Rent" },
          { value: "mobile_lot", label: "Own a mobile home, rent the lot" },
          { value: "family", label: "Live with family" },
        ],
      },
      exp("mortgage", "Mortgage payment", "Housing", { showIf: { field: "home_status", in: ["own_mortgage"] } }),
      {
        type: "multi",
        id: "escrow",
        label: "Does the mortgage payment already include…",
        options: [
          { value: "taxes", label: "Property taxes" },
          { value: "insurance", label: "Homeowners insurance" },
          { value: "neither", label: "Neither" },
          { value: "not_sure", label: "Not sure" },
        ],
        showIf: { field: "home_status", in: ["own_mortgage"] },
      },
      exp("mortgage_owed", "About how much is still owed on the mortgage?", "Housing", {
        role: "debt",
        recurring: false,
        showIf: { field: "home_status", in: ["own_mortgage"] },
      }),
      exp("rent", "Rent", "Housing", { showIf: { field: "home_status", in: ["rent"] } }),
      exp("lot_rent", "Lot rent", "Housing", { showIf: { field: "home_status", in: ["mobile_lot"] } }),
      exp("family_rent", "What you pay toward the household", "Housing", { showIf: { field: "home_status", in: ["family"] } }),
      exp("property_tax", "Property taxes (if you pay them yourself)", "Housing", {
        freq: "yearly",
        help: "The yearly bill from the Volusia County Tax Collector.",
        showIf: { field: "home_status", in: ["own_free", "own_mortgage", "reverse", "mobile_lot"] },
      }),
      exp("home_ins", "Homeowners insurance (if you pay it yourself)", "Housing", {
        freq: "yearly",
        showIf: { field: "home_status", in: ["own_free", "own_mortgage", "reverse", "mobile_lot"] },
      }),
      { type: "text", id: "home_ins_co", label: "Insurance company", showIf: { field: "home_status", in: ["own_free", "own_mortgage", "reverse", "mobile_lot"] } },
      exp("renters_ins", "Renters insurance", "Housing", { showIf: { field: "home_status", in: ["rent"] } }),
      exp("flood_ins", "Flood insurance", "Housing", { freq: "yearly" }),
      exp("hoa", "HOA or community fees", "Housing"),
      {
        type: "choice",
        id: "homestead",
        label: "Do you have the Florida Homestead Exemption on your property taxes?",
        options: SURE,
        showIf: { field: "home_status", in: ["own_free", "own_mortgage", "reverse", "mobile_lot"] },
      },
      {
        type: "choice",
        id: "senior_exemption",
        label: "Do you have the extra Senior (65+) exemption too?",
        help: "Volusia County gives an extra exemption to homeowners 65+ with limited income. You have to apply for it.",
        options: SURE,
        showIf: { field: "home_status", in: ["own_free", "own_mortgage", "reverse", "mobile_lot"] },
      },
      { type: "info", id: "home_cond_note", label: "Now a few questions about the home itself. This helps us plan ahead for big repairs.", tone: "note" },
      { type: "choice", id: "ac_age", label: "How old is the air conditioner?", options: AGE_RANGES },
      {
        type: "choice",
        id: "ac_condition",
        label: "How is the A/C working?",
        options: opts("Works well", "Works, but struggles in summer", "Makes noises / leaks", "Broken right now"),
      },
      { type: "choice", id: "ac_serviced", label: "When was the A/C last serviced?", options: opts("This year", "1–2 years ago", "Longer ago", "Never / not sure") },
      { type: "choice", id: "roof_age", label: "How old is the roof?", options: AGE_RANGES },
      { type: "choice", id: "water_heater_age", label: "How old is the water heater?", options: AGE_RANGES },
      {
        type: "multi",
        id: "repairs_needed",
        label: "Does anything in the home need fixing now?",
        options: opts("Air conditioning", "Roof / leaks", "Plumbing", "Electrical", "Water heater", "Appliances", "Windows / doors", "Floors / trip hazards", "Grab bars / safety", "Nothing right now"),
      },
      { type: "textarea", id: "repairs_detail", label: "Tell us about the repairs (and any prices you've been quoted)", showIf: { field: "repairs_needed", notIn: ["", "nothing_right_now"] } },
    ],
  },
  {
    id: "utilities",
    title: "Utilities & phone",
    short: "Utilities",
    icon: "Zap",
    fields: [
      { type: "choice", id: "electric_co", label: "Electric company", options: opts("FPL", "Duke Energy", "Other") },
      exp("electric", "Electric bill (a normal month)", "Utilities"),
      money("electric_high", "Highest electric bill in summer", undefined, "Utilities", { recurring: false, help: "Just to see how high it gets. This isn't added to your totals." }),
      { type: "yesno", id: "electric_budget", label: "Are you on the electric company's Budget Billing (same amount every month)?" },
      exp("water", "Water & sewer", "Utilities", { help: "City of Deltona Utilities, usually billed every month." }),
      exp("trash", "Trash pickup (if billed separately)", "Utilities"),
      exp("gas", "Gas or propane", "Utilities"),
      { type: "text", id: "cell_carrier", label: "Cell phone company", placeholder: "Verizon, T-Mobile, Straight Talk, Consumer Cellular…" },
      { type: "number", id: "cell_lines", label: "How many phone lines are on the bill?", width: "sm" },
      exp("cell", "Cell phone bill (total)", "Utilities"),
      exp("landline", "Home phone (landline)", "Utilities"),
      { type: "text", id: "internet_co", label: "Internet company", placeholder: "Spectrum, AT&T, none…" },
      exp("internet", "Internet", "Utilities"),
      exp("cable", "Cable or satellite TV", "Utilities", { help: "Spectrum TV, DirecTV, Dish. Streaming apps come later." }),
      { type: "yesno", id: "lifeline", label: "Do you get a Lifeline discount on your phone or internet?" },
      { type: "yesno", id: "utility_behind", label: "Are you behind on any utility bill, or have you gotten a shut-off notice?", unsure: false },
      { type: "textarea", id: "utility_behind_detail", label: "Which bill and about how much is owed?", showIf: { field: "utility_behind", in: ["yes"] } },
    ],
  },
  {
    id: "food",
    title: "Food & groceries",
    short: "Food",
    icon: "ShoppingCart",
    intro: "Food comes first. These answers help us find ways to stretch the grocery money and get you every benefit you qualify for.",
    fields: [
      exp("groceries", "Groceries", "Food", { freq: "weekly", help: "Your best guess is fine. You can enter it weekly or monthly." }),
      exp("eating_out", "Eating out, fast food, coffee", "Food", { freq: "weekly" }),
      exp("household_supplies", "Paper towels, toilet paper, cleaning & laundry supplies", "Food"),
      {
        type: "multi",
        id: "stores",
        label: "Where do you usually shop?",
        options: opts("Walmart", "Publix", "Aldi", "Winn-Dixie", "Save A Lot", "Dollar General / Family Dollar", "Sam's Club / Costco", "Other"),
      },
      {
        type: "choice",
        id: "food_runout",
        label: "How often does the food run out before there's money to buy more?",
        options: opts("Almost every month", "Most months", "Sometimes", "Rarely or never"),
      },
      {
        type: "choice",
        id: "snap_status",
        label: "Food stamps (SNAP)",
        options: [
          { value: "getting", label: "We get SNAP now" },
          { value: "never_applied", label: "Never applied" },
          { value: "denied", label: "Applied and were denied" },
          { value: "waiting", label: "Applied, still waiting" },
          { value: "used_to", label: "Used to get it, it stopped" },
        ],
      },
      { type: "text", id: "snap_when", label: "About when was that, and what reason did they give?", showIf: { field: "snap_status", in: ["denied", "used_to"] } },
      { type: "yesno", id: "pantry", label: "Do you ever use a food pantry or church food program?" },
      { type: "yesno", id: "meals_wheels", label: "Do you get Meals on Wheels or senior center meals?" },
      {
        type: "multi",
        id: "diet",
        label: "Any special food needs? (optional)",
        options: opts("Diabetic-friendly", "Low salt", "Soft foods", "Heart healthy", "None"),
      },
    ],
  },
  {
    id: "transport",
    title: "Your truck & getting around",
    short: "Truck",
    icon: "Truck",
    fields: [
      { type: "number", id: "truck_year", label: "Year", width: "sm", placeholder: "2008" },
      { type: "text", id: "truck_make", label: "Make & model", width: "md", placeholder: "Ford F-150" },
      { type: "number", id: "truck_miles", label: "About how many miles?", width: "md", suffix: "miles" },
      {
        type: "choice",
        id: "truck_condition",
        label: "How is it running?",
        options: opts("Runs great", "Runs OK, needs some work", "Has a problem now", "Not running"),
      },
      { type: "textarea", id: "truck_problems", label: "Anything wrong with it, or any warning lights?", placeholder: "Brakes squeal, A/C doesn't blow cold, check-engine light…" },
      { type: "text", id: "truck_ins_co", label: "Car insurance company" },
      exp("truck_ins", "Car insurance", "Transportation", { freq: "semiannual" }),
      exp("gas_fuel", "Gas for the truck", "Transportation", { freq: "weekly" }),
      exp("truck_tag", "Tag / registration", "Transportation", { freq: "yearly" }),
      exp("truck_maint", "Oil changes, tires & repairs (a normal year)", "Transportation", { freq: "yearly" }),
      { type: "yesno", id: "roadside", label: "Do you have roadside help (AAA or through your insurance)?" },
      {
        type: "multi",
        id: "other_rides",
        label: "If the truck breaks down, how would you get around?",
        options: opts("Family or friends", "Votran bus", "Votran Gold (door-to-door)", "Uber / taxi", "Medical ride from my health plan", "No other way"),
      },
    ],
  },
  {
    id: "medical_p1",
    title: "Health coverage: {p1}",
    short: "Health · {p1}",
    icon: "HeartPulse",
    intro: "This is about costs, not your private health details. Insurance cards and the yearly Social Security letter have most of these answers.",
    fields: medicalFor("p1"),
  },
  {
    id: "medical_p2",
    title: "Health coverage: {p2}",
    short: "Health · {p2}",
    icon: "HeartPulse",
    showIf: P2,
    fields: medicalFor("p2"),
  },
  {
    id: "medical_costs",
    title: "Medicine & doctor costs",
    short: "Medical costs",
    icon: "Pill",
    fields: [
      {
        type: "list",
        id: "meds",
        label: "Prescriptions you pay for",
        help: "Add each medicine you pay something for. The name is optional, but it helps us look for cheaper options.",
        itemLabel: "Prescription",
        addLabel: "Add a prescription",
        columns: [
          { type: "text", id: "name", label: "Medicine (optional)", width: "md" },
          { type: "choice", id: "who", label: "For", dropdown: true, options: [{ value: "p1", label: "{p1}" }, { value: "p2", label: "{p2}" }] },
          { type: "text", id: "pharmacy", label: "Pharmacy", width: "md", placeholder: "Walgreens, CVS, mail order…" },
          exp("cost", "Your cost", "Medical"),
        ],
      },
      exp("copays", "Doctor & specialist copays", "Medical"),
      exp("dental", "Dentist", "Medical", { freq: "yearly" }),
      exp("vision_hearing", "Glasses & hearing aids (batteries, repairs)", "Medical", { freq: "yearly" }),
      exp("med_supplies", "Medical supplies (test strips, braces, over-the-counter)", "Medical"),
      {
        type: "multi",
        id: "skipped_care",
        label: "Has anyone put off any of these because of cost?",
        options: opts("Prescriptions", "Dentist", "Glasses", "Hearing aids", "Doctor visits", "None"),
      },
    ],
  },
  {
    id: "insurance",
    title: "Other insurance & plans",
    short: "Insurance",
    icon: "ShieldCheck",
    intro: "Many retired households pay for policies they've forgotten about or don't need. List anything you pay for.",
    fields: [
      {
        type: "list",
        id: "policies",
        label: "Insurance policies & protection plans",
        itemLabel: "Policy",
        addLabel: "Add a policy",
        columns: [
          {
            type: "choice",
            id: "kind",
            label: "Type",
            dropdown: true,
            options: opts("Life insurance", "Burial / funeral", "Cancer / accident / hospital", "Dental plan", "Home warranty", "Car warranty", "Identity theft", "Medical alert button", "Other"),
          },
          { type: "text", id: "company", label: "Company", width: "md" },
          exp("premium", "Cost", "Insurance & plans"),
        ],
      },
      { type: "textarea", id: "policies_unsure", label: "Any charges or letters about policies you're not sure about?" },
    ],
  },
  {
    id: "debts",
    title: "Money owed & credit",
    short: "Debts",
    icon: "CreditCard",
    intro: "No judgment here. Lots of people end up in debt just covering the basics. We need the full picture to find a way out.",
    fields: [
      { type: "info", id: "debt_privacy", label: "Don't type full card or account numbers. The company name and the amounts are enough.", tone: "privacy" },
      {
        type: "list",
        id: "debts",
        label: "Credit cards, loans & bills you owe",
        itemLabel: "Debt",
        addLabel: "Add something you owe",
        columns: [
          { type: "text", id: "lender", label: "Who it's owed to", width: "md", placeholder: "Capital One, hospital, Mom…" },
          {
            type: "choice",
            id: "kind",
            label: "Type",
            dropdown: true,
            options: opts("Credit card", "Store card", "Medical bill", "Personal loan", "Payday / title loan", "Buy now, pay later", "Car loan", "Family / friend", "Back taxes", "In collections", "Other"),
          },
          money("balance", "Total owed", "debt", "Debt", { recurring: false }),
          exp("payment", "Payment", "Debt payments"),
          { type: "number", id: "rate", label: "Interest %", width: "sm", suffix: "%" },
          { type: "choice", id: "status", label: "Status", dropdown: true, options: opts("Paying on time", "Behind", "Only paying minimum", "Stopped paying", "Not sure") },
        ],
      },
      { type: "yesno", id: "collector_calls", label: "Are debt collectors calling or sending letters?", unsure: false },
      { type: "yesno", id: "garnish_threat", label: "Has anyone threatened to sue you or take money from your bank account or check?", unsure: false },
      { type: "yesno", id: "cosigned", label: "Did you co-sign a loan for anyone?", unsure: false },
      {
        type: "choice",
        id: "credit_score",
        label: "Do you know your credit score?",
        options: opts("Over 700", "600–700", "500–600", "Under 500", "Don't know"),
      },
      exp("bank_fees", "Bank fees or overdraft fees", "Debt payments", { help: "Look at a bank statement if you can. These add up fast." }),
    ],
  },
  {
    id: "recurring",
    title: "Subscriptions & automatic charges",
    short: "Subscriptions",
    icon: "Repeat",
    fields: [
      {
        type: "multi",
        id: "subs_check",
        label: "Check anything you pay for:",
        options: opts("Netflix", "Hulu", "Disney+", "Amazon Prime", "Paramount+ / Peacock", "YouTube TV / Sling", "SiriusXM", "Newspaper / magazines", "AARP or club memberships", "Sam's / Costco membership", "Home security monitoring", "Cloud storage / apps", "Gym", "Pest control", "Lawn service"),
      },
      {
        type: "list",
        id: "subs",
        label: "What does each one cost?",
        help: "Add one row for each charge you checked above, plus anything else that comes out automatically.",
        itemLabel: "Charge",
        addLabel: "Add a charge",
        columns: [
          { type: "text", id: "name", label: "What it is", width: "lg" },
          exp("cost", "Cost", "Subscriptions"),
        ],
      },
      { type: "yesno", id: "unknown_charges", label: "Are there charges on your bank statement you don't recognize?" },
    ],
  },
  {
    id: "spending",
    title: "Everyday spending",
    short: "Everyday",
    icon: "Receipt",
    intro: "Rough guesses are fine. This is the money that goes out a little at a time.",
    fields: [
      exp("personal_care", "Haircuts, toiletries & personal care", "Personal"),
      exp("clothing", "Clothing & shoes", "Personal", { freq: "yearly" }),
      exp("pets", "Pet food & vet", "Personal"),
      exp("tobacco", "Cigarettes, cigars or vaping", "Personal", { freq: "weekly" }),
      exp("fun", "Hobbies, outings & entertainment", "Personal"),
      exp("games", "Lottery, bingo or games", "Personal", { freq: "weekly" }),
      exp("church", "Church tithe & donations", "Giving & family", { help: "Include TV, radio or mail-in charity donations." }),
      exp("help_family", "Money given to family (kids, grandkids)", "Giving & family"),
      exp("gifts", "Birthdays, holidays & gifts", "Giving & family", { freq: "yearly" }),
      exp("cash_misc", "Cash that goes and you're not sure where", "Other"),
      {
        type: "list",
        id: "other_exp",
        label: "Anything else that costs money regularly?",
        itemLabel: "Expense",
        addLabel: "Add an expense",
        columns: [
          { type: "text", id: "name", label: "What it is", width: "lg" },
          exp("cost", "Cost", "Other"),
        ],
      },
    ],
  },
  {
    id: "savings",
    title: "Savings & what you own",
    short: "Savings",
    icon: "PiggyBank",
    intro: "Ranges are fine. Some programs have savings limits, so this tells us what you can apply for.",
    fields: [
      { type: "text", id: "bank_name", label: "Which bank or credit union do you use?" },
      {
        type: "choice",
        id: "checking_range",
        label: "About how much is in checking right before the next check arrives?",
        options: opts("Under $0 (overdrawn)", "$0–$100", "$100–$500", "$500–$1,000", "Over $1,000"),
      },
      {
        type: "choice",
        id: "savings_range",
        label: "Savings (all accounts together)",
        options: opts("None", "Under $500", "$500–$2,000", "$2,000–$5,000", "Over $5,000"),
      },
      { type: "yesno", id: "has_retirement", label: "Any IRA, 401(k), annuity or CDs?", unsure: false },
      money("retirement_value", "About how much in total?", "asset", "Retirement", { recurring: false, showIf: { field: "has_retirement", in: ["yes"] } }),
      money("home_value", "About what is the home worth?", "asset", "Home", { recurring: false, showIf: { field: "home_status", in: ["own_free", "own_mortgage", "reverse", "mobile_lot"] } }),
      { type: "yesno", id: "other_property", label: "Any other property, land or vehicles?", unsure: false },
      { type: "textarea", id: "other_property_detail", label: "What is it?", showIf: { field: "other_property", in: ["yes"] } },
    ],
  },
  {
    id: "benefits",
    title: "Help you get now",
    short: "Benefits",
    icon: "BadgeCheck",
    fields: [
      {
        type: "multi",
        id: "benefits_now",
        label: "Check any help you get now:",
        options: [
          { value: "snap", label: "SNAP / food stamps" },
          { value: "medicaid", label: "Medicaid" },
          { value: "msp", label: "Medicare Savings Program (state pays Part B)" },
          { value: "extra_help", label: "Extra Help with prescriptions" },
          { value: "liheap", label: "Help with the electric bill (LIHEAP)" },
          { value: "lifeline", label: "Lifeline phone / internet discount" },
          { value: "homestead", label: "Homestead / senior property tax exemption" },
          { value: "va", label: "VA benefits" },
          { value: "meals", label: "Meals on Wheels / senior meals" },
          { value: "pantry", label: "Food pantry" },
          { value: "church_help", label: "Help from a church" },
          { value: "none", label: "None of these" },
        ],
      },
      { type: "textarea", id: "benefits_denied", label: "Have you applied for anything and been turned down? What and when?" },
      {
        type: "choice",
        id: "computer_comfort",
        label: "How comfortable are you filling out forms online?",
        options: opts("Comfortable", "I can with help", "I'd rather do it by phone or in person"),
      },
      {
        type: "choice",
        id: "ok_to_help_apply",
        label: "Can we help you apply for programs you qualify for?",
        options: opts("Yes, please", "Ask me first each time", "Not right now"),
      },
    ],
  },
  {
    id: "goals",
    title: "What matters most",
    short: "Goals",
    icon: "Target",
    fields: [
      {
        type: "multi",
        id: "goals",
        label: "What would make the biggest difference for you?",
        options: opts("Always having enough food", "A cushion for emergencies", "Getting the A/C taken care of", "Keeping the truck running", "Paying off debt", "Lower monthly bills", "Stopping collection calls", "Less stress about money"),
      },
      { type: "textarea", id: "worries", label: "What worries you most about money right now?" },
      { type: "textarea", id: "last_emergency", label: "The last time something broke or an emergency came up, what happened and how did you pay for it?" },
      {
        type: "list",
        id: "upcoming",
        label: "Big costs you know are coming",
        help: "Car tags, insurance renewals, a repair you've been putting off, a trip, a medical procedure…",
        itemLabel: "Upcoming cost",
        addLabel: "Add an upcoming cost",
        columns: [
          { type: "text", id: "what", label: "What", width: "md" },
          { type: "text", id: "when", label: "When", width: "sm", placeholder: "March" },
          money("cost", "About how much", undefined, "Upcoming", { recurring: false }),
        ],
      },
      { type: "textarea", id: "anything_else", label: "Anything else you want us to know?" },
    ],
  },
  {
    id: "documents",
    title: "Papers that will help",
    short: "Papers",
    icon: "FolderOpen",
    intro: "You don't need to send anything yet. Just check what you can find, and we'll go through it together.",
    fields: [
      {
        type: "multi",
        id: "docs_have",
        label: "I can find:",
        options: opts(
          "Social Security benefit letter (2026 or 2027)",
          "Pension statements",
          "Last 2–3 bank statements",
          "Medicare & insurance cards",
          "Pharmacy printout of prescriptions & costs",
          "Electric, water, phone & internet bills",
          "Mortgage or rent statement",
          "Property tax bill",
          "Homeowners insurance papers",
          "Car insurance bill",
          "Credit card & loan statements",
          "Collection letters",
          "Letters about SNAP or Medicaid"
        ),
      },
      { type: "info", id: "docs_privacy", label: "Please don't type Social Security numbers, bank account numbers or card numbers anywhere in this form.", tone: "privacy" },
    ],
  },
];

export const householdBudget: Template = {
  id: "household-budget",
  name: "Household Budget & Benefits Check-up",
  description: "Full income, spending, debt, medical-cost and benefits picture for a retired household.",
  welcome: {
    heading: "Let's get the full picture, together.",
    body: [
      "These questions help us see where the money goes each month, and find every program, discount and savings you qualify for.",
      "Take your time. Everything saves as you go, and you can close this page and come back to the same link whenever you want.",
      "If you don't know an answer, skip it. A rough guess is better than nothing, and we'll fill in the gaps together.",
    ],
  },
  sections,
};

export const DEFAULT_FREQ: Freq = "monthly";
