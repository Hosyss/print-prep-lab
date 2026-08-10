import type { MetadataRoute } from "next";
import { GUIDE_PAGES, TOOL_PAGES, TRUST_PAGES } from "@/lib/site-content";
import { PRINT_PRESETS } from "@/lib/print-math";
import { SITE_UPDATED_AT, SITE_URL } from "@/lib/seo";

const STATIC_PATHS = ["", "/tools", "/sizes", "/guides"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC_PATHS,
    ...TOOL_PAGES.map((tool) => `/tools/${tool.slug}`),
    ...PRINT_PRESETS.map((preset) => `/sizes/${preset.slug}`),
    ...GUIDE_PAGES.map((guide) => `/guides/${guide.slug}`),
    ...Object.keys(TRUST_PAGES).map((slug) => `/${slug}`),
  ];

  return paths.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    lastModified: new Date(SITE_UPDATED_AT),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.split("/").filter(Boolean).length === 1 ? 0.8 : 0.7,
  }));
}
