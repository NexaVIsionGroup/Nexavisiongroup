import { defineType, defineField } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  groups: [
    { name: "branding", title: "Branding" },
    { name: "navigation", title: "Navigation" },
    { name: "footer", title: "Footer" },
    { name: "contact", title: "Contact & Social" },
    { name: "seo", title: "SEO" },
    { name: "advanced", title: "Advanced" },
  ],
  fields: [
    // ── Branding ──
    defineField({
      name: "siteName",
      title: "Site Name",
      type: "string",
      group: "branding",
      initialValue: "NexaVision Group",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      group: "branding",
      initialValue: "Revenue Infrastructure for Service Businesses",
    }),
    defineField({
      name: "description",
      title: "Site Description",
      type: "text",
      rows: 3,
      group: "branding",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "object",
      group: "branding",
      description: "Primary logo with positioning controls",
      fields: [
        defineField({
          name: "image",
          title: "Logo Image",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "width",
          title: "Display Width (px)",
          type: "number",
          initialValue: 180,
          validation: (Rule) => Rule.min(40).max(400),
          description: "Logo width in pixels",
        }),
        defineField({
          name: "height",
          title: "Display Height (px)",
          type: "number",
          initialValue: 48,
          validation: (Rule) => Rule.min(20).max(200),
          description: "Logo height in pixels. Leave blank to auto-scale from width.",
        }),
        defineField({
          name: "offsetX",
          title: "Horizontal Offset (px)",
          type: "number",
          initialValue: 0,
          description: "Shift logo left (negative) or right (positive)",
        }),
        defineField({
          name: "offsetY",
          title: "Vertical Offset (px)",
          type: "number",
          initialValue: 0,
          description: "Shift logo up (negative) or down (positive)",
        }),
      ],
    }),
    defineField({
      name: "logoMark",
      title: "Logo Mark (Icon only)",
      type: "object",
      group: "branding",
      description: "Small icon version for mobile / favicon",
      fields: [
        defineField({
          name: "image",
          title: "Logo Mark Image",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "width",
          title: "Display Width (px)",
          type: "number",
          initialValue: 36,
        }),
        defineField({
          name: "height",
          title: "Display Height (px)",
          type: "number",
          initialValue: 36,
        }),
      ],
    }),
    defineField({
      name: "favicon",
      title: "Favicon",
      type: "image",
      group: "branding",
    }),
    defineField({
      name: "socialImage",
      title: "Default Social Share Image",
      type: "image",
      group: "branding",
      description: "Used when pages don't have their own OG image (1200x630 recommended)",
    }),

    // ── Announcement Bar ──
    defineField({
      name: "announcement",
      title: "Announcement Bar",
      type: "object",
      group: "branding",
      fields: [
        defineField({ name: "enabled", title: "Show Announcement", type: "boolean", initialValue: false }),
        defineField({ name: "text", title: "Announcement Text", type: "string" }),
        defineField({ name: "link", title: "Link URL", type: "url" }),
        defineField({ name: "linkText", title: "Link Label", type: "string", initialValue: "Learn more →" }),
      ],
    }),

    // ── Navigation ──
    defineField({
      name: "navigation",
      title: "Navigation",
      type: "object",
      group: "navigation",
      fields: [
        defineField({
          name: "items",
          title: "Menu Items",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "label", title: "Label", type: "string" }),
                defineField({ name: "href", title: "Link", type: "string" }),
                defineField({
                  name: "children",
                  title: "Dropdown Items",
                  type: "array",
                  of: [
                    {
                      type: "object",
                      fields: [
                        defineField({ name: "label", title: "Label", type: "string" }),
                        defineField({ name: "href", title: "Link", type: "string" }),
                        defineField({ name: "description", title: "Description", type: "string" }),
                      ],
                    },
                  ],
                }),
              ],
              preview: {
                select: { title: "label", subtitle: "href" },
              },
            },
          ],
        }),
        defineField({
          name: "ctaButton",
          title: "CTA Button",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", initialValue: "Get a Quote" }),
            defineField({ name: "href", title: "Link", type: "string", initialValue: "/contact" }),
          ],
        }),
      ],
    }),

    // ── Footer ──
    defineField({
      name: "footer",
      title: "Footer",
      type: "object",
      group: "footer",
      fields: [
        defineField({ name: "tagline", title: "Footer Tagline", type: "string" }),
        defineField({
          name: "columns",
          title: "Footer Columns",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "title", title: "Column Title", type: "string" }),
                defineField({
                  name: "links",
                  title: "Links",
                  type: "array",
                  of: [
                    {
                      type: "object",
                      fields: [
                        defineField({ name: "label", title: "Label", type: "string" }),
                        defineField({ name: "href", title: "URL", type: "string" }),
                        defineField({ name: "isExternal", title: "Opens in new tab", type: "boolean", initialValue: false }),
                      ],
                      preview: { select: { title: "label", subtitle: "href" } },
                    },
                  ],
                }),
              ],
              preview: { select: { title: "title" } },
            },
          ],
        }),
        defineField({ name: "bottomText", title: "Bottom Bar Text", type: "string" }),
        defineField({ name: "showSocials", title: "Show Social Icons", type: "boolean", initialValue: true }),
      ],
    }),

    // ── Contact & Social ──
    defineField({ name: "contactEmail", title: "Contact Email", type: "string", group: "contact" }),
    defineField({ name: "contactPhone", title: "Contact Phone", type: "string", group: "contact" }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      group: "contact",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
              options: {
                list: [
                  { title: "LinkedIn", value: "linkedin" },
                  { title: "X (Twitter)", value: "twitter" },
                  { title: "Instagram", value: "instagram" },
                  { title: "Facebook", value: "facebook" },
                  { title: "YouTube", value: "youtube" },
                  { title: "GitHub", value: "github" },
                  { title: "TikTok", value: "tiktok" },
                ],
              },
            }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        },
      ],
    }),

    // ── SEO ──
    defineField({
      name: "seo",
      title: "Default SEO",
      type: "object",
      group: "seo",
      fields: [
        defineField({ name: "metaTitle", title: "Default Meta Title", type: "string" }),
        defineField({ name: "metaDescription", title: "Default Meta Description", type: "text", rows: 3 }),
        defineField({ name: "ogImage", title: "Default OG Image", type: "image" }),
      ],
    }),
  ],
  preview: {
    select: { title: "siteName" },
  },
});
