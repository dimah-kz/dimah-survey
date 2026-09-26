import { toNextJsHandler } from "@dimah-survey/server/next";

import { editor } from "@/lib/survey";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(editor);
