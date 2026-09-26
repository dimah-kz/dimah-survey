"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SurveyCreator } from "survey-creator-react";
import type { SurveyJson, SurveyStatus } from "@dimah-survey/core";
import { useSurveyDraft } from "@dimah-survey/react";

import { BackLink } from "@/components/back-link";
import { SurveyStatusBadge } from "@/components/status-badge";
import { useSurveyTheme } from "@/components/use-survey-theme";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { editorClient } from "@/lib/clients";
import { errorMessage } from "@/lib/errors";
import { surveyTitle } from "@/lib/present";

import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";

const CreatorSurface = dynamic(
  () =>
    import("survey-creator-react").then((mod) => mod.SurveyCreatorComponent),
  { ssr: false },
);

function flushDraft(creator: SurveyCreator) {
  return new Promise<void>((resolve, reject) => {
    creator.saveSurveyFunc(0, (_saveNo: number, success: boolean) => {
      if (success) resolve();
      else reject(new Error("Could not save the draft."));
    });
  });
}

export function SurveyDesigner({
  surveyId,
  slug,
  draftJson,
  updatedAt,
  status,
}: {
  surveyId: string;
  slug: string;
  draftJson: SurveyJson;
  updatedAt: string;
  status: SurveyStatus;
}) {
  const router = useRouter();
  const snapshot = JSON.stringify(draftJson);
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [pending, setPending] = useState<"publish" | "archive" | null>(null);
  const [actionError, setActionError] = useState<string>();
  const { saveError, stale } = useSurveyDraft({
    client: editorClient,
    surveyId,
    creator,
    updatedAt,
  });
  useSurveyTheme(creator);

  useEffect(() => {
    let cancelled = false;
    let created: SurveyCreator | undefined;

    void import("survey-creator-react").then(({ SurveyCreator }) => {
      if (cancelled) return;
      created = new SurveyCreator({
        showTranslationTab: false,
        showThemeTab: false,
      });
      created.autoSaveDelay = 800;
      created.JSON = JSON.parse(snapshot) as SurveyJson;
      setCreator(created);
    });

    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [snapshot, surveyId]);

  async function publish() {
    if (!creator || pending) return;
    setPending("publish");
    setActionError(undefined);
    try {
      await flushDraft(creator);
      await editorClient.publishSurvey({ id: surveyId });
      router.refresh();
    } catch (cause) {
      setActionError(errorMessage(cause));
      setPending(null);
    }
  }

  async function archive() {
    if (!creator || pending) return;
    setPending("archive");
    setActionError(undefined);
    try {
      await flushDraft(creator);
      await editorClient.archiveSurvey({ id: surveyId });
      router.refresh();
    } catch (cause) {
      setActionError(errorMessage(cause));
      setPending(null);
    }
  }

  const title = surveyTitle(draftJson, slug);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3">
        <BackLink href="/studio">Studio</BackLink>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-medium">{title}</h1>
            <SurveyStatusBadge status={status} />
          </div>
          <p className="truncate text-sm text-muted-foreground">
            Draft autosaves. Publish is separate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/studio/${surveyId}/responses`} />}
          >
            Responses
          </Button>
          {status === "archived" ? null : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending !== null || !creator}
              onClick={() => void archive()}
            >
              {pending === "archive" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Archive
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={pending !== null || !creator}
            onClick={() => void publish()}
          >
            {pending === "publish" ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            Publish
          </Button>
        </div>
      </div>
      {actionError ? (
        <div className="px-4 pt-3">
          <Alert variant="destructive">
            <AlertTitle>Could not update the survey</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {saveError ? (
        <div className="px-4 pt-3">
          <Alert variant={stale ? "default" : "destructive"}>
            <AlertTitle>
              {stale ? "This draft was saved somewhere else" : "Could not save"}
            </AlertTitle>
            <AlertDescription>{saveError.message}</AlertDescription>
            {stale ? (
              <AlertAction>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => router.refresh()}
                >
                  Reload
                </Button>
              </AlertAction>
            ) : null}
          </Alert>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 [&_.svc-creator]:h-full">
        {creator ? (
          <CreatorSurface creator={creator} />
        ) : (
          <Skeleton className="h-full rounded-none" />
        )}
      </div>
    </div>
  );
}
