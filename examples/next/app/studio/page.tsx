import Link from "next/link";
import { ClipboardListIcon } from "lucide-react";

import { NewSurveyDialog } from "@/components/new-survey-dialog";
import { PageFrame } from "@/components/page-frame";
import { SurveyStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listAllSurveys } from "@/lib/load";
import {
  formatWhen,
  hasUnpublishedEdits,
  questionCount,
  questionLabel,
  surveyTitle,
} from "@/lib/present";

export const dynamic = "force-dynamic";

export const metadata = { title: "Studio" };

export default async function Page() {
  const surveys = await listAllSurveys();

  return (
    <PageFrame
      title="Studio"
      description="Autosave keeps the draft. Publish is what new responses copy."
      action={<NewSurveyDialog />}
    >
      {surveys.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardListIcon />
            </EmptyMedia>
            <EmptyTitle>No surveys yet</EmptyTitle>
            <EmptyDescription>
              Create one to open Creator. Publishing makes it fillable.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {surveys.map((survey) => (
            <Card key={survey.id} size="sm">
              <CardHeader>
                <CardTitle>
                  {surveyTitle(survey.draftJson, survey.slug)}
                </CardTitle>
                <CardDescription>
                  {survey.slug} ·{" "}
                  {questionLabel(questionCount(survey.draftJson))} · Updated{" "}
                  {formatWhen(survey.updatedAt)}
                </CardDescription>
                <CardAction>
                  <div className="flex items-center gap-2">
                    {hasUnpublishedEdits(survey) ? (
                      <Badge variant="outline">Unpublished edits</Badge>
                    ) : null}
                    <SurveyStatusBadge status={survey.status} />
                  </div>
                </CardAction>
              </CardHeader>
              <CardFooter className="justify-end gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/studio/${survey.id}/responses`} />}
                >
                  Responses
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href={`/studio/${survey.id}`} />}
                >
                  Design
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
