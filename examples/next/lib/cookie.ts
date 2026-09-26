import "server-only";

import { cookies } from "next/headers";

export async function fillHeaders(): Promise<HeadersInit> {
  const store = await cookies();
  const cookie = store
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");
  const headers = new Headers();
  if (cookie.length > 0) headers.set("cookie", cookie);
  return headers;
}
