"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Surveys" },
  { href: "/studio", label: "Studio" },
];

function isCurrent(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/r/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Link href="/" className="text-sm font-medium tracking-tight">
        Survey
      </Link>
      <nav className="flex items-center gap-1">
        {links.map((link) => {
          const current = isCurrent(link.href, pathname);
          return (
            <Button
              key={link.href}
              variant={current ? "secondary" : "ghost"}
              size="sm"
              nativeButton={false}
              aria-current={current ? "page" : undefined}
              render={<Link href={link.href} />}
            >
              {link.label}
            </Button>
          );
        })}
      </nav>
      <Button
        variant="ghost"
        size="icon"
        className="ms-auto"
        aria-label="Toggle theme"
        title="Toggle theme (D)"
        onClick={() => setTheme(dark ? "light" : "dark")}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </Button>
    </header>
  );
}
