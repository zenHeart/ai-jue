import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";

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

    const originalPath = process.env.PATH;
    process.env.PATH = "";
    try {
      await expect(confirm([], { scope: "project", artifactRoot: root })).resolves.toMatchObject({
        target: "openclaw",
        status: "unconfirmed",
      });
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("confirms the generic plugin artifact through the compatible-bundle path", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-confirm-plugin-"));
    roots.push(root);
    fs.mkdirSync(path.join(root, ".codex-plugin"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".codex-plugin", "plugin.json"),
      JSON.stringify({ name: "jue-bundle", version: "0.1.0" }),
    );

    const originalPath = process.env.PATH;
    process.env.PATH = "";
    try {
      const result = await confirm([], {
        scope: "project",
        artifactRoot: root,
        artifactKind: "plugin",
      });
      expect(result).toMatchObject({ target: "openclaw", status: "unconfirmed" });
      expect(result.evidence).toContain("codex marker");
    } finally {
      process.env.PATH = originalPath;
    }
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

    await expect(confirm([], { scope: "project", artifactRoot: root, artifactKind: "compatible-bundle" })).resolves.toMatchObject({
      target: "openclaw",
      status: "failed",
    });
  });
});
