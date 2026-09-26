function errorText(error: unknown) {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current !== "object") break;
    const record = current as {
      message?: unknown;
      code?: unknown;
      cause?: unknown;
    };
    if (typeof record.message === "string") parts.push(record.message);
    if (typeof record.code === "string" || typeof record.code === "number") {
      parts.push(String(record.code));
    }
    current = record.cause;
  }
  return parts.join(" ");
}

/** PostgreSQL 23505 and SQLite/Postgres unique-constraint messages. */
export function isUniqueViolation(error: unknown) {
  const text = errorText(error);
  return (
    text.includes("23505") ||
    text.includes("response_one_open_draft") ||
    /unique constraint/i.test(text)
  );
}
