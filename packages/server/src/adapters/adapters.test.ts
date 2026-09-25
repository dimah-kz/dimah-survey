import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";

import { toElysiaHandler } from "./elysia";
import { toExpressHandler } from "./express";
import { toFastifyHandler } from "./fastify";
import { toHonoHandler } from "./hono";
import { fromNodeHeaders, toNodeHandler } from "./node";
import { toNextJsHandler } from "./next";
import { toSvelteKitHandler } from "./svelte-kit";

describe("fromNodeHeaders", () => {
  it("maps string and array header values", () => {
    const headers = fromNodeHeaders({
      host: "example.com",
      "x-forwarded-for": ["1.1.1.1", "2.2.2.2"],
      "x-empty": undefined,
    });

    expect(headers.get("host")).toBe("example.com");
    expect(headers.get("x-forwarded-for")).toBe("1.1.1.1, 2.2.2.2");
    expect(headers.has("x-empty")).toBe(false);
  });
});

describe("fetch adapters", () => {
  const request = new Request("http://localhost/api/survey/survey", {
    method: "POST",
  });
  const response = new Response(JSON.stringify({ ok: true }), { status: 200 });

  function mockSurvey() {
    const handler = vi.fn(async () => response);
    return { handler, survey: { handler } };
  }

  it("toHonoHandler forwards c.req.raw", async () => {
    const { handler, survey } = mockSurvey();
    const result = await toHonoHandler(survey)({ req: { raw: request } });
    expect(handler).toHaveBeenCalledWith(request);
    expect(result).toBe(response);
  });

  it("toElysiaHandler forwards ctx.request", async () => {
    const { handler, survey } = mockSurvey();
    const result = await toElysiaHandler(survey)({ request });
    expect(handler).toHaveBeenCalledWith(request);
    expect(result).toBe(response);
  });

  it("toSvelteKitHandler forwards event.request", async () => {
    const { handler, survey } = mockSurvey();
    const result = await toSvelteKitHandler(survey)({ request });
    expect(handler).toHaveBeenCalledWith(request);
    expect(result).toBe(response);
  });

  it("toNextJsHandler exposes GET/POST/PUT/PATCH/DELETE", async () => {
    const { handler, survey } = mockSurvey();
    const routes = toNextJsHandler(survey);
    await routes.GET(request);
    await routes.POST(request);
    await routes.PUT(request);
    await routes.PATCH(request);
    await routes.DELETE(request);
    expect(handler).toHaveBeenCalledTimes(5);
  });
});

describe("node adapters", () => {
  function incoming(init: {
    method?: string;
    url?: string;
    body?: string;
  }): IncomingMessage {
    const req = Readable.from([
      Buffer.from(init.body ?? ""),
    ]) as IncomingMessage;
    req.method = init.method ?? "GET";
    req.url = init.url ?? "/api/survey/nope";
    req.headers = { host: "localhost" };
    req.socket = { encrypted: false } as unknown as IncomingMessage["socket"];
    return req;
  }

  function outgoing() {
    const chunks: Buffer[] = [];
    let resolveDone!: () => void;
    const done = new Promise<void>((resolve) => {
      resolveDone = resolve;
    });
    const res = {
      statusCode: 200,
      headersSent: false,
      setHeader() {
        return res;
      },
      end(chunk?: unknown) {
        if (chunk) chunks.push(Buffer.from(chunk as string));
        res.headersSent = true;
        resolveDone();
        return res;
      },
    };
    return {
      res: res as unknown as ServerResponse,
      body: () => Buffer.concat(chunks).toString(),
      done,
    };
  }

  it("toNodeHandler converts IncomingMessage into Request", async () => {
    const handler = vi.fn(async (request: Request) => {
      expect(request.method).toBe("POST");
      expect(new URL(request.url).pathname).toBe("/api/survey/response/start");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const { res, done, body } = outgoing();

    await toNodeHandler({ handler })(
      incoming({
        method: "POST",
        url: "/api/survey/response/start",
        body: "{}",
      }),
      res,
    );
    await done;

    expect(handler).toHaveBeenCalledOnce();
    expect(body()).toContain("ok");
  });

  it("toExpressHandler is the Node handler", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const { res, done } = outgoing();
    await toExpressHandler({ handler })(
      incoming({ method: "GET", url: "/api/survey/nope" }),
      res,
    );
    await done;
    expect(handler).toHaveBeenCalledOnce();
  });

  it("toFastifyHandler hijacks the reply then uses the Node adapter", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const { res, done } = outgoing();
    const hijack = vi.fn();

    await toFastifyHandler({ handler })(
      { raw: incoming({ method: "GET", url: "/api/survey/nope" }) },
      { raw: res, hijack },
    );
    await done;

    expect(hijack).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });
});
