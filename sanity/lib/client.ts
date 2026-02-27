import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  // Set to false for authenticated requests / preview mode
  perspective: "published",
});

// Preview client (for draft content in Sanity Studio)
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "previewDrafts",
  token: process.env.SANITY_API_READ_TOKEN,
});

// Image URL builder
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Helper to get client based on preview mode
export function getClient(preview = false) {
  return preview ? previewClient : client;
}
