import { describe, expect, it } from "vitest";

import { createWriteQueue } from "./write-queue";

describe("createWriteQueue", () => {
  it("runs the next write only after the previous one settles", async () => {
    const enqueue = createWriteQueue();
    const order: string[] = [];
    const first = enqueue(async () => {
      order.push("start-1");
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push("end-1");
    });
    const second = enqueue(async () => {
      order.push("start-2");
    });
    await Promise.all([first, second]);
    expect(order).toEqual(["start-1", "end-1", "start-2"]);
  });

  it("keeps the queue moving after a write fails", async () => {
    const enqueue = createWriteQueue();
    await expect(
      enqueue(async () => {
        throw new Error("stale");
      }),
    ).rejects.toThrow("stale");
    await expect(enqueue(async () => "ok")).resolves.toBe("ok");
  });
});
