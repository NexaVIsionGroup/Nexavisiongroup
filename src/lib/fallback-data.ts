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
      { label: "Industries", href: "/industries", children: null },
      { label: "Systems", href: "/systems", children: null },
      { label: "Demos", href: "/demos", children: null },
      { label: "Systems Lab", href: "/lab", children: null },
      { label: "Pricing", href: "/pricing", children: null },
    ],
    ctaButton: { label: "Get a Quote", href: "/contact" },
  },
  footer: {
    tagline: "We build revenue infrastructure. The website is the entrance. The system is the anthill.",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Industries", href: "/industries" },
          { label: "Systems", href: "/systems" },
          { label: "Demos", href: "/demos" },
          { label: "Systems Lab", href: "/lab" },
          { label: "Pricing", href: "/pricing" },
        ],
      },
      {
        title: "Industries",
        links: [
          { label: "HVAC", href: "/industries/hvac" },
          { label: "Auto Repair", href: "/industries/auto-repair" },
          { label: "Property Management", href: "/industries/property-management" },
          { label: "Law Firms", href: "/industries/law-firms" },
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
    headline: "Revenue Infrastructure for Service Businesses",
    highlightedText: "Revenue Infrastructure",
    subheadline:
      "We engineer acquisition + ops systems to win higher-caliber clients and scale operations.",
    primaryCta: { label: "Get a Quote in 60 Seconds", href: "/contact" },
    secondaryCta: { label: "View Live Demos", href: "/demos" },
    consolePanel: {
      statusText: "Accepting builds",
      statusColor: "green",
      deploymentText: "weeks, not months",
      modules: ["Intake", "CRM", "Quote", "Invoices", "Automations", "Portal"],
      industries: ["HVAC", "Auto Repair", "Property Mgmt", "Law", "Insurance", "Salons"],
    },
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
  industrySection: {
    sectionLabel: "Industries We Serve",
    headline: "Built for Your Vertical",
    description:
      "Each industry gets tailored intake flows, specialized data models, industry-specific automations, and proof pages that match buying behavior.",
    industries: [
      { _id: "1", name: "HVAC", slug: { current: "hvac" }, shortDescription: "Quote wizards, emergency routing, service area SEO", icon: "Thermometer", color: "#00E5CC" },
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
    headline: "Ready to Replace Chaos with Systems?",
    description:
      "Stop losing leads to slow follow-up and manual processes. Get a Revenue System that works while you sleep.",
    primaryCta: { label: "Start Your Build", href: "/contact" },
    secondaryCta: { label: "Book a Call", href: "/contact" },
  },
};
