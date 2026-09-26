"use client";

import {
  SURVEY_API_BASE_PATH,
  SURVEY_EDITOR_API_BASE_PATH,
} from "@dimah-survey/core";
import { createEditorClient, createFillClient } from "@dimah-survey/react";

export const fillClient = createFillClient({
  baseURL: SURVEY_API_BASE_PATH,
  credentials: "same-origin",
});

export const editorClient = createEditorClient({
  baseURL: SURVEY_EDITOR_API_BASE_PATH,
  credentials: "same-origin",
});
