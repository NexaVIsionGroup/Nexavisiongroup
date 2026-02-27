import { defineType, defineField } from "sanity";

export default defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  groups: [
    { name: "hero", title: "Hero" },
    { name: "anthill", title: "Anthill" },
    { name: "industries", title: "Industries" },
    { name: "modules", title: "Modules" },
    { name: "demos", title: "Demos" },
    { name: "proof", title: "Proof & Results" },
    { name: "pricing", title: "Pricing" },
    { name: "cta", title: "CTA Close" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // ═══ HERO ═══
    defineField({
      name: "hero",
      title: "Hero Section",
      type: "object",
      group: "hero",
      fields: [
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "Revenue Infrastructure for Service Businesses" }),
        defineField({ name: "highlightedText", title: "Highlighted Text (gradient)", type: "string", initialValue: "Revenue Infrastructure", description: "Part of headline that gets the teal gradient treatment" }),
        defineField({ name: "subheadline", title: "Subheadline", type: "text", rows: 2, initialValue: "We engineer acquisition + ops systems to win higher-caliber clients and scale operations." }),
        defineField({
          name: "primaryCta",
          title: "Primary CTA",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", initialValue: "Get a Quote in 60 Seconds" }),
            defineField({ name: "href", title: "Link", type: "string", initialValue: "/contact" }),
          ],
        }),
        defineField({
          name: "secondaryCta",
          title: "Secondary CTA",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", initialValue: "View Live Demos" }),
            defineField({ name: "href", title: "Link", type: "string", initialValue: "/demos" }),
          ],
        }),
        defineField({
          name: "consolePanel",
          title: "Console Panel",
          type: "object",
          description: "The command-center info panel in the hero",
          fields: [
            defineField({ name: "statusText", title: "Status Text", type: "string", initialValue: "Accepting builds" }),
            defineField({
              name: "statusColor",
              title: "Status Color",
              type: "string",
              options: { list: [
                { title: "Green (active)", value: "green" },
                { title: "Yellow (limited)", value: "yellow" },
                { title: "Red (closed)", value: "red" },
              ]},
              initialValue: "green",
            }),
            defineField({ name: "deploymentText", title: "Deployment Timeline", type: "string", initialValue: "7–21 days" }),
            defineField({ name: "modules", title: "Module Chips", type: "array", of: [{ type: "string" }], initialValue: ["Intake", "CRM", "Quote", "Invoices", "Automations", "Portal"] }),
            defineField({ name: "industries", title: "Industry Chips", type: "array", of: [{ type: "string" }], initialValue: ["HVAC", "Auto Repair", "Property Mgmt", "Law", "Insurance", "Salons"] }),
          ],
        }),
      ],
    }),

    // ═══ ANTHILL ═══
    defineField({
      name: "anthillSection",
      title: "Anthill Section",
      type: "object",
      group: "anthill",
      fields: [
        defineField({ name: "sectionLabel", title: "Section Label", type: "string", initialValue: "The Anthill Model" }),
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "The Website Is the Entrance. The System Is the Anthill." }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
        defineField({
          name: "surfaceItems",
          title: "Surface Layer Items (Customer-Facing)",
          type: "array",
          of: [{
            type: "object",
            fields: [
              defineField({ name: "icon", title: "Icon Name (Lucide)", type: "string" }),
              defineField({ name: "label", title: "Label", type: "string" }),
              defineField({ name: "description", title: "Description", type: "string" }),
            ],
            preview: { select: { title: "label" } },
          }],
        }),
        defineField({
          name: "undergroundItems",
          title: "Underground Items (Operations Engine)",
          type: "array",
          of: [{
            type: "object",
            fields: [
              defineField({ name: "icon", title: "Icon Name (Lucide)", type: "string" }),
              defineField({ name: "label", title: "Label", type: "string" }),
              defineField({ name: "description", title: "Description", type: "string" }),
            ],
            preview: { select: { title: "label" } },
          }],
        }),
      ],
    }),

    // ═══ INDUSTRY SELECTOR ═══
    defineField({
      name: "industrySection",
      title: "Industry Selector",
      type: "object",
      group: "industries",
      fields: [
        defineField({ name: "sectionLabel", title: "Section Label", type: "string", initialValue: "Industries We Serve" }),
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "Built for Your Vertical" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
        defineField({
          name: "industries",
          title: "Featured Industries",
          type: "array",
          of: [{ type: "reference", to: [{ type: "industry" }] }],
        }),
      ],
    }),

    // ═══ MODULES ═══
    defineField({
      name: "modulesSection",
      title: "Deployable Modules",
      type: "object",
      group: "modules",
      fields: [
        defineField({ name: "sectionLabel", title: "Section Label", type: "string", initialValue: "Deployable Modules" }),
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "Every Module Your Business Needs" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
        defineField({
          name: "modules",
          title: "Module Cards",
          type: "array",
          of: [{
            type: "object",
            fields: [
              defineField({ name: "name", title: "Module Name", type: "string" }),
              defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
              defineField({ name: "icon", title: "Icon Name (Lucide)", type: "string" }),
              defineField({ name: "features", title: "Feature List", type: "array", of: [{ type: "string" }] }),
              defineField({
                name: "tier",
                title: "Minimum Tier",
                type: "string",
                options: { list: [
                  { title: "Starter", value: "starter" },
                  { title: "Growth", value: "growth" },
                  { title: "Ops Stack", value: "ops" },
                ]},
              }),
            ],
            preview: { select: { title: "name", subtitle: "tier" } },
          }],
        }),
      ],
    }),

    // ═══ DEMOS GALLERY ═══
    defineField({
      name: "demosSection",
      title: "Live Demos Gallery",
      type: "object",
      group: "demos",
      fields: [
        defineField({ name: "sectionLabel", title: "Section Label", type: "string", initialValue: "Live Demos" }),
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "See It Working" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
        defineField({
          name: "demos",
          title: "Featured Demos",
          type: "array",
          of: [{ type: "reference", to: [{ type: "demo" }] }],
        }),
      ],
    }),

    // ═══ PROOF & RESULTS ═══
    defineField({
      name: "proofSection",
      title: "Results & Proof",
      type: "object",
      group: "proof",
      fields: [
        defineField({ name: "sectionLabel", title: "Section Label", type: "string", initialValue: "Results" }),
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "Systems That Produce Revenue" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
        defineField({
          name: "stats",
          title: "Key Stats",
          type: "array",
          of: [{
            type: "object",
            fields: [
              defineField({ name: "value", title: "Value", type: "string", description: "e.g. 3x, 40%, <24h" }),
              defineField({ name: "label", title: "Label", type: "string" }),
              defineField({ name: "icon", title: "Icon Name", type: "string" }),
            ],
            preview: { select: { title: "value", subtitle: "label" } },
          }],
        }),
        defineField({
          name: "processSteps",
          title: "Our Process Steps",
          type: "array",
          of: [{
            type: "object",
            fields: [
              defineField({ name: "step", title: "Step Number", type: "number" }),
              defineField({ name: "title", title: "Title", type: "string" }),
              defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
            ],
            preview: { select: { title: "title", subtitle: "step" } },
          }],
        }),
        defineField({
          name: "testimonials",
          title: "Testimonials",
          type: "array",
          of: [{
            type: "object",
            fields: [
              defineField({ name: "quote", title: "Quote", type: "text", rows: 3 }),
              defineField({ name: "name", title: "Name", type: "string" }),
              defineField({ name: "role", title: "Role", type: "string" }),
              defineField({ name: "company", title: "Company", type: "string" }),
              defineField({ name: "avatar", title: "Avatar", type: "image", options: { hotspot: true } }),
            ],
            preview: { select: { title: "name", subtitle: "company" } },
          }],
        }),
      ],
    }),

    // ═══ PRICING ═══
    defineField({
      name: "pricingSection",
      title: "Pricing Ladder",
      type: "object",
      group: "pricing",
      fields: [
        defineField({ name: "sectionLabel", title: "Section Label", type: "string", initialValue: "Pricing" }),
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "Systems That Pay for Themselves" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
        defineField({
          name: "tiers",
          title: "Pricing Tiers",
          type: "array",
          of: [{
            type: "object",
            fields: [
              defineField({ name: "name", title: "Tier Name", type: "string" }),
              defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" } }),
              defineField({ name: "tagline", title: "Tagline", type: "string" }),
              defineField({ name: "priceRange", title: "Price Range", type: "string", description: "e.g. $6k–$12k" }),
              defineField({ name: "timeline", title: "Timeline", type: "string", description: "e.g. 7–21 days" }),
              defineField({ name: "featured", title: "Featured (highlighted)", type: "boolean", initialValue: false }),
              defineField({ name: "features", title: "Included Features", type: "array", of: [{ type: "string" }] }),
              defineField({ name: "addOns", title: "Optional Add-Ons", type: "array", of: [{ type: "string" }] }),
              defineField({ name: "ctaLabel", title: "CTA Button Label", type: "string" }),
              defineField({ name: "ctaHref", title: "CTA Button Link", type: "string" }),
            ],
            preview: { select: { title: "name", subtitle: "priceRange" } },
          }],
        }),
      ],
    }),

    // ═══ CTA CLOSE ═══
    defineField({
      name: "ctaSection",
      title: "CTA Close Section",
      type: "object",
      group: "cta",
      fields: [
        defineField({ name: "headline", title: "Headline", type: "string", initialValue: "Ready to Replace Chaos with Systems?" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
        defineField({
          name: "primaryCta",
          title: "Primary CTA",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", initialValue: "Start Your Build" }),
            defineField({ name: "href", title: "Link", type: "string", initialValue: "/contact" }),
          ],
        }),
        defineField({
          name: "secondaryCta",
          title: "Secondary CTA",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", initialValue: "Book a Call" }),
            defineField({ name: "href", title: "Link", type: "string" }),
          ],
        }),
      ],
    }),

    // ═══ SEO ═══
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      group: "seo",
      fields: [
        defineField({ name: "metaTitle", title: "Meta Title", type: "string" }),
        defineField({ name: "metaDescription", title: "Meta Description", type: "text", rows: 3 }),
        defineField({ name: "ogImage", title: "OG Image", type: "image" }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Homepage" };
    },
  },
});
