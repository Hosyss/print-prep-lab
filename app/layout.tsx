import type { Metadata, Viewport } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  siteStructuredData,
  socialImage,
} from "@/lib/seo";
import "./globals.css";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Print Prep Lab — Check Image Size, PPI, Crop & Bleed", template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: "Print Prep Lab — Check Image Size, PPI, Crop & Bleed",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Print Prep Lab — Check Image Size, PPI, Crop & Bleed",
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE_PATH],
  },
  verification:
    googleVerification || bingVerification
      ? {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
        }
      : undefined,
};

export const viewport: Viewport = {
  themeColor: "#f2f0e8",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c") }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
