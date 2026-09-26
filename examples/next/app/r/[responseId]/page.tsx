import { FillSurvey } from "@/components/fill-survey";
import { readOwnResponse } from "@/lib/load";
import { surveyTitle } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = await params;
  const response = await readOwnResponse(responseId);
  return { title: surveyTitle(response.definition, "Survey") };
}

export default async function Page({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = await params;
  const response = await readOwnResponse(responseId);
  return <FillSurvey responseId={response.id} status={response.status} />;
}
