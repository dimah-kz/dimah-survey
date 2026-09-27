import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";

import { appName, siteDescription, siteUrl } from "@/lib/shared";

import "./global.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: appName,
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: appName,
    title: appName,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: siteDescription,
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
