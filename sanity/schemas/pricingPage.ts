import { defineType, defineField } from "sanity";

export default defineType({
  name: "pricingPage",
  title: "Pricing Page",
  type: "document",
  fields: [
    defineField({ name: "headline", title: "Headline", type: "string" }),
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
          defineField({ name: "priceRange", title: "Price Range", type: "string" }),
          defineField({ name: "timeline", title: "Timeline", type: "string" }),
          defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
          defineField({
            name: "features",
            title: "Features",
            type: "array",
            of: [{
              type: "object",
              fields: [
                defineField({ name: "text", title: "Feature", type: "string" }),
                defineField({ name: "included", title: "Included", type: "boolean", initialValue: true }),
              ],
              preview: { select: { title: "text", subtitle: "included" } },
            }],
          }),
          defineField({ name: "addOns", title: "Add-Ons", type: "array", of: [{ type: "string" }] }),
          defineField({ name: "ctaLabel", title: "CTA Label", type: "string" }),
          defineField({ name: "ctaHref", title: "CTA Link", type: "string" }),
        ],
        preview: { select: { title: "name", subtitle: "priceRange" } },
      }],
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "question", title: "Question", type: "string" }),
          defineField({ name: "answer", title: "Answer", type: "text", rows: 4 }),
        ],
        preview: { select: { title: "question" } },
      }],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({ name: "metaTitle", title: "Meta Title", type: "string" }),
        defineField({ name: "metaDescription", title: "Meta Description", type: "text", rows: 3 }),
      ],
    }),
  ],
  preview: {
    prepare() { return { title: "Pricing Page" }; },
  },
});
