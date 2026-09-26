import { SurveyDesigner } from "@/components/survey-designer";
import { readSurvey } from "@/lib/load";
import { surveyTitle } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const survey = await readSurvey(surveyId);
  return { title: surveyTitle(survey.draftJson, survey.slug) };
}

export default async function Page({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const survey = await readSurvey(surveyId);

  return (
    <SurveyDesigner
      key={`${survey.id}:${survey.updatedAt}`}
      surveyId={survey.id}
      slug={survey.slug}
      draftJson={survey.draftJson}
      updatedAt={survey.updatedAt}
      status={survey.status}
    />
  );
}
