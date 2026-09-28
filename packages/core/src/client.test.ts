import { describe, expect, it } from "vitest";

import { createEditorClient, createFillClient } from "./client";
import { SURVEY_EDITOR_API_BASE_PATH } from "./routes";

describe("survey clients", () => {
  it("exposes only the operations for that audience", () => {
    expect(Object.keys(createFillClient()).sort()).toEqual([
      "abandonResponse",
      "getPublishedSurvey",
      "getResponse",
      "listResponses",
      "reopenResponse",
      "savePartial",
      "startResponse",
      "submitResponse",
    ]);
    expect(Object.keys(createEditorClient()).sort()).toEqual([
      "archiveSurvey",
      "getResponse",
      "getSurvey",
      "listResponses",
      "listSurveyVersions",
      "listSurveys",
      "publishSurvey",
      "resumeSurvey",
      "saveSurvey",
      "saveSurveySettings",
    ]);
  });

  it("defaults each client to its mount", async () => {
    const seen: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      seen.push(input instanceof Request ? input.url : String(input));
      return Response.json({ id: "pulse" });
    };
    await createFillClient({ fetch: fetchImpl }).getPublishedSurvey("pulse");
    await createEditorClient({ fetch: fetchImpl }).getSurvey("pulse");
    expect(seen[0]).toContain("/api/survey/survey/published");
    expect(seen[0]).not.toContain(SURVEY_EDITOR_API_BASE_PATH);
    expect(seen[1]).toContain(`${SURVEY_EDITOR_API_BASE_PATH}/survey`);
  });

  it("sends headers from a function", async () => {
    let tenant: string | null = null;
    const fetchImpl: typeof fetch = async (input, init) => {
      const headers = new Headers(
        input instanceof Request ? input.headers : init?.headers,
      );
      tenant = headers.get("x-tenant");
      return Response.json({ id: "pulse" });
    };
    const client = createFillClient({
      fetch: fetchImpl,
      headers: async () => ({ "x-tenant": "acme" }),
    });
    await client.getPublishedSurvey("pulse");
    expect(tenant).toBe("acme");
  });

  it("maps a protocol error body onto APIError", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          message: "Survey result is invalid.",
          code: "VALIDATION_FAILED",
          questions: ["q1"],
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    const client = createFillClient({ fetch: fetchImpl });
    await expect(client.getPublishedSurvey("pulse")).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Survey result is invalid.",
      body: { questions: ["q1"] },
    });
  });

  it("falls back when the body is not a protocol error", async () => {
    const client = createFillClient({
      fetch: async () =>
        new Response("nope", { status: 500, statusText: "Server Error" }),
    });
    await expect(client.getPublishedSurvey("pulse")).rejects.toMatchObject({
      message: "Server Error",
    });

    const named = createFillClient({
      fetch: async () =>
        Response.json(
          { error: "offline" },
          { status: 400, statusText: "Bad Request" },
        ),
    });
    await expect(named.getPublishedSurvey("pulse")).rejects.toMatchObject({
      message: "offline",
    });
  });
});
