import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { confirm } from "../src/confirm";

describe("hermes skill-plugin confirmation", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("confirms the generated skill-plugin structure", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-confirm-"));
    roots.push(root);
    fs.writeFileSync(path.join(root, "plugin.yaml"), "name: jue-skills\nversion: 0.1.0\n");
    fs.writeFileSync(path.join(root, "__init__.py"), "def register(ctx):\n    ctx.register_skill('demo', 'SKILL.md')\n");
    fs.mkdirSync(path.join(root, "skills", "demo"), { recursive: true });
    fs.writeFileSync(path.join(root, "skills", "demo", "SKILL.md"), "---\nname: demo\n---\nDemo\n");

    await expect(confirm([], { scope: "project", artifactRoot: root, artifactKind: "skill-plugin" })).resolves.toMatchObject({
      target: "hermes",
      status: "confirmed",
    });
  });

  it("fails a skill directory without SKILL.md", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-confirm-invalid-"));
    roots.push(root);
    fs.writeFileSync(path.join(root, "plugin.yaml"), "name: jue-skills\nversion: 0.1.0\n");
    fs.writeFileSync(path.join(root, "__init__.py"), "register_skill\n");
    fs.mkdirSync(path.join(root, "skills", "broken"), { recursive: true });

    await expect(confirm([], { scope: "project", artifactRoot: root, artifactKind: "skill-plugin" })).resolves.toMatchObject({
      target: "hermes",
      status: "failed",
    });
  });

  it("reports workspace confirmation as unavailable when tirith is not installed", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-workspace-"));
    const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-path-"));
    roots.push(root, emptyPath);
    const originalPath = process.env.PATH;
    process.env.PATH = emptyPath;
    try {
      await expect(
        confirm([], { scope: "project", artifactRoot: root, artifactKind: "workspace" }),
      ).resolves.toMatchObject({
        target: "hermes",
        status: "unconfirmed",
        evidence: expect.stringContaining("not available on PATH"),
      });
    } finally {
      process.env.PATH = originalPath;
    }
  });
});
