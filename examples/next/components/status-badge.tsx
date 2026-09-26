import type { ResponseStatus, SurveyStatus } from "@dimah-survey/core";

import { Badge } from "@/components/ui/badge";

const surveyVariant = {
  draft: "secondary",
  active: "default",
  archived: "outline",
} as const;

const surveyLabel = {
  draft: "Draft",
  active: "Published",
  archived: "Archived",
} as const;

const responseVariant = {
  draft: "secondary",
  submitted: "default",
  abandoned: "outline",
} as const;

const responseLabel = {
  draft: "Draft",
  submitted: "Submitted",
  abandoned: "Discarded",
} as const;

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  return <Badge variant={surveyVariant[status]}>{surveyLabel[status]}</Badge>;
}

export function ResponseStatusBadge({ status }: { status: ResponseStatus }) {
  return (
    <Badge variant={responseVariant[status]}>{responseLabel[status]}</Badge>
  );
}
