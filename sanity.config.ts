import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "nexavision-studio",
  title: "NexaVision Studio",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // Singletons at the top
            S.listItem()
              .title("Site Settings")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),
            S.listItem()
              .title("Homepage")
              .id("homepage")
              .child(
                S.document()
                  .schemaType("homepage")
                  .documentId("homepage")
              ),
            S.listItem()
              .title("Pricing Page")
              .id("pricingPage")
              .child(
                S.document()
                  .schemaType("pricingPage")
                  .documentId("pricingPage")
              ),
            S.divider(),
            // Collections
            ...S.documentTypeListItems().filter(
              (item) =>
                !["siteSettings", "homepage", "pricingPage"].includes(
                  item.getId() as string
                )
            ),
          ]),
    }),
    visionTool({ defaultApiVersion: "2024-01-01" }),
  ],
  schema: {
    types: schemaTypes,
  },
});
