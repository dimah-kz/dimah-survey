import Link from "next/link";
import { InboxIcon } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { PageFrame } from "@/components/page-frame";
import { ResponseStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSurveyResponses, readSurvey } from "@/lib/load";
import { formatWhen, surveyTitle } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const survey = await readSurvey(surveyId);
  return {
    title: `${surveyTitle(survey.draftJson, survey.slug)} responses`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const survey = await readSurvey(surveyId);
  const listed = await listSurveyResponses(survey.id);
  const title = surveyTitle(survey.draftJson, survey.slug);

  return (
    <PageFrame
      back={<BackLink href={`/studio/${survey.id}`}>Studio</BackLink>}
      title={title}
      description={
        listed.total === 1 ? "1 response" : `${listed.total} responses`
      }
      action={
        <Button
          nativeButton={false}
          render={<Link href={`/studio/${survey.id}`} />}
        >
          Design
        </Button>
      }
    >
      {listed.responses.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No responses yet</EmptyTitle>
            <EmptyDescription>
              They appear here after someone starts the published survey.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-end">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listed.responses.map((response) => (
              <TableRow key={response.id}>
                <TableCell>
                  <ResponseStatusBadge status={response.status} />
                </TableCell>
                <TableCell>{formatWhen(response.updatedAt)}</TableCell>
                <TableCell>{formatWhen(response.submittedAt)}</TableCell>
                <TableCell className="text-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/studio/${survey.id}/responses/${response.id}`}
                      />
                    }
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageFrame>
  );
}
