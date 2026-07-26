import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow } from "ai-jue-core";
import { confirm } from "../src/confirm";
import { write } from "../src/write";
import type { CanonicalDocument } from "ai-jue-core";

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
    applyChangesOrThrow(root, await write(CANONICAL, { projectRoot: root }));

    const confirmation = await confirm([], { projectRoot: root, artifactKind: "project" });
    expect(confirmation).toEqual({ target: "claude-code", status: "unconfirmed" });
  });

  it("reports 'confirmed' with real evidence for a Plugin that passes claude plugin validate --strict", async () => {
    const root = tempDir();
    applyChangesOrThrow(
      root,
      await write(CANONICAL, {
        projectRoot: root,
        artifactKind: "plugin",
        pluginManifest: {
          name: "jue-confirm-test-plugin",
          version: "1.0.0",
          description: "Neutral fixture Plugin for confirm() native verification.",
          author: { name: "ai-jue fixtures" },
        },
      }),
    );

    const confirmation = await confirm([], { projectRoot: root, artifactKind: "plugin" });
    expect(confirmation.target).toBe("claude-code");
    expect(confirmation.status).toBe("confirmed");
    expect(confirmation.evidence).toContain("Validation passed");
  }, 30_000);

  it("reports 'failed' with evidence for a Plugin missing a manifest", async () => {
    const root = tempDir();
    applyChangesOrThrow(root, await write(CANONICAL, { projectRoot: root, artifactKind: "plugin" }));

    const confirmation = await confirm([], { projectRoot: root, artifactKind: "plugin" });
    expect(confirmation.target).toBe("claude-code");
    expect(confirmation.status).toBe("failed");
    expect(confirmation.evidence).toBeTruthy();
  }, 30_000);
});
