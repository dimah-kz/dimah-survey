import path from "node:path";
import { createGenerator } from "fumadocs-typescript";

const root = path.resolve(import.meta.dirname, "../../..");
const cases = [
  ["server", "packages/server/src/dimah-survey.ts", "DimahFillConfig"],
  ["server", "packages/server/src/dimah-survey.ts", "DimahEditorConfig"],
  ["server", "packages/server/src/dimah-survey.ts", "FillHooks"],
  ["server", "packages/server/src/dimah-survey.ts", "EditorHooks"],
  ["core", "packages/core/src/client.ts", "CreateSurveyClientOptions"],
  ["core", "packages/core/src/types.ts", "SurveySettings"],
  ["core", "packages/core/src/types.ts", "ListResponsesQuery"],
  ["core", "packages/core/src/types.ts", "ListSurveysQuery"],
  ["core", "packages/core/src/types.ts", "SurveyStore"],
  ["core", "packages/core/src/types.ts", "GuardContext"],
  ["core", "packages/core/src/types.ts", "StartResponseLifecycle"],
  ["core", "packages/core/src/types.ts", "SubmitResponseLifecycle"],
  [
    "react",
    "packages/react/src/use-survey-response.ts",
    "UseSurveyResponseOptions",
  ],
  [
    "react",
    "packages/react/src/use-survey-response.ts",
    "SurveyResponseBinding",
  ],
  ["react", "packages/react/src/use-survey-draft.ts", "UseSurveyDraftOptions"],
  ["react", "packages/react/src/use-survey-draft.ts", "SurveyDraftBinding"],
  ["react", "packages/react/src/bind-survey-model.ts", "SurveyModelActions"],
  [
    "react",
    "packages/react/src/bind-survey-model.ts",
    "SurveyModelBindOptions",
  ],
  [
    "react",
    "packages/react/src/bind-survey-creator.ts",
    "SurveyCreatorActions",
  ],
];

const generators = new Map();
let failed = false;

for (const [pkg, file, name] of cases) {
  let generator = generators.get(pkg);
  if (!generator) {
    generator = createGenerator({
      tsconfigPath: path.join(root, "packages", pkg, "tsconfig.json"),
    });
    generators.set(pkg, generator);
  }
  const docs = await generator.generateTypeTable(
    { path: file, name },
    { basePath: root },
  );
  const entries = docs.flatMap((doc) => doc.entries ?? []);
  const empty = entries.filter((entry) => !entry.description?.trim());
  console.log(`\n${name} (${entries.length})`);
  for (const entry of entries) {
    const mark = entry.description?.trim() ? "ok" : "EMPTY";
    if (!entry.description?.trim()) failed = true;
    const tags = (entry.tags ?? [])
      .map((tag) => `@${tag.name} ${tag.text}`)
      .join(" ");
    console.log(
      `  ${mark} ${entry.required ? "req" : "opt"} ${entry.name}: ${entry.simplifiedType} — ${entry.description?.replaceAll("\n", " ") ?? ""}${tags ? ` [${tags}]` : ""}`,
    );
  }
  if (entries.length === 0) {
    failed = true;
    console.log("  NO ENTRIES");
  }
  if (empty.length > 0)
    console.log(`  missing docs: ${empty.map((e) => e.name).join(", ")}`);
}

if (failed) process.exit(1);
