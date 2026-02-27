import { defineType, defineField } from "sanity";

export default defineType({
  name: "demo",
  title: "Demos",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Demo Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (Rule) => Rule.required() }),
    defineField({ name: "industry", title: "Industry", type: "reference", to: [{ type: "industry" }] }),
    defineField({ name: "shortDescription", title: "Short Description", type: "text", rows: 2 }),
    defineField({ name: "longDescription", title: "Full Description", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "thumbnail", title: "Thumbnail", type: "image", options: { hotspot: true } }),
    defineField({ name: "modules", title: "Included Modules", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "features", title: "Feature Highlights", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "liveUrl", title: "Live Demo URL", type: "url" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: [
        { title: "Live", value: "live" },
        { title: "Coming Soon", value: "coming-soon" },
        { title: "In Development", value: "development" },
      ]},
      initialValue: "coming-soon",
    }),
    defineField({ name: "orderRank", title: "Sort Order", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "Sort Order", name: "orderRank", by: [{ field: "orderRank", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "status", media: "thumbnail" },
  },
});
