import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";

import { appName } from "@/lib/shared";

import "./global.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
