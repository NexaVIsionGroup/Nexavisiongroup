/* ═══════════════════════════════════════════════════
   INDUSTRY FALLBACK DATA
   Detailed content for each vertical landing page.
   Used when Sanity isn't populated yet.
   ═══════════════════════════════════════════════════ */

interface IndustryFallback {
  name: string;
  slug: { current: string };
  shortDescription: string;
  icon: string;
  color: string;
  demoLink?: string;
  painPoints: { title: string; description: string; icon: string }[];
  keyModules: { name: string; description: string; icon: string }[];
  signatureModule: { name: string; description: string; features: string[] };
  stats: { value: string; label: string }[];
}

const industries: Record<string, IndustryFallback> = {
  hvac: {
    name: "HVAC",
    slug: { current: "hvac" },
    shortDescription:
      "Quote wizards for emergency and scheduled service, automated follow-up, review generation, and service area SEO — built for commercial refrigeration, heating, cooling, and ventilation companies.",
    icon: "Thermometer",
    color: "#00E5CC",
    demoLink: undefined, // Will point to Arctic Solutions once live
    painPoints: [
      { title: "Emergency Calls Go to Voicemail", description: "When a walk-in cooler goes down at 11pm, the first company to answer gets the job. If your intake system can't handle after-hours, you're losing $2,000+ calls.", icon: "PhoneOff" },
      { title: "Quotes Get Lost in Text Threads", description: "Estimating via text and email means no tracking, no follow-up, and no idea which quotes converted. Revenue leaks silently.", icon: "MessageSquareOff" },
      { title: "No-Shows and Forgotten Follow-Ups", description: "Without automated reminders, 15-20% of scheduled appointments get forgotten or rescheduled. That's direct revenue loss.", icon: "CalendarOff" },
      { title: "Zero Review Generation", description: "Happy customers never leave reviews unless you ask at the right moment. Your competitors with 200+ reviews win the Google Map Pack.", icon: "StarOff" },
      { title: "Manual Dispatching Wastes Hours", description: "Routing techs by phone and text burns admin time and creates scheduling collisions. One missed job costs more than the system.", icon: "Route" },
      { title: "No Visibility Into Pipeline", description: "How many leads came in this week? How many converted? What's the average ticket? If you can't answer instantly, you're guessing.", icon: "EyeOff" },
    ],
    keyModules: [
      { name: "Emergency Intake System", description: "24/7 intake with urgency routing. Emergency requests trigger instant notifications and click-to-call prompts.", icon: "Siren" },
      { name: "Quote Builder", description: "Professional quotes with line items, photos, and one-click acceptance. Track which quotes are open, viewed, and accepted.", icon: "FileText" },
      { name: "Job Pipeline", description: "Visual board tracking every job from lead to completion. Never lose a job in the shuffle.", icon: "Kanban" },
      { name: "Automated Follow-Up", description: "Quote reminders, appointment confirmations, completion surveys, and review requests — all automatic.", icon: "Zap" },
      { name: "Review Engine", description: "Automatically request reviews at the perfect moment. Route happy customers to Google, unhappy ones to you.", icon: "Star" },
      { name: "Service Area Pages", description: "SEO-optimized pages for every city and service area you cover. Rank locally without paying for ads.", icon: "MapPin" },
    ],
    signatureModule: {
      name: "Emergency / Quote Request Wizard",
      description:
        "A multi-step intake system engineered for HVAC and commercial refrigeration. Captures equipment type, issue description, urgency level, and business info. Emergency requests trigger instant call prompts and SMS notifications. Scheduled requests get automated confirmation and reminders.",
      features: [
        "Equipment type selection (walk-in, reach-in, ice machine, rooftop, etc.)",
        "Issue categorization with photo/video upload",
        "Urgency routing (emergency → instant call, standard → scheduled)",
        "Business info capture with preferred contact method",
        "Automated SMS/email confirmation",
        "Emergency bypass: click-to-call with 15-minute callback guarantee",
        "Integration-ready for dispatching and CRM",
        "Mobile-optimized for field submissions",
      ],
    },
    stats: [
      { value: "3×", label: "Lead-to-close rate" },
      { value: "<15m", label: "Emergency response" },
      { value: "40%", label: "Less admin time" },
      { value: "$0", label: "Per-lead ad cost" },
    ],
  },

  "auto-repair": {
    name: "Auto Repair",
    slug: { current: "auto-repair" },
    shortDescription:
      "Booking systems, estimate intake, review engines, and job status portals — built for auto repair shops, body shops, and specialty mechanics.",
    icon: "Wrench",
    color: "#00E5CC",
    painPoints: [
      { title: "Phone Tag Kills Conversions", description: "Customers calling for estimates hang up after 3 rings. An online booking system captures them 24/7.", icon: "PhoneOff" },
      { title: "Estimate Requests Are Chaos", description: "Texts, voicemails, walk-ins — no central system means lost estimates and double-bookings.", icon: "FileWarning" },
      { title: "Customers Don't Know Job Status", description: "Constant 'is my car ready?' calls waste shop time. A status portal eliminates 80% of these calls.", icon: "HelpCircle" },
      { title: "Reviews Dominated by Complaints", description: "Without proactive review generation, only angry customers post. Your 3.2 stars loses to the shop with 4.8.", icon: "ThumbsDown" },
    ],
    keyModules: [
      { name: "Online Booking", description: "24/7 appointment scheduling with service type selection and time slot management.", icon: "CalendarCheck" },
      { name: "Estimate Intake", description: "Structured estimate requests with vehicle info, photos, and issue description.", icon: "ClipboardList" },
      { name: "Job Status Portal", description: "Customers check repair status online. Automated updates when status changes.", icon: "Activity" },
      { name: "Review Engine", description: "Post-service review requests timed to maximize positive reviews on Google.", icon: "Star" },
      { name: "Automated Reminders", description: "Service reminders, oil change notifications, and seasonal maintenance prompts.", icon: "Bell" },
    ],
    signatureModule: {
      name: "Booking + Estimate Intake System",
      description:
        "Combined booking and estimate system that captures vehicle details, service needs, and customer preferences. Reduces phone calls by 60% while increasing booking volume.",
      features: [
        "Vehicle year/make/model selection",
        "Service type categorization",
        "Photo upload for damage/issue documentation",
        "Preferred date/time selection",
        "Automated confirmation + reminders",
        "Integration-ready for shop management",
      ],
    },
    stats: [
      { value: "60%", label: "Fewer phone calls" },
      { value: "2×", label: "Online bookings" },
      { value: "4.8★", label: "Average review score" },
      { value: "24/7", label: "Booking availability" },
    ],
  },

  "property-management": {
    name: "Property Management",
    slug: { current: "property-management" },
    shortDescription:
      "Tenant intake, maintenance request portals, work order tracking, and owner reporting — built for property managers and landlords.",
    icon: "Building2",
    color: "#00E5CC",
    painPoints: [
      { title: "Maintenance Requests via Text", description: "Tenants text photos, call at midnight, and DM on social. No central system means missed requests and liability.", icon: "MessageCircle" },
      { title: "Vacancy Costs Stack Up", description: "Every day a unit sits empty costs money. Slow inquiry response means losing qualified tenants to faster managers.", icon: "DoorOpen" },
      { title: "Owner Reporting Is Manual", description: "Spreadsheet reports for property owners take hours. Automated dashboards save time and build trust.", icon: "FileSpreadsheet" },
      { title: "Work Order Tracking Is a Nightmare", description: "Which vendor was assigned? Is it complete? Was it billed? Without a system, maintenance falls through cracks.", icon: "ClipboardX" },
    ],
    keyModules: [
      { name: "Tenant Intake Portal", description: "Online applications, document upload, and screening integration.", icon: "UserPlus" },
      { name: "Maintenance Request Portal", description: "Tenants submit requests with photos and urgency. You assign, track, and close.", icon: "Wrench" },
      { name: "Work Order Tracking", description: "Assign vendors, track completion, log costs. Full lifecycle management.", icon: "ClipboardCheck" },
      { name: "Owner Dashboard", description: "Real-time financial and maintenance reporting for property owners.", icon: "LayoutDashboard" },
    ],
    signatureModule: {
      name: "Maintenance Request Portal",
      description:
        "Tenant-facing portal for submitting, tracking, and communicating about maintenance requests. Reduces phone calls, creates audit trail, and accelerates resolution.",
      features: [
        "Photo/video upload of issues",
        "Urgency categorization (emergency, urgent, routine)",
        "Real-time status tracking for tenants",
        "Vendor assignment and notification",
        "Cost tracking and owner billing",
        "Mobile-optimized for field techs",
      ],
    },
    stats: [
      { value: "80%", label: "Fewer maintenance calls" },
      { value: "48h", label: "Avg resolution time" },
      { value: "3×", label: "Faster tenant placement" },
      { value: "100%", label: "Request audit trail" },
    ],
  },

  "law-firms": {
    name: "Law Firms",
    slug: { current: "law-firms" },
    shortDescription: "Lead qualification, secure document intake, automated follow-up, and case status portals for law firms and legal practices.",
    icon: "Scale",
    color: "#7B5EA7",
    painPoints: [
      { title: "Unqualified Leads Waste Attorney Time", description: "Without pre-screening, attorneys spend hours on consultations that never convert.", icon: "UserX" },
      { title: "Slow Follow-Up Loses Cases", description: "A potential client contacts 3 firms. The first one to respond professionally wins the case.", icon: "Clock" },
      { title: "Document Collection Is Manual", description: "Chasing clients for documents via email creates delays and security risks.", icon: "FileWarning" },
      { title: "No Client Portal", description: "Clients call constantly for updates. A self-service portal reduces interruptions and improves satisfaction.", icon: "HelpCircle" },
    ],
    keyModules: [
      { name: "Lead Qualification Intake", description: "Multi-step intake that pre-screens by practice area, case type, and urgency.", icon: "Filter" },
      { name: "Secure Document Portal", description: "Encrypted document upload and sharing for client files.", icon: "Lock" },
      { name: "Automated Follow-Up", description: "Nurture sequences for leads who don't convert immediately.", icon: "Zap" },
      { name: "Case Status Portal", description: "Clients check case progress, upcoming dates, and documents online.", icon: "Briefcase" },
    ],
    signatureModule: {
      name: "Legal Intake Qualifier",
      description: "Structured intake that pre-qualifies leads by practice area, captures case details, and routes to the right attorney with full context.",
      features: [
        "Practice area routing (personal injury, family, criminal, etc.)",
        "Case detail capture with document upload",
        "Urgency flagging for time-sensitive matters",
        "Conflict check preparation data",
        "Automated consultation scheduling",
        "HIPAA/confidentiality compliant design",
      ],
    },
    stats: [
      { value: "50%", label: "Better lead quality" },
      { value: "<5m", label: "Response time" },
      { value: "3×", label: "Consultation conversion" },
      { value: "Zero", label: "Missed follow-ups" },
    ],
  },

  insurance: {
    name: "Insurance",
    slug: { current: "insurance" },
    shortDescription: "Quote flows, renewal reminders, CRM sync, and client portals for insurance agencies and brokers.",
    icon: "Shield",
    color: "#7B5EA7",
    painPoints: [
      { title: "Quote Requests Get Lost", description: "Quote inquiries arrive via phone, email, and web. Without central tracking, 30%+ never get followed up.", icon: "SearchX" },
      { title: "Renewal Reminders Are Manual", description: "Renewals that slip through the cracks mean lost policies and lost commission.", icon: "CalendarOff" },
      { title: "No Differentiation Online", description: "Every insurance agency website looks the same. Prospects can't tell you apart from the competition.", icon: "Copy" },
      { title: "Cross-Sell Opportunities Missed", description: "Existing clients with only auto insurance could have home, umbrella, and life. No system means no prompting.", icon: "TrendingDown" },
    ],
    keyModules: [
      { name: "Quote Flow Intake", description: "Structured quote requests by insurance type with pre-fill and comparison.", icon: "FileText" },
      { name: "Renewal Automation", description: "Automated renewal reminders 60, 30, and 7 days before expiration.", icon: "RefreshCw" },
      { name: "Client Portal", description: "Policy documents, ID cards, and claims filing in one place.", icon: "Users" },
      { name: "Cross-Sell Engine", description: "Identify and prompt cross-sell opportunities based on current coverage.", icon: "TrendingUp" },
    ],
    signatureModule: {
      name: "Multi-Line Quote Wizard",
      description: "Captures quote requests across multiple insurance lines with conditional logic that tailors questions per type.",
      features: [ "Auto, home, life, commercial, umbrella line selection", "Conditional question flows per line", "Multi-line bundling prompts", "Document upload for existing policies", "Automated agent notification", "Follow-up sequence for unconverted quotes" ],
    },
    stats: [ { value: "40%", label: "More quote requests" }, { value: "Zero", label: "Missed renewals" }, { value: "2×", label: "Cross-sell rate" }, { value: "24/7", label: "Quote availability" } ],
  },

  "salons-spas": {
    name: "Salons & Spas",
    slug: { current: "salons-spas" },
    shortDescription: "Online booking, deposit collection, membership management, and upsell flows for salons, spas, and beauty businesses.",
    icon: "Scissors",
    color: "#7B5EA7",
    painPoints: [
      { title: "No-Shows Cost Real Money", description: "Without deposits, 15-20% of appointments are no-shows. That's empty chairs and lost revenue.", icon: "UserX" },
      { title: "Booking by Phone Only", description: "Clients want to book at 10pm. If you're phone-only, they book with whoever has online scheduling.", icon: "PhoneOff" },
      { title: "No Recurring Revenue", description: "Without memberships or packages, every month starts at zero. Predictable revenue requires a system.", icon: "TrendingDown" },
      { title: "Upsells Left on the Table", description: "Add-on services, products, and upgrades never get offered because there's no prompt in the flow.", icon: "ShoppingBag" },
    ],
    keyModules: [
      { name: "Online Booking", description: "Service selection, stylist preference, and time slot booking with deposit collection.", icon: "CalendarCheck" },
      { name: "Deposit & Prepayment", description: "Collect deposits at booking to eliminate no-shows. Card-on-file for repeat clients.", icon: "CreditCard" },
      { name: "Membership Engine", description: "Recurring memberships with auto-billing, usage tracking, and member perks.", icon: "Crown" },
      { name: "Upsell Flows", description: "Smart prompts during booking for add-on services and product bundles.", icon: "Sparkles" },
    ],
    signatureModule: {
      name: "Booking + Deposit System",
      description: "Full booking flow with service menu, stylist selection, deposit collection, and automated reminders. Eliminates no-shows and fills empty chairs.",
      features: [ "Service menu with pricing and duration", "Stylist/provider preference", "Deposit collection at booking", "Automated confirmation + reminders", "Waitlist for fully booked slots", "Upsell prompts during booking" ],
    },
    stats: [ { value: "85%", label: "No-show reduction" }, { value: "3×", label: "Online bookings" }, { value: "30%", label: "Revenue from memberships" }, { value: "24/7", label: "Booking availability" } ],
  },

  logistics: {
    name: "Logistics",
    slug: { current: "logistics" },
    shortDescription: "Quote requests, client portals, dispatch workflows, and shipment tracking for logistics and freight companies.",
    icon: "Truck",
    color: "#FF6B35",
    painPoints: [
      { title: "Quote Requests Scattered Everywhere", description: "RFQs come via email, phone, and broker boards. No single inbox means slow responses and missed loads.", icon: "Inbox" },
      { title: "No Client Self-Service", description: "Customers call for tracking, PODs, and invoices. A portal eliminates 70% of these calls.", icon: "HelpCircle" },
      { title: "Manual Dispatching", description: "Coordinating drivers via phone and text creates errors, delays, and unhappy customers.", icon: "Radio" },
      { title: "Invoice Chasing", description: "Net-30 becomes net-90 without automated reminders and payment tracking.", icon: "Receipt" },
    ],
    keyModules: [
      { name: "Quote Request Portal", description: "Structured RFQ intake with origin, destination, equipment type, and timeline.", icon: "FileText" },
      { name: "Client Portal", description: "Shipment tracking, POD access, and invoice payments in one place.", icon: "Users" },
      { name: "Dispatch Board", description: "Visual load board with driver assignment, status tracking, and ETA updates.", icon: "Map" },
      { name: "Invoice Automation", description: "Auto-generate invoices from completed loads with payment tracking.", icon: "CreditCard" },
    ],
    signatureModule: {
      name: "RFQ Intake + Client Portal",
      description: "Combined quote request system and client self-service portal. Customers submit RFQs, track shipments, and pay invoices without calling.",
      features: [ "Structured RFQ with equipment/commodity selection", "Origin/destination with mileage calculation", "Real-time shipment tracking", "POD upload and access", "Invoice viewing and payment", "Communication log per shipment" ],
    },
    stats: [ { value: "70%", label: "Fewer tracking calls" }, { value: "2×", label: "Quote response speed" }, { value: "Net-30", label: "Average payment time" }, { value: "100%", label: "POD documentation" } ],
  },

  veterinary: {
    name: "Veterinary",
    slug: { current: "veterinary" },
    shortDescription: "Appointment scheduling, patient intake, automated reminders, and prescription portals for veterinary clinics.",
    icon: "Heart",
    color: "#FF6B35",
    painPoints: [
      { title: "Phone Lines Constantly Busy", description: "Pet owners call for appointments, refills, and questions. Overwhelmed front desk means missed appointments.", icon: "PhoneOff" },
      { title: "Paper Intake Wastes Time", description: "Clipboards in the lobby slow down check-in and create data entry work for staff.", icon: "FileWarning" },
      { title: "Vaccination Reminders Are Manual", description: "Without automated reminders, pets fall behind on vaccinations and owners forget annual exams.", icon: "CalendarOff" },
      { title: "Prescription Refills by Phone", description: "Every refill request ties up a phone line. An online portal handles this instantly.", icon: "Pill" },
    ],
    keyModules: [
      { name: "Online Booking", description: "Appointment scheduling by visit type, species, and preferred provider.", icon: "CalendarCheck" },
      { name: "Digital Patient Intake", description: "Pre-visit forms completed online with pet history, symptoms, and medications.", icon: "ClipboardList" },
      { name: "Reminder Engine", description: "Automated vaccination, annual exam, and medication reminders via email and SMS.", icon: "Bell" },
      { name: "Prescription Portal", description: "Online refill requests with vet approval workflow.", icon: "Pill" },
    ],
    signatureModule: {
      name: "Pet Patient Intake + Reminder System",
      description: "Digital intake forms and automated wellness reminders that reduce front-desk workload and keep patients on schedule.",
      features: [ "Pre-visit digital forms (new patient + returning)", "Species-specific health questionnaires", "Vaccination schedule tracking", "Automated email + SMS reminders", "Annual exam prompts", "Medication refill reminders" ],
    },
    stats: [ { value: "50%", label: "Less phone volume" }, { value: "95%", label: "On-time vaccinations" }, { value: "2×", label: "Online bookings" }, { value: "Zero", label: "Paper intake forms" } ],
  },

  "home-healthcare": {
    name: "Home Healthcare",
    slug: { current: "home-healthcare" },
    shortDescription: "Patient intake, compliance communications, staff scheduling, and family portals for home healthcare agencies.",
    icon: "HeartPulse",
    color: "#FF6B35",
    painPoints: [
      { title: "Intake Is Slow and Paper-Heavy", description: "New patient onboarding takes days when forms, insurance verification, and assessments are manual.", icon: "FileWarning" },
      { title: "Staff Scheduling Collisions", description: "Coordinating caregivers across patients without a system creates gaps, overlaps, and burnout.", icon: "Users" },
      { title: "Compliance Documentation Gaps", description: "Missing visit logs, unsigned care plans, and late documentation create regulatory risk.", icon: "ShieldAlert" },
      { title: "Families Can't Get Updates", description: "Family members call constantly for care updates. A portal provides transparency and peace of mind.", icon: "HelpCircle" },
    ],
    keyModules: [
      { name: "Patient Intake System", description: "Digital intake with insurance, medical history, and care plan documentation.", icon: "UserPlus" },
      { name: "Staff Scheduling", description: "Caregiver assignment, shift management, and availability tracking.", icon: "Calendar" },
      { name: "Compliance Engine", description: "Visit logging, documentation reminders, and audit-ready reporting.", icon: "Shield" },
      { name: "Family Portal", description: "Care updates, schedule visibility, and communication for family members.", icon: "Heart" },
    ],
    signatureModule: {
      name: "Digital Intake + Compliance Portal",
      description: "Streamlined patient onboarding with built-in compliance documentation that keeps you audit-ready.",
      features: [ "Digital intake forms with e-signature", "Insurance verification workflow", "Care plan documentation", "Visit logging with timestamps", "Compliance reporting dashboard", "Family notification on key events" ],
    },
    stats: [ { value: "75%", label: "Faster intake" }, { value: "100%", label: "Visit documentation" }, { value: "Zero", label: "Compliance gaps" }, { value: "3×", label: "Family satisfaction" } ],
  },

  "self-storage": {
    name: "Self-Storage",
    slug: { current: "self-storage" },
    shortDescription: "Unit availability display, online reservations, automated lead follow-up, and tenant portals for self-storage facilities.",
    icon: "Warehouse",
    color: "#FF6B35",
    painPoints: [
      { title: "No Real-Time Availability", description: "Customers want to see unit sizes and prices instantly. Phone-only means losing to competitors with online inventory.", icon: "SearchX" },
      { title: "Leads Don't Get Followed Up", description: "Someone inquires about a 10x10, doesn't book immediately, and never hears back. That unit stays empty.", icon: "UserX" },
      { title: "Move-In Process Is Slow", description: "Paper leases, in-person payments, and manual access setup slow down move-ins and frustrate tenants.", icon: "Clock" },
      { title: "Late Payments and Collections", description: "Without automated reminders and payment links, collecting rent requires constant manual effort.", icon: "CreditCard" },
    ],
    keyModules: [
      { name: "Unit Availability Display", description: "Real-time unit sizes, prices, and availability on the website.", icon: "LayoutGrid" },
      { name: "Online Reservations", description: "Reserve and pay for units online with immediate confirmation.", icon: "CheckSquare" },
      { name: "Lead Follow-Up", description: "Automated nurture sequences for inquiries that don't convert immediately.", icon: "Zap" },
      { name: "Tenant Portal", description: "Online payments, access management, and account settings.", icon: "Users" },
    ],
    signatureModule: {
      name: "Unit Reservation + Availability Engine",
      description: "Real-time inventory display with online reservation and payment. Customers see what's available, pick their unit, and pay — no phone call needed.",
      features: [ "Real-time unit availability grid", "Size and price comparison", "Online reservation with payment", "Move-in date selection", "Automated confirmation + instructions", "Lead nurture for browsers who don't book" ],
    },
    stats: [ { value: "3×", label: "Online reservations" }, { value: "40%", label: "Faster move-ins" }, { value: "95%", label: "On-time payments" }, { value: "24/7", label: "Booking availability" } ],
  },
};

export function getIndustryFallback(slug: string): IndustryFallback | null {
  return industries[slug] || null;
}

export function getAllIndustryFallbacks(): IndustryFallback[] {
  return Object.values(industries);
}
