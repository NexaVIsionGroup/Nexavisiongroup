import { defineType, defineField } from "sanity";

export default defineType({
  name: "industry",
  title: "Industries",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Industry Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" }, validation: (Rule) => Rule.required() }),
    defineField({ name: "shortDescription", title: "Short Description", type: "text", rows: 2, description: "Used on industry cards and tiles" }),
    defineField({ name: "longDescription", title: "Full Description", type: "array", of: [{ type: "block" }], description: "Rich text for the industry landing page" }),
    defineField({ name: "icon", title: "Icon Name (Lucide)", type: "string", description: "e.g. Wrench, Building2, Thermometer" }),
    defineField({ name: "color", title: "Accent Color (hex)", type: "string", initialValue: "#00E5CC", description: "Used for tinting this industry's cards and pages" }),
    defineField({ name: "heroImage", title: "Hero Image", type: "image", options: { hotspot: true } }),
    defineField({ name: "thumbnail", title: "Thumbnail", type: "image", options: { hotspot: true } }),
    defineField({
      name: "painPoints",
      title: "Pain Points",
      type: "array",
      description: "Industry-specific problems we solve",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "title", title: "Title", type: "string" }),
          defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
          defineField({ name: "icon", title: "Icon Name", type: "string" }),
        ],
        preview: { select: { title: "title" } },
      }],
    }),
    defineField({
      name: "keyModules",
      title: "Key Modules for This Industry",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "name", title: "Module Name", type: "string" }),
          defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
          defineField({ name: "icon", title: "Icon Name", type: "string" }),
        ],
        preview: { select: { title: "name" } },
      }],
    }),
    defineField({
      name: "signatureModule",
      title: "Signature Module",
      type: "object",
      description: "The ONE standout module for this vertical's demo",
      fields: [
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
        defineField({ name: "features", title: "Features", type: "array", of: [{ type: "string" }] }),
      ],
    }),
    defineField({ name: "demoLink", title: "Demo Link", type: "string", description: "URL to the interactive demo for this industry" }),
    defineField({
      name: "stats",
      title: "Industry Stats",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "value", title: "Value", type: "string" }),
          defineField({ name: "label", title: "Label", type: "string" }),
        ],
        preview: { select: { title: "value", subtitle: "label" } },
      }],
    }),
    defineField({ name: "orderRank", title: "Sort Order", type: "number", initialValue: 10 }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({ name: "metaTitle", title: "Meta Title", type: "string" }),
        defineField({ name: "metaDescription", title: "Meta Description", type: "text", rows: 3 }),
        defineField({ name: "ogImage", title: "OG Image", type: "image" }),
      ],
    }),
  ],
  orderings: [{ title: "Sort Order", name: "orderRank", by: [{ field: "orderRank", direction: "asc" }] }],
  preview: {
    select: { title: "name", subtitle: "shortDescription", media: "thumbnail" },
  },
});
