import type { Metadata } from "next";

export const SITE_NAME = "Print Prep Lab";
export const SITE_URL = "https://printpreplab.pages.dev";
export const SITE_DESCRIPTION =
  "Free browser-based tools for checking image print size, effective PPI, paper dimensions, cropping, bleed and safe areas before printing.";
export const SOCIAL_IMAGE_PATH = "/og-image.png";
export const SITE_UPDATED_AT = "2026-08-11";

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
  const canonical = path === "/" ? "/" : path.replace(/\/$/, "");

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
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
