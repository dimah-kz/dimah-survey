import { APIError, SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { toResponse } from "better-call";
import type {
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
} from "node:http";

import type { DimahSurveyHandlerSource } from "./types";

/**
 * Convert Node.js / Express request headers into a Web {@link Headers} object.
 * Useful when calling `survey.api.*` from a Node handler.
 *
 * @example
 * ```ts
 * import { fromNodeHeaders } from "@dimah-survey/server/node";
 *
 * await survey.api.getSurvey({
 *   query: { id },
 *   headers: fromNodeHeaders(req.headers),
 * });
 * ```
 */
export function fromNodeHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

function collectBody(req: IncomingMessage): Promise<Buffer> {
  const { promise, resolve, reject } = Promise.withResolvers<Buffer>();
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer | string) => {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  });
  req.on("end", () => resolve(Buffer.concat(chunks)));
  req.on("error", reject);
  return promise;
}

function toWebRequest(req: IncomingMessage, body: Buffer): Request {
  const host = req.headers.host ?? "localhost";
  const protocol =
    (req.socket as { encrypted?: boolean }).encrypted === true
      ? "https"
      : "http";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);

  const headers = fromNodeHeaders(req.headers);
  const method = (req.method ?? "GET").toUpperCase();
  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = new Uint8Array(body);
    // @ts-expect-error Node fetch duplex for streaming bodies
    init.duplex = "half";
  }

  return new Request(url, init);
}

async function writeWebResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

/**
 * Adapt a dimah-survey instance to Node.js `http` / Express-style handlers.
 *
 * @example
 * ```ts
 * import { createServer } from "node:http";
 * import { toNodeHandler } from "@dimah-survey/server/node";
 * import { survey } from "./survey";
 *
 * createServer(toNodeHandler(survey)).listen(3000);
 * ```
 */
export function toNodeHandler(survey: DimahSurveyHandlerSource) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const body = await collectBody(req);
      const request = toWebRequest(req, body);
      const response = await survey.handler(request);
      await writeWebResponse(res, response);
    } catch (error) {
      console.error("[survey API]", error);
      if (!res.headersSent) {
        await writeWebResponse(
          res,
          toResponse(
            APIError.from(
              "INTERNAL_SERVER_ERROR",
              SURVEY_ERROR_CODES.INTERNAL_ERROR,
            ),
          ),
        );
      }
    }
  };
}
