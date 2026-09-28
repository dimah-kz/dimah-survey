import type { Metadata, Viewport } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";

import {
  appName,
  serializeJsonLd,
  siteDescription,
  siteJsonLd,
  siteKeywords,
  siteTitle,
} from "@/lib/shared";
import { getSiteUrl, isProductionDeploy } from "@/lib/site-url";

import "./global.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = getSiteUrl();
const isProduction = isProductionDeploy();

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: appName,
  title: {
    default: siteTitle,
    template: `%s · ${appName}`,
  },
  description: siteDescription,
  category: "technology",
  keywords: [...siteKeywords],
  authors: [{ name: "dimah", url: "https://github.com/dimah-kz" }],
  creator: "@dimahkzx",
  publisher: appName,
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": [
        { url: "/llms.txt", title: "llms.txt" },
        { url: "/llms-full.txt", title: "llms-full.txt" },
      ],
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl.origin,
    siteName: appName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    site: "@dimahkzx",
    creator: "@dimahkzx",
    title: siteTitle,
    description: siteDescription,
  },
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function Layout({ children }: LayoutProps<"/">) {
  const jsonLd = siteJsonLd(siteUrl.origin);

  return (
    <html
      lang="en"
      className={inter.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(jsonLd),
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
