import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { applyChangesOrThrow } from "ai-jue-core";
import { hooks } from "../src/capabilities/hooks";
import { write } from "../src/write";

describe("cursor hooks shape", () => {
  const canonical = {
    hooks: {
      PostToolUse: { matcher: "Edit", type: "command", script: "echo hook" },
    },
  };

  it("writes project hooks with version wrapper", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-hooks-project-"));
    applyChangesOrThrow(root, hooks("project").write(root, canonical.hooks!, "cursor"));
    const parsed = JSON.parse(fs.readFileSync(path.join(root, ".cursor", "hooks.json"), "utf8"));
    expect(parsed.version).toBe(1);
    expect(parsed.hooks.postToolUse[0].command).toBe("echo hook");
  });

  it("writes plugin hooks without version wrapper", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-hooks-plugin-"));
    applyChangesOrThrow(root, hooks("plugin").write(root, canonical.hooks!, "cursor"));
    const parsed = JSON.parse(fs.readFileSync(path.join(root, "hooks", "hooks.json"), "utf8"));
    expect(parsed.version).toBeUndefined();
    expect(parsed.hooks.postToolUse[0].command).toBe("echo hook");
  });

  it("roundtrips plugin hooks through read/write", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-hooks-rt-"));
    applyChangesOrThrow(
      root,
      await write(canonical as any, {
        scope: "project",
        artifactRoot: root,
        artifactKind: "plugin",
        pluginManifest: { name: "hooks-test", version: "0.1.0" },
      }),
    );
    const content = fs.readFileSync(path.join(root, "hooks", "hooks.json"), "utf8");
    expect(content).not.toContain('"version"');
    expect(JSON.parse(content).hooks.postToolUse).toHaveLength(1);
  });

  it("roundtrips canonical hook event names idempotently", async () => {
    // 回归:EVENT_ALIASES 曾混入 camelCase 键,反向查表把原生
    // beforeSubmitPrompt/stop 反解为 UserPromptSubmit/Stop,导致 round-trip 非幂等。
    const canonicalHooks = {
      UserPromptSubmit: { type: "command", script: "echo a" },
      Stop: { type: "command", script: "echo b" },
      BeforeShellExecution: { type: "command", script: "echo c" },
      WorkspaceOpen: { type: "command", script: "echo d" },
    };
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-hooks-idem-"));
    applyChangesOrThrow(root, hooks("project").write(root, canonicalHooks, "cursor"));
    const readBack = hooks("project").read(root);
    expect(Object.keys(readBack ?? {}).sort()).toEqual(Object.keys(canonicalHooks).sort());
  });
});
