/* ═══════════════════════════════════════════════════
   FALLBACK DATA
   Used when Sanity is not yet connected.
   Replace with Sanity content once Studio is live.
   ═══════════════════════════════════════════════════ */

export const fallbackSettings = {
  siteName: "NexaVision Group",
  tagline: "Revenue Infrastructure for Service Businesses",
  logo: null,
  navigation: {
    items: [
      { label: "How It Works", href: "/systems", children: null },
      { label: "Industries", href: "/industries", children: null },
      { label: "Live Demos", href: "/demos", children: null },
      { label: "Pricing", href: "/pricing", children: null },
    ],
    ctaButton: { label: "Start Your Build", href: "/contact" },
  },
  footer: {
    tagline: "We build revenue infrastructure. The website is the entrance. The system is the anthill.",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "How It Works", href: "/systems" },
          { label: "Industries", href: "/industries" },
          { label: "Live Demos", href: "/demos" },
          { label: "Systems Lab", href: "/lab" },
          { label: "Pricing", href: "/pricing" },
        ],
      },
      {
        title: "Industries",
        links: [
          { label: "HVAC", href: "/industries/hvac" },
          { label: "Construction", href: "/industries/construction" },
          { label: "Auto Repair", href: "/industries/auto-repair" },
          { label: "Property Management", href: "/industries/property-management" },
          { label: "View All", href: "/industries" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
    bottomText: `© ${new Date().getFullYear()} NexaVision Group. All rights reserved.`,
    showSocials: true,
  },
  socialLinks: [],
  contactEmail: "hello@nexavisiongroup.com",
};

export const fallbackHomepage = {
  hero: {
    headline: "Stop Losing Leads. Start Closing More Jobs.",
    subheadline:
      "We build automated intake, quoting, and follow-up systems for service businesses. Your website becomes a revenue engine — not a brochure.",
    primaryCta: { label: "Start Your Build", href: "/contact" },
    secondaryCta: { label: "See a Live System", href: "https://arcticsolutionsllc.com" },
    trustLine: "Trusted by Arctic Solutions, RO Unlimited, and service businesses across the Carolinas",
  },
  trustBar: {
    tagline: "Trusted by service businesses across South Carolina, North Carolina, and Florida",
  },
  problemSection: {
    headline: "Sound Familiar?",
    problems: [
      { icon: "PhoneOff", text: "Leads go to voicemail after hours. By morning, they've called your competitor.", color: "#EF4444" },
      { icon: "FileQuestion", text: "Quotes live in text threads. You have no idea which ones converted.", color: "#EAB308" },
      { icon: "ClipboardList", text: "You're doing $800K in revenue but still dispatching by phone and sticky notes.", color: "#FF6B35" },
    ],
    closingLine: "These aren't marketing problems. They're system problems. And they're costing you real money.",
  },
  anthillSection: {
    sectionLabel: "The Anthill Model",
    headline: "The Website Is the Entrance. The System Is the Anthill.",
    description:
      "Most 'websites' are a small visible surface. The real value is underground: workflows, automation, billing, lead routing, dashboards, portals, and reporting.",
    surfaceItems: [
      { icon: "Globe", label: "High-Converting Pages", description: "Engineered to convert and pre-qualify" },
      { icon: "MousePointerClick", label: "Multi-Step Intake", description: "Quote wizards that filter leads" },
      { icon: "Star", label: "Trust Stack", description: "Reviews, proof, credentials" },
      { icon: "BarChart3", label: "Tracking & Attribution", description: "Calls, forms, UTM tracking" },
    ],
    undergroundItems: [
      { icon: "Kanban", label: "Lead Pipeline", description: "Inbox + pipeline board" },
      { icon: "FileText", label: "Quoting & Estimates", description: "Build → send → accept" },
      { icon: "Briefcase", label: "Job Tracking", description: "Full lifecycle management" },
      { icon: "CreditCard", label: "Invoices & Payments", description: "Pay links, card-on-file" },
      { icon: "Zap", label: "Automations", description: "Follow-up, reminders, reviews" },
      { icon: "Bell", label: "Notifications", description: "Email, SMS, push alerts" },
      { icon: "Users", label: "Client Portal", description: "Quotes, payments, status updates" },
      { icon: "Smartphone", label: "Admin App", description: "Mobile access + quick actions" },
    ],
  },
  caseStudySnapshot: {
    company: "Arctic Solutions",
    headline: "Arctic Solutions: From Kickoff to Live in 3 Weeks",
    body: "Arctic Solutions is a commercial refrigeration and HVAC company in Upstate South Carolina, serving the Spartanburg and greater Carolina region. They needed an emergency intake system that could capture after-hours calls, route urgent requests instantly, and automate follow-up. We built it.",
    stats: [
      { value: "3 weeks", label: "from kickoff to live deployment" },
      { value: "48 hours", label: "first emergency lead captured after launch" },
      { value: "24/7", label: "intake running around the clock without staff" },
    ],
    demoLink: "https://arcticsolutionsllc.com",
  },
  industrySection: {
    sectionLabel: "Industries",
    headline: "Built for Your Industry",
    description:
      "Each system is tailored to how your industry wins and keeps customers.",
    industries: [
      { _id: "1", name: "HVAC", slug: { current: "hvac" }, shortDescription: "Quote wizards, emergency routing, service area SEO", icon: "Thermometer", color: "#00E5CC" },
      { _id: "11", name: "Construction", slug: { current: "construction" }, shortDescription: "Bid intake, project portals, subcontractor coordination, progress tracking", icon: "HardHat", color: "#00E5CC" },
      { _id: "2", name: "Auto Repair", slug: { current: "auto-repair" }, shortDescription: "Booking, estimate intake, review engines, job status", icon: "Wrench", color: "#00E5CC" },
      { _id: "3", name: "Property Management", slug: { current: "property-management" }, shortDescription: "Tenant intake, maintenance portals, work orders", icon: "Building2", color: "#00E5CC" },
      { _id: "4", name: "Law Firms", slug: { current: "law-firms" }, shortDescription: "Lead qualification, secure docs, intake automation", icon: "Scale", color: "#7B5EA7" },
      { _id: "5", name: "Insurance", slug: { current: "insurance" }, shortDescription: "Quote flows, renewal reminders, CRM sync", icon: "Shield", color: "#7B5EA7" },
      { _id: "6", name: "Salons & Spas", slug: { current: "salons-spas" }, shortDescription: "Booking, deposits, memberships, upsell flows", icon: "Scissors", color: "#7B5EA7" },
      { _id: "7", name: "Logistics", slug: { current: "logistics" }, shortDescription: "Quote requests, client portals, dispatch workflows", icon: "Truck", color: "#FF6B35" },
      { _id: "8", name: "Veterinary", slug: { current: "veterinary" }, shortDescription: "Appointments, patient intake, automated reminders", icon: "Heart", color: "#FF6B35" },
      { _id: "9", name: "Home Healthcare", slug: { current: "home-healthcare" }, shortDescription: "Intake, compliance comms, staff scheduling", icon: "HeartPulse", color: "#FF6B35" },
      { _id: "10", name: "Self-Storage", slug: { current: "self-storage" }, shortDescription: "Unit availability, reservations, lead follow-up", icon: "Warehouse", color: "#FF6B35" },
    ],
  },
  modulesSection: {
    sectionLabel: "Deployable Modules",
    headline: "Every Module Your Business Needs",
    description:
      "Build once, deploy many. Each module is configurable per vertical and designed to integrate seamlessly.",
    modules: [
      { name: "Lead Intake System", description: "Multi-step forms engineered to convert and pre-qualify. Photo/video upload, symptoms, service selection.", icon: "MousePointerClick", features: ["Multi-step wizard", "Photo/video upload", "Pre-qualification logic", "UTM tracking"], tier: "starter" },
      { name: "CRM & Pipeline", description: "Visual pipeline board. Track every lead from first touch to closed deal.", icon: "Kanban", features: ["Lead inbox", "Pipeline stages", "Contact management", "Activity timeline"], tier: "starter" },
      { name: "Quote Builder", description: "Generate, send, and track professional quotes. Customers accept with one click.", icon: "FileText", features: ["Line-item builder", "Digital acceptance", "PDF generation", "Quote tracking"], tier: "growth" },
      { name: "Invoicing & Payments", description: "Send invoices, accept payments, track everything. Stripe & Square integration.", icon: "CreditCard", features: ["Pay links", "Card-on-file", "Payment tracking", "Auto-receipts"], tier: "growth" },
      { name: "Automations Engine", description: "Follow-ups, reminders, review requests, status updates — all on autopilot.", icon: "Zap", features: ["Email sequences", "SMS reminders", "Review requests", "Status triggers"], tier: "growth" },
      { name: "Client Portal", description: "Your customers see quotes, pay invoices, track job status, upload documents.", icon: "Users", features: ["Quote viewing", "Invoice payments", "Status tracking", "Document sharing"], tier: "growth" },
      { name: "Admin Dashboard", description: "Real-time metrics, pipeline health, revenue tracking. See your business at a glance.", icon: "LayoutDashboard", features: ["KPI dashboard", "Pipeline analytics", "Revenue reports", "Team activity"], tier: "ops" },
      { name: "Mobile Admin", description: "Full admin access from your phone. Call, message, assign, schedule — anywhere.", icon: "Smartphone", features: ["Push notifications", "Quick actions", "Mobile pipeline", "Camera capture"], tier: "ops" },
    ],
  },
  proofSection: {
    sectionLabel: "Results",
    headline: "Systems That Produce Revenue",
    description: "We don't build brochures. We build infrastructure that generates measurable returns.",
    stats: [
      { value: "3×", label: "Lead-to-close improvement", icon: "TrendingUp" },
      { value: "<24h", label: "Average follow-up time", icon: "Clock" },
      { value: "40%", label: "Less admin overhead", icon: "ArrowDown" },
      { value: "90+", label: "Lighthouse performance score", icon: "Zap" },
    ],
    processSteps: [
      { step: 1, title: "Discovery & Diagnosis", description: "We map your lead-to-job pipeline and identify where money leaks." },
      { step: 2, title: "System Design", description: "Custom module selection, data model, and automation rules for your vertical." },
      { step: 3, title: "Build & Deploy", description: "Your Revenue System goes live in weeks, not months." },
      { step: 4, title: "Optimize & Scale", description: "Ongoing tuning, feature expansion, and performance monitoring." },
    ],
    testimonials: [],
  },
  pricingSection: {
    sectionLabel: "Pricing",
    headline: "Systems That Pay for Themselves",
    description: "One new client can pay for your system. Choose the tier that matches your growth stage.",
    tiers: [
      {
        name: "Revenue System Starter",
        tagline: "Fast ROI, clean conversion, upgrade-ready foundation",
        priceRange: "$6k–$12k",
        timeline: "weeks, not months",
        featured: true,
        features: [
          "High-converting website (industry-specific)",
          "Multi-step intake + lead routing",
          "Tracking + analytics baseline",
          "Basic CMS for core content",
          "Simple admin lead inbox",
          "Speed/performance optimization",
        ],
        addOns: ["Review engine", "Booking integrations", "Payment deposits"],
        ctaLabel: "Start Your Build",
        ctaHref: "/contact",
      },
      {
        name: "Growth System",
        tagline: "Operations upgrades that close more deals",
        priceRange: "$12k–$25k",
        timeline: "3–6 weeks",
        featured: false,
        features: [
          "Everything in Starter",
          "Pipeline board (lead→won)",
          "Quote builder + acceptance",
          "Invoices + pay links",
          "Automation engine",
          "Staff roles + permissions",
          "Client portal basics",
        ],
        addOns: [],
        ctaLabel: "Explore Growth",
        ctaHref: "/contact",
      },
      {
        name: "Ops Stack",
        tagline: "Full anthill — micro-SaaS grade",
        priceRange: "$25k–$75k+",
        timeline: "6–12 weeks",
        featured: false,
        features: [
          "Everything in Growth",
          "Deep ops modules per vertical",
          "Advanced reporting dashboards",
          "Multi-location support",
          "Third-party integrations",
          "Mobile admin apps",
          "Subscription/retainer billing",
        ],
        addOns: [],
        ctaLabel: "Let's Talk",
        ctaHref: "/contact",
      },
    ],
  },
  ctaSection: {
    headline: "Your next lead is 15 minutes away from choosing your competitor.",
    description:
      "Let's build the system that makes sure they choose you.",
    primaryCta: { label: "Start Your Build", href: "/contact" },
    secondaryCta: { label: "Book a 15-Min Call", href: "mailto:hello@nexavisiongroup.com?subject=15-Min Scope Call" },
  },
};
