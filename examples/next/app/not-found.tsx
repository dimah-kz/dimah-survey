import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Not found</EmptyTitle>
          <EmptyDescription>
            That survey or response is not available.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/" />}>
            Back to surveys
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
