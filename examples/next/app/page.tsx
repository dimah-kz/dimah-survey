import Link from "next/link";
import { ClipboardListIcon } from "lucide-react";

import { PageFrame } from "@/components/page-frame";
import { StartButton } from "@/components/start-button";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { listOwnDrafts, listPublished } from "@/lib/load";
import { questionCount, questionLabel, surveyTitle } from "@/lib/present";

export const dynamic = "force-dynamic";

export const metadata = { title: "Surveys" };

export default async function Page() {
  const [surveys, drafts] = await Promise.all([
    listPublished(),
    listOwnDrafts(),
  ]);
  const draftBySurvey = new Map<string, string>();
  for (const draft of drafts) {
    if (!draftBySurvey.has(draft.surveyId)) {
      draftBySurvey.set(draft.surveyId, draft.id);
    }
  }

  return (
    <PageFrame
      title="Surveys"
      description="Published surveys. This browser keeps one open draft."
    >
      {surveys.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardListIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing published</EmptyTitle>
            <EmptyDescription>
              Publish a survey in the studio and it will show up here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/studio" />}>
              Open studio
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {surveys.map((survey) => {
            const draftId = draftBySurvey.get(survey.id);
            const count = questionCount(
              survey.publishedJson ?? survey.draftJson,
            );
            return (
              <Card key={survey.id} size="sm">
                <CardHeader>
                  <CardTitle>
                    {surveyTitle(
                      survey.publishedJson ?? survey.draftJson,
                      survey.slug,
                    )}
                  </CardTitle>
                  <CardDescription>
                    {survey.slug} · {questionLabel(count)}
                  </CardDescription>
                  {draftId ? (
                    <CardAction>
                      <Badge variant="secondary">Draft</Badge>
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardFooter className="justify-end">
                  {draftId ? (
                    <Button
                      nativeButton={false}
                      render={<Link href={`/r/${draftId}`} />}
                    >
                      Continue
                    </Button>
                  ) : (
                    <StartButton surveyId={survey.id} />
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
