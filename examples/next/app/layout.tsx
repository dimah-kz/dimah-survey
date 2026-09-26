import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Survey",
    template: "%s · Survey",
  },
  description: "Draft, publish, and collect SurveyJS responses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, fontMono.variable, "font-sans antialiased")}
    >
      <body>
        <ThemeProvider>
          <div className="flex h-svh flex-col bg-background">
            <SiteHeader />
            <main className="flex min-h-0 flex-1 flex-col overflow-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
