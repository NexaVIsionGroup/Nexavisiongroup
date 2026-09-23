/**
 * Goodman Detailing — content for the temp landing page.
 * PLACEHOLDERS marked TODO need the real business info (phone, cities,
 * pricing, real photos). Swap these and the page updates everywhere.
 */

export const GOODMAN = {
  name: "Goodman Detailing",
  phone: "(555) 123-4567", // TODO real number
  phoneHref: "tel:+15551234567", // TODO
  email: "hello@goodmandetailing.com", // TODO
  cities: ["Your City", "Metro Area", "Surrounding Counties"], // TODO real service area

  hero: {
    eyebrow: "Residential · Commercial · Fleet",
    title: ["Detailing that", "means business."],
    sub: "Showroom-grade detailing for everyday drivers — and a professional, insured fleet-wash operation for the trucks that keep your business moving. On-site, on schedule, across the region.",
    stats: [
      { value: "2,400+", label: "Vehicles Detailed" },
      { value: "40+", label: "Fleet Units / Week" },
      { value: "6", label: "Cities Served" },
    ],
  },

  paths: [
    {
      key: "residential",
      kicker: "For Drivers",
      title: "Residential Detailing",
      copy: "Wash & wax, paint correction, ceramic coating, and full interior restoration. We treat your daily driver like a showpiece.",
      bullets: ["Exterior wash, clay & wax", "Ceramic coating & paint correction", "Full interior shampoo & sanitize"],
      cta: "Book a Detail",
      img: "/goodman/residential.jpg",
    },
    {
      key: "commercial",
      kicker: "For Business",
      title: "Commercial & Fleet",
      copy: "Recurring on-site washing for trucks, trailers, vans, and heavy equipment — with per-unit photo verification and zero downtime.",
      bullets: ["On-site, nights & weekends", "EPA-compliant water reclamation", "Per-unit checklists + photo proof"],
      cta: "Request a Fleet Quote",
      img: "/goodman/commercial.jpg",
    },
  ],

  fleet: {
    eyebrow: "Fleet Program",
    title: "Built for fleets, not just cars.",
    sub: "Most detailers won't touch an 18-wheeler. We specialize in them.",
    points: [
      { t: "We come to you", d: "Self-contained mobile rigs wash your fleet at your yard, around your schedule — including nights and weekends so units never leave rotation." },
      { t: "Compliant & clean", d: "EPA-compliant water capture and reclamation keeps your site clear of runoff violations and fines." },
      { t: "Proof on every unit", d: "Route-ready checklists and before/after photos added to each service record. You see exactly what was done." },
      { t: "One point of contact", d: "A dedicated account manager coordinates multi-yard, multi-city schedules so you make one call, not ten." },
    ],
    types: ["Semi-trucks", "Trailers", "Box trucks", "Cargo vans", "Buses", "Heavy equipment"],
  },

  beforeAfter: {
    eyebrow: "The Difference",
    title: "Drag to see the transformation.",
    sub: "Placeholder shots — these get replaced with Goodman's real before/after work, the single biggest trust driver on the site.",
    before: "/goodman/before.jpg",
    after: "/goodman/after.jpg",
  },
} as const;
