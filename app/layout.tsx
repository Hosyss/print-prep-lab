import type { Metadata, Viewport } from "next";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { LanguageProvider } from "@/components/language-provider";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import {
  ADSENSE_CLIENT_ID,
  DEFAULT_BING_VERIFICATION,
  DEFAULT_GOOGLE_VERIFICATION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  siteStructuredData,
  socialImage,
} from "@/lib/seo";
import "./globals.css";

const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || DEFAULT_GOOGLE_VERIFICATION;
const bingVerification =
  process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || DEFAULT_BING_VERIFICATION;

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
  themeColor: "#071a3a",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c") }}
        />
        <LanguageProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <AnalyticsConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
