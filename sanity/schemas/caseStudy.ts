import { defineType, defineField } from "sanity";

export default defineType({
  name: "caseStudy",
  title: "Case Studies (Systems Lab)",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Project Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (Rule) => Rule.required() }),
    defineField({ name: "client", title: "Client Name", type: "string" }),
    defineField({ name: "industry", title: "Industry", type: "reference", to: [{ type: "industry" }] }),
    defineField({ name: "shortDescription", title: "Short Description", type: "text", rows: 2 }),
    defineField({ name: "longDescription", title: "Full Breakdown", type: "array", of: [{ type: "block" }, { type: "image", options: { hotspot: true } }] }),
    defineField({ name: "heroImage", title: "Hero Image", type: "image", options: { hotspot: true } }),
    defineField({ name: "thumbnail", title: "Thumbnail", type: "image", options: { hotspot: true } }),
    defineField({
      name: "modules",
      title: "Modules Built",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "name", title: "Module Name", type: "string" }),
          defineField({ name: "description", title: "What It Does", type: "text", rows: 2 }),
          defineField({ name: "screenshot", title: "Screenshot", type: "image", options: { hotspot: true } }),
        ],
        preview: { select: { title: "name", media: "screenshot" } },
      }],
    }),
    defineField({ name: "flowDiagram", title: "Flow Diagram", type: "image", options: { hotspot: true }, description: "Lead → Quote → Job → Invoice → Payment → Follow-up diagram" }),
    defineField({
      name: "results",
      title: "Results / Outcomes",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "metric", title: "Metric Name", type: "string" }),
          defineField({ name: "value", title: "Value", type: "string" }),
          defineField({ name: "description", title: "Context", type: "string" }),
        ],
        preview: { select: { title: "metric", subtitle: "value" } },
      }],
    }),
    defineField({ name: "techStack", title: "Tech Stack", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "featured", title: "Featured on Homepage", type: "boolean", initialValue: false }),
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
    select: { title: "title", subtitle: "client", media: "thumbnail" },
  },
});
