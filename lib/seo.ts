import type { Metadata } from "next";

export const SITE_NAME = "Print Prep Lab";
export const SITE_URL = "https://printpreplab.pages.dev";
export const SITE_DESCRIPTION =
  "Free browser-based tools for checking image print size, effective PPI, paper dimensions, cropping, bleed and safe areas before printing.";
export const SOCIAL_IMAGE_PATH = "/og-image.png";
export const SITE_UPDATED_AT = "2026-08-24";
export const SITE_LAUNCHED_AT = "2026-08-09";
export const AUTHOR_NAME = "Hossam Eldeen";
export const AUTHOR_PROFILE_PATH = "/about";
export const ADSENSE_CLIENT_ID = "ca-pub-3369551572403499";
export const DEFAULT_GOOGLE_VERIFICATION = "vc6AQqU29GL5NAhDOlsKu-UgKYHKxPiq5M9aDsSzFVU";
export const DEFAULT_BING_VERIFICATION = "A2E81C5F15BA075100FA4911952E2A04";

export const socialImage = {
  url: SOCIAL_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: "Print Prep Lab — know if your image is ready to print",
};

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const canonicalPath = path === "/" ? "/" : path.replace(/\/$/, "");
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE_PATH],
    },
  };
}

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      founder: {
        "@type": "Person",
        name: AUTHOR_NAME,
        url: `${SITE_URL}${AUTHOR_PROFILE_PATH}`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and a modern web browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Image print readiness checking",
        "Pixel and physical print size conversion",
        "Effective PPI calculation",
        "Aspect ratio and crop preview",
        "Bleed and safe area calculation",
      ],
    },
  ],
};
