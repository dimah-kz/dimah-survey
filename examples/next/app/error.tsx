"use client";

import { PageFrame } from "@/components/page-frame";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageFrame
      title="Something went wrong"
      description={error.message || "This page could not be loaded."}
    >
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </PageFrame>
  );
}
