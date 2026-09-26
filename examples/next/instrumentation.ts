export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { seed } = await import("@/lib/survey");
  await seed();
}
