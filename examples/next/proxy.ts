import { NextResponse, type NextRequest } from "next/server";

import { RESPONDENT_COOKIE } from "@/lib/respondent";

// One respondent per browser, so an open draft can be resumed.
export function proxy(request: NextRequest) {
  if (request.cookies.get(RESPONDENT_COOKIE)?.value) {
    return NextResponse.next();
  }

  const id = crypto.randomUUID();
  request.cookies.set(RESPONDENT_COOKIE, id);
  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  response.cookies.set(RESPONDENT_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
