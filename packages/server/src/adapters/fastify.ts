import type { IncomingMessage, ServerResponse } from "node:http";

import { toNodeHandler } from "./node";
import type { DimahSurveyHandlerSource } from "./types";

/** Structural Fastify request/reply — avoids a hard dependency on `fastify`. */
type FastifyRequestLike = {
  raw: IncomingMessage;
};

type FastifyReplyLike = {
  raw: ServerResponse;
  hijack: () => void;
};

/**
 * Adapt a dimah-survey instance to a Fastify route handler.
 *
 * Uses `reply.hijack()` and the Node adapter so Fastify does not touch the
 * response stream. Mount this route **before** body parsers (or disable JSON
 * parsing for `/api/survey/*`) so the request body stays readable.
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { toFastifyHandler } from "@dimah-survey/server/fastify";
 * import { survey } from "./survey";
 *
 * const app = Fastify();
 * app.all("/api/survey/*", toFastifyHandler(survey));
 * ```
 */
export function toFastifyHandler(survey: DimahSurveyHandlerSource) {
  const handler = toNodeHandler(survey);
  return async (req: FastifyRequestLike, reply: FastifyReplyLike) => {
    reply.hijack();
    await handler(req.raw, reply.raw);
  };
}
