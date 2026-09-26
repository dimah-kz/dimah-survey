import { notFound } from "next/navigation";

import { BackLink } from "@/components/back-link";
import { PageFrame } from "@/components/page-frame";
import { ResponseStatusBadge } from "@/components/status-badge";
import { SurveyView } from "@/components/survey-view";
import { readResponse, readSurvey } from "@/lib/load";
import { formatWhen, surveyTitle } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surveyId: string; responseId: string }>;
}) {
  const { surveyId, responseId } = await params;
  const [survey, response] = await Promise.all([
    readSurvey(surveyId),
    readResponse(responseId),
  ]);
  if (response.surveyId !== survey.id) return { title: "Response" };
  return { title: surveyTitle(response.definition, survey.slug) };
}

export default async function Page({
  params,
}: {
  params: Promise<{ surveyId: string; responseId: string }>;
}) {
  const { surveyId, responseId } = await params;
  const [survey, response] = await Promise.all([
    readSurvey(surveyId),
    readResponse(responseId),
  ]);
  if (response.surveyId !== survey.id) notFound();

  return (
    <PageFrame
      back={
        <BackLink href={`/studio/${survey.id}/responses`}>Responses</BackLink>
      }
      title={surveyTitle(response.definition, survey.slug)}
      description="Answers against the snapshot stored on this response."
      action={<ResponseStatusBadge status={response.status} />}
    >
      <p className="text-sm text-muted-foreground">
        Updated {formatWhen(response.updatedAt)}
        {response.submittedAt
          ? ` · Submitted ${formatWhen(response.submittedAt)}`
          : null}
      </p>
      <SurveyView definition={response.definition} data={response.data} />
    </PageFrame>
  );
}
