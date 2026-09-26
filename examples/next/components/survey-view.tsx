"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Model } from "survey-core";
import type { SurveyJson, SurveyResult } from "@dimah-survey/core";

import { useSurveyTheme } from "@/components/use-survey-theme";

import "survey-core/survey-core.min.css";

const Survey = dynamic(
  () => import("survey-react-ui").then((mod) => mod.Survey),
  { ssr: false },
);

export function SurveyView({
  definition,
  data,
}: {
  definition: SurveyJson;
  data: SurveyResult;
}) {
  const snapshot = JSON.stringify({ definition, data });
  const model = useMemo(() => {
    const parsed = JSON.parse(snapshot) as {
      definition: SurveyJson;
      data: SurveyResult;
    };
    const next = new Model(parsed.definition);
    next.data = parsed.data;
    next.mode = "display";
    return next;
  }, [snapshot]);
  useSurveyTheme(model);

  return <Survey model={model} />;
}
