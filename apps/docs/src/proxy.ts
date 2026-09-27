import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { NextResponse, type NextRequest } from "next/server";

import { docsContentRoute, docsRoute } from "@/lib/shared";

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

export function proxy(request: NextRequest) {
  const suffix = rewriteSuffix(request.nextUrl.pathname);
  if (suffix) {
    return NextResponse.rewrite(new URL(suffix, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const markdown = rewriteDocs(request.nextUrl.pathname);

    if (markdown) {
      return NextResponse.rewrite(new URL(markdown, request.nextUrl), {
        headers: { Vary: "Accept" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
