import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      nativeButton={false}
      render={<Link href={href} />}
    >
      <ArrowLeftIcon data-icon="inline-start" />
      {children}
    </Button>
  );
}
