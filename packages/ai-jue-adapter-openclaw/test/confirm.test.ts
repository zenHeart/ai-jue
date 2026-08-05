import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("child_process", () => ({
  execFileSync: vi.fn(() => {
    const error = new Error("openclaw unavailable") as Error & { code?: string };
    error.code = "ENOENT";
    throw error;
  }),
}));

import { confirm } from "../src/confirm";

describe("openclaw compatible-bundle confirmation", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("returns unconfirmed structural evidence when the native CLI is unavailable", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-confirm-"));
    roots.push(root);
    fs.mkdirSync(path.join(root, ".codex-plugin"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".codex-plugin", "plugin.json"),
      JSON.stringify({ name: "jue-bundle", version: "0.1.0", description: "fixture" }),
    );
    fs.mkdirSync(path.join(root, "hooks", "check"), { recursive: true });
    fs.writeFileSync(path.join(root, "hooks", "check", "HOOK.md"), "---\nname: check\n---\n");
    fs.writeFileSync(path.join(root, "hooks", "check", "handler.js"), "module.exports = {};\n");

    await expect(confirm([], { projectRoot: root })).resolves.toMatchObject({
      target: "openclaw",
      status: "unconfirmed",
    });
  });

  it("fails when a bundle hook is missing its handler", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-confirm-invalid-"));
    roots.push(root);
    fs.mkdirSync(path.join(root, ".claude-plugin"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".claude-plugin", "plugin.json"),
      JSON.stringify({ name: "jue-bundle", version: "0.1.0" }),
    );
    fs.mkdirSync(path.join(root, "hooks", "broken"), { recursive: true });
    fs.writeFileSync(path.join(root, "hooks", "broken", "HOOK.md"), "---\nname: broken\n---\n");

    await expect(confirm([], { projectRoot: root, artifactKind: "compatible-bundle" })).resolves.toMatchObject({
      target: "openclaw",
      status: "failed",
    });
  });
});
