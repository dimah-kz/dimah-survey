import { docsLlms } from "@/lib/source";
import { withSiteOrigin } from "@/lib/shared";

export const revalidate = false;

export async function GET() {
  return new Response(withSiteOrigin(await docsLlms.index()));
}
