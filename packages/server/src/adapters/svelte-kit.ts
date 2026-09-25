import type { DimahSurveyHandlerSource } from "./types";

/** Structural SvelteKit event — avoids a hard dependency on `@sveltejs/kit`. */
type SvelteKitRequestEvent = {
  request: Request;
};

/**
 * Adapt a dimah-survey instance to a SvelteKit request handler.
 *
 * @example
 * ```ts
 * // src/routes/api/survey/[...path]/+server.ts
 * import { toSvelteKitHandler } from "@dimah-survey/server/svelte-kit";
 * import { survey } from "$lib/survey";
 *
 * const handler = toSvelteKitHandler(survey);
 * export const GET = handler;
 * export const POST = handler;
 * export const PUT = handler;
 * export const PATCH = handler;
 * export const DELETE = handler;
 * ```
 */
export function toSvelteKitHandler(survey: DimahSurveyHandlerSource) {
  return (event: SvelteKitRequestEvent) => survey.handler(event.request);
}
