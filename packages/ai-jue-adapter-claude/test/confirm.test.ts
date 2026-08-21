import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow } from "ai-jue-core";
import { hasCli } from "../../ai-jue-core/test/has-cli";
import { confirm } from "../src/confirm";
import { write } from "../src/write";
import type { CanonicalDocument } from "ai-jue-core";

const hasClaudeCli = hasCli("claude");

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-confirm-"));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const CANONICAL: CanonicalDocument = {
  commands: {
    demo: { description: "Neutral fixture command", content: "Do the thing." },
  },
};

describe("confirm()", () => {
  it("reports 'unconfirmed' for a project-scope Artifact (no native validator exists for it)", async () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
    applyChangesOrThrow(root, await write(CANONICAL, { scope: "project", artifactRoot: root }));

    const confirmation = await confirm([], { scope: "project", artifactRoot: root, artifactKind: "project" });
    expect(confirmation).toEqual({ target: "claude-code", status: "unconfirmed" });
  });

  it.skipIf(process.platform === "win32")(
    "validates the resolved artifactRoot carried by the target context",
    async () => {
      const artifactRoot = tempDir();
      const bin = tempDir();
      const argsPath = path.join(bin, "args.txt");
      const executable = path.join(bin, "claude");
      fs.writeFileSync(
        executable,
        `#!/bin/sh\nprintf '%s\\n' "$@" > "${argsPath}"\nprintf 'Validation passed\\n'\n`,
      );
      fs.chmodSync(executable, 0o755);
      const originalPath = process.env.PATH;
      process.env.PATH = `${bin}${path.delimiter}${originalPath ?? ""}`;
      try {
        await expect(
          confirm([], {
            artifactRoot,
            scope: "user",
            artifactKind: "plugin",
          }),
        ).resolves.toMatchObject({ status: "confirmed" });
        expect(fs.readFileSync(argsPath, "utf8").split("\n")).toContain(artifactRoot);
      } finally {
        process.env.PATH = originalPath;
      }
    },
  );

  it.skipIf(!hasClaudeCli)(
    "reports 'confirmed' with real evidence for a Plugin that passes claude plugin validate --strict",
    async () => {
      const root = tempDir();
      applyChangesOrThrow(
        root,
        await write(CANONICAL, {
          scope: "project",
          artifactRoot: root,
          artifactKind: "plugin",
          pluginManifest: {
            name: "jue-confirm-test-plugin",
            version: "1.0.0",
            description: "Neutral fixture Plugin for confirm() native verification.",
            author: { name: "ai-jue fixtures" },
          },
        }),
      );

      const confirmation = await confirm([], { scope: "project", artifactRoot: root, artifactKind: "plugin" });
      expect(confirmation.target).toBe("claude-code");
      expect(confirmation.status).toBe("confirmed");
      expect(confirmation.evidence).toContain("Validation passed");
    },
    30_000,
  );

  it.skipIf(!hasClaudeCli)(
    "reports 'failed' with evidence for a Plugin missing a manifest",
    async () => {
      const root = tempDir();
      applyChangesOrThrow(root, await write(CANONICAL, { scope: "project", artifactRoot: root, artifactKind: "plugin" }));

      const confirmation = await confirm([], { scope: "project", artifactRoot: root, artifactKind: "plugin" });
      expect(confirmation.target).toBe("claude-code");
      expect(confirmation.status).toBe("failed");
      expect(confirmation.evidence).toBeTruthy();
    },
    30_000,
  );
});
