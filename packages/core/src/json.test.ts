import { describe, expect, it } from "vitest";

import { sameJson, surveyContentHash } from "./json";

describe("sameJson", () => {
  it("ignores key order and undefined properties", () => {
    expect(
      sameJson(
        { b: 1, a: { d: true, c: null } },
        { a: { c: null, d: true }, b: 1 },
      ),
    ).toBe(true);
    expect(sameJson({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(sameJson({ a: null }, {})).toBe(false);
    expect(sameJson([1, { b: 2, a: 1 }], [{ a: 1, b: 2 }, 1])).toBe(false);
    expect(sameJson({ n: 1 }, { n: "1" })).toBe(false);
  });
});

describe("surveyContentHash", () => {
  it("ignores key order and changes when the document changes", async () => {
    const left = await surveyContentHash({ b: 1, a: { d: true, c: null } });
    const right = await surveyContentHash({ a: { c: null, d: true }, b: 1 });
    expect(left).toBe(right);
    expect(await surveyContentHash({ title: "سرعت" })).not.toBe(
      await surveyContentHash({ title: "سرعت." }),
    );
    expect(await surveyContentHash({ pages: ["a", "b"] })).not.toBe(
      await surveyContentHash({ pages: ["b", "a"] }),
    );
  });
});
