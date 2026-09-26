export const RESPONDENT_COOKIE = "ds_respondent";

export function respondentIdFromRequest(request?: Request) {
  const header = request?.headers.get("cookie");
  if (!header) return;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name !== RESPONDENT_COOKIE) continue;
    const value = decodeURIComponent(part.slice(separator + 1).trim());
    return value.length > 0 ? value : undefined;
  }
}
