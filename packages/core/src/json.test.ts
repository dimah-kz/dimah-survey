import { describe, expect, it } from "vitest";

import { sameJson } from "./json";

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
