import { HomeLayout } from "fumadocs-ui/layouts/home";
import { PreReleaseBanner } from "@/components/pre-release-banner";
import { SiteFooter } from "@/components/site-footer";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <PreReleaseBanner />
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
      <SiteFooter />
    </div>
  );
}
