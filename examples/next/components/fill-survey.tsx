"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { ResponseStatus } from "@dimah-survey/core";
import { useSurveyResponse } from "@dimah-survey/react";

import { BackLink } from "@/components/back-link";
import { ResponseStatusBadge } from "@/components/status-badge";
import { useSurveyTheme } from "@/components/use-survey-theme";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { fillClient } from "@/lib/clients";
import { errorMessage } from "@/lib/errors";

import "survey-core/survey-core.min.css";

const Survey = dynamic(
  () => import("survey-react-ui").then((mod) => mod.Survey),
  { ssr: false },
);

export function FillSurvey({
  responseId,
  status,
}: {
  responseId: string;
  status: ResponseStatus;
}) {
  const router = useRouter();
  const { model, error, saveError, stale, reload } = useSurveyResponse({
    client: fillClient,
    responseId,
  });
  const [pending, setPending] = useState<"discard" | "reopen" | null>(null);
  const [actionError, setActionError] = useState<string>();
  useSurveyTheme(model);

  useEffect(() => {
    if (!model) return;
    const onComplete = () => {
      router.refresh();
    };
    model.onComplete.add(onComplete);
    return () => {
      model.onComplete.remove(onComplete);
    };
  }, [model, router]);

  async function discard() {
    if (pending) return;
    setPending("discard");
    setActionError(undefined);
    try {
      await fillClient.abandonResponse({ id: responseId });
      router.push("/");
      router.refresh();
    } catch (cause) {
      setActionError(errorMessage(cause));
      setPending(null);
    }
  }

  async function reopen() {
    if (pending) return;
    setPending("reopen");
    setActionError(undefined);
    try {
      await fillClient.reopenResponse({ id: responseId });
      reload();
      router.refresh();
    } catch (cause) {
      setActionError(errorMessage(cause));
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href="/">Surveys</BackLink>
        <div className="flex items-center gap-2">
          {status === "draft" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending !== null}
              onClick={() => void discard()}
            >
              {pending === "discard" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Discard
            </Button>
          ) : (
            <>
              <ResponseStatusBadge status={status} />
              <Button
                type="button"
                variant="outline"
                disabled={pending !== null}
                onClick={() => void reopen()}
              >
                {pending === "reopen" ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Reopen
              </Button>
            </>
          )}
        </div>
      </div>
      {status === "draft" ? (
        <p className="text-sm text-muted-foreground">
          Drafts save as you move between pages.
        </p>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not open this response</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not update this response</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      {saveError ? (
        <Alert variant={stale ? "default" : "destructive"}>
          <AlertTitle>
            {stale ? "This draft changed elsewhere" : "Could not save"}
          </AlertTitle>
          <AlertDescription>{saveError.message}</AlertDescription>
          {stale ? (
            <Button type="button" size="sm" variant="outline" onClick={reload}>
              Reload
            </Button>
          ) : null}
        </Alert>
      ) : null}
      {model ? <Survey model={model} /> : error ? null : <FillSkeleton />}
    </div>
  );
}

function FillSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
