"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { fillClient } from "@/lib/clients";
import { errorMessage } from "@/lib/errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function StartButton({ surveyId }: { surveyId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      const response = await fillClient.startResponse({ surveyId });
      router.push(`/r/${response.id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" disabled={pending} onClick={() => void start()}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Start
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not start</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
