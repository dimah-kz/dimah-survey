import { execFileSync } from "node:child_process";
import { tegami, type TegamiPlugin } from "tegami";
import { runCli } from "tegami/cli";
import { github } from "tegami/plugins/github";

/** Build each package (and its deps) via Turbo right before npm publish. */
function buildOnPublish(): TegamiPlugin {
  return {
    name: "build-on-publish",
    willPublish({ pkg }) {
      execFileSync(
        "pnpm",
        ["exec", "turbo", "run", "build", "--filter", pkg.name],
        {
          cwd: this.cwd,
          stdio: "inherit",
          shell: true,
        },
      );
    },
  };
}

const paper = tegami({
  groups: {
    "dimah-survey": {
      syncBump: true,
      syncGitTag: true,
    },
  },
  packages: () => ({ group: "dimah-survey" }),
  ignore: [
    "dimah-survey",
    "docs",
    "@workspace/eslint-config",
    "@workspace/tsup-config",
    "@workspace/typescript-config",
    "@workspace/vitest-config",
  ],
  npm: {
    client: "pnpm",
    updateLockFile: true,
    bumpDep: () => false,
    trustedPublish: {
      provider: "github",
      workflow: "publish.yml",
    },
  },
  plugins: [
    buildOnPublish(),
    github({
      repo: "dimah-kz/dimah-survey",
      versionPr: {
        base: "main",
        create() {
          const version = this.graph.get("npm:@dimah-survey/core")?.version;
          return {
            title: version
              ? `chore: version packages (${version})`
              : "chore: version packages",
          };
        },
      },
    }),
  ],
});

await runCli(paper);
