import { describe, expect, it } from "vitest";

import {
  normalizeListPage,
  pageFromOverfetch,
  toResponseSummary,
} from "./list";
import { LIST_DEFAULT_LIMIT } from "./schemas";
import type { ResponseRecord } from "./types";

const row: ResponseRecord = {
  id: "r",
  surveyId: "pulse",
  respondentId: "user-1",
  status: "submitted",
  versionId: "version-1",
  definition: { title: "v1" },
  data: { q1: "yes" },
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T01:00:00.000Z",
  submittedAt: "2026-09-27T01:00:00.000Z",
};

describe("normalizeListPage", () => {
  it("fills the default page", () => {
    expect(normalizeListPage()).toEqual({
      limit: LIST_DEFAULT_LIMIT,
      offset: 0,
    });
    expect(normalizeListPage({ limit: 2, offset: 3 })).toEqual({
      limit: 2,
      offset: 3,
    });
  });
});

describe("pageFromOverfetch", () => {
  it("detects another page from the extra row", () => {
    expect(pageFromOverfetch([1, 2, 3], 2, 4)).toEqual({
      items: [1, 2],
      nextOffset: 6,
    });
    expect(pageFromOverfetch([1, 2], 2, 0)).toEqual({
      items: [1, 2],
      nextOffset: null,
    });
    expect(pageFromOverfetch([], 2, 0)).toEqual({
      items: [],
      nextOffset: null,
    });
  });
});

describe("toResponseSummary", () => {
  it("omits the snapshot and the answers", () => {
    expect(toResponseSummary(row)).toEqual({
      id: "r",
      surveyId: "pulse",
      respondentId: "user-1",
      status: "submitted",
      versionId: "version-1",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      submittedAt: row.submittedAt,
    });
    const summary = toResponseSummary(row);
    expect(toResponseSummary(summary)).toEqual(summary);
    expect(summary).not.toHaveProperty("definition");
    expect(summary).not.toHaveProperty("data");
  });
});
