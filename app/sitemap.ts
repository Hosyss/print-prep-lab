import type { MetadataRoute } from "next";
import { GUIDE_PAGES, TOOL_PAGES, TRUST_PAGES } from "@/lib/site-content";
import { PRINT_PRESETS } from "@/lib/print-math";
import { SITE_UPDATED_AT, SITE_URL } from "@/lib/seo";

const STATIC_PATHS = ["", "/tools", "/sizes", "/guides"];
const POLICY_PATHS = ["/privacy", "/terms", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC_PATHS,
    ...TOOL_PAGES.map((tool) => `/tools/${tool.slug}`),
    ...PRINT_PRESETS.map((preset) => `/sizes/${preset.slug}`),
    ...GUIDE_PAGES.map((guide) => `/guides/${guide.slug}`),
    ...Object.keys(TRUST_PAGES).map((slug) => `/${slug}`),
    ...POLICY_PATHS,
  ];

  return paths.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    lastModified: new Date(SITE_UPDATED_AT),
  }));
}
