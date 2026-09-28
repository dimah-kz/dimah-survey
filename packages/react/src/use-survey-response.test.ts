// @vitest-environment happy-dom

import { APIError, SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderHook } from "./test/render-hook";
import { useSurveyResponse } from "./use-survey-response";

const definition = {
  pages: [
    { name: "p1", elements: [{ type: "text", name: "q1" }] },
    { name: "p2", elements: [{ type: "text", name: "q2" }] },
    { name: "p3", elements: [{ type: "text", name: "q3" }] },
  ],
};

function response(patch?: {
  id?: string;
  status?: "draft" | "submitted";
  data?: Record<string, unknown>;
  updatedAt?: string;
}) {
  return {
    id: patch?.id ?? "response-1",
    surveyId: "pulse",
    respondentId: null,
    status: patch?.status ?? "draft",
    versionId: "version-1",
    definition,
    data: patch?.data ?? { q1: "Ada" },
    createdAt: "t0",
    updatedAt: patch?.updatedAt ?? "t0",
    submittedAt: patch?.status === "submitted" ? "t0" : null,
  };
}

function clientFor(initial = response()) {
  const state = { current: initial };
  const client = {
    getResponse: vi.fn(async (id: string) =>
      id === state.current.id
        ? state.current
        : response({ id, data: { q1: "Bob" } }),
    ),
    savePartial: vi.fn(async () => ({ ...state.current, updatedAt: "t1" })),
    submitResponse: vi.fn(async () => ({
      ...state.current,
      status: "submitted" as const,
      updatedAt: "t2",
      submittedAt: "t2",
    })),
  };
  return { client, state };
}

async function mounted(options: Parameters<typeof useSurveyResponse>[0]) {
  return renderHook(
    (props: typeof options) => useSurveyResponse(props),
    options,
  );
}

describe("useSurveyResponse", () => {
  it("hydrates a draft and sends partial saves with the compare-and-swap token", async () => {
    const { client } = clientFor();
    client.savePartial
      .mockResolvedValueOnce({ ...response(), updatedAt: "t1" })
      .mockResolvedValueOnce({ ...response(), updatedAt: "t2" });
    const view = await mounted({ client, responseId: "response-1" });
    await vi.waitFor(() =>
      expect(view.result.current.model?.data).toEqual({ q1: "Ada" }),
    );
    const model = view.result.current.model;
    if (!model) throw new Error("Missing model");
    model.nextPage();
    await vi.waitFor(() => expect(client.savePartial).toHaveBeenCalledOnce());
    await act(async () => {
      await client.savePartial.mock.results[0]?.value;
    });
    expect(client.savePartial).toHaveBeenCalledWith({
      id: "response-1",
      data: { q1: "Ada" },
      expectedUpdatedAt: "t0",
    });
    model.nextPage();
    await vi.waitFor(() => expect(client.savePartial).toHaveBeenCalledTimes(2));
    expect(client.savePartial).toHaveBeenLastCalledWith({
      id: "response-1",
      data: { q1: "Ada" },
      expectedUpdatedAt: "t1",
    });
    await view.unmount();
  });

  it("leaves the model mounted when a write fails", async () => {
    const { client } = clientFor();
    client.savePartial.mockRejectedValueOnce(new Error("offline"));
    const view = await mounted({ client, responseId: "response-1" });
    await vi.waitFor(() => expect(view.result.current.model).not.toBeNull());
    view.result.current.model?.nextPage();
    await vi.waitFor(() =>
      expect(view.result.current.saveError?.message).toBe("offline"),
    );
    expect(view.result.current.error).toBeNull();
    expect(view.result.current.model).not.toBeNull();
    expect(view.result.current.stale).toBe(false);

    client.savePartial.mockRejectedValueOnce(
      APIError.from("CONFLICT", SURVEY_ERROR_CODES.STALE_UPDATE),
    );
    view.result.current.model?.nextPage();
    await vi.waitFor(() => expect(view.result.current.stale).toBe(true));
    expect(view.result.current.model).not.toBeNull();
    await view.unmount();
  });

  it("submits only on complete when partial sending is off", async () => {
    const { client } = clientFor();
    const view = await mounted({
      client,
      responseId: "response-1",
      partial: "off",
    });
    await vi.waitFor(() => expect(view.result.current.model).not.toBeNull());
    view.result.current.model?.nextPage();
    await Promise.resolve();
    expect(client.savePartial).not.toHaveBeenCalled();
    view.result.current.model?.doComplete();
    await vi.waitFor(() =>
      expect(client.submitResponse).toHaveBeenCalledOnce(),
    );
    expect(client.submitResponse).toHaveBeenCalledWith({
      id: "response-1",
      data: { q1: "Ada" },
      expectedUpdatedAt: "t0",
    });
    await view.unmount();
  });

  it("shows a submitted response without saving", async () => {
    const { client } = clientFor(response({ status: "submitted" }));
    const view = await mounted({ client, responseId: "response-1" });
    await vi.waitFor(() =>
      expect(view.result.current.model?.mode).toBe("display"),
    );
    view.result.current.model?.doComplete();
    await Promise.resolve();
    expect(client.savePartial).not.toHaveBeenCalled();
    expect(client.submitResponse).not.toHaveBeenCalled();
    await view.unmount();
  });

  it("reports a load failure and reloads the stored snapshot", async () => {
    const { client, state } = clientFor();
    client.getResponse.mockRejectedValueOnce(new Error("missing"));
    const view = await mounted({ client, responseId: "response-1" });
    await vi.waitFor(() =>
      expect(view.result.current.error?.message).toBe("missing"),
    );
    expect(view.result.current.model).toBeNull();
    expect(view.result.current.saveError).toBeNull();

    state.current = response({ data: { q1: "Bob" }, updatedAt: "t9" });
    client.getResponse.mockResolvedValue(state.current);
    await act(async () => {
      view.result.current.reload();
    });
    await vi.waitFor(() =>
      expect(view.result.current.model?.data).toEqual({ q1: "Bob" }),
    );
    expect(view.result.current.error).toBeNull();
    await view.unmount();
  });

  it("turns a non-error load failure into an Error", async () => {
    const { client } = clientFor();
    client.getResponse.mockRejectedValueOnce("nope");
    const view = await mounted({ client, responseId: "response-1" });
    await vi.waitFor(() =>
      expect(view.result.current.error?.message).toBe("Load failed."),
    );
    await view.unmount();
  });

  it("loads the response that is current after the id changes", async () => {
    const { client } = clientFor();
    const view = await mounted({ client, responseId: "response-1" });
    await vi.waitFor(() =>
      expect(view.result.current.model?.data).toEqual({ q1: "Ada" }),
    );
    await view.rerender({ client, responseId: "response-2" });
    await vi.waitFor(() =>
      expect(view.result.current.model?.data).toEqual({ q1: "Bob" }),
    );
    await view.unmount();
  });

  it("ignores a load that finishes after unmount", async () => {
    const { client } = clientFor();
    let release: (value: ReturnType<typeof response>) => void = () => undefined;
    client.getResponse.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const view = await mounted({ client, responseId: "response-1" });
    await view.unmount();
    await act(async () => {
      release(response());
    });
    expect(view.result.current.model).toBeNull();
    expect(view.result.current.error).toBeNull();
  });
});
