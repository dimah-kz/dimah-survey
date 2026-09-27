import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";

import { appName, siteDescription } from "@/lib/shared";

import "./global.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  applicationName: appName,
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
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
