import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { confirm } from "../src/confirm";
import { MANAGED_INIT_SOURCE } from "../src/capabilities/layout";

describe("hermes skill-plugin confirmation", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("keeps a valid structure unconfirmed when the Hermes CLI is unavailable", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-confirm-"));
    const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-empty-path-"));
    roots.push(root, emptyPath);
    fs.writeFileSync(path.join(root, "plugin.yaml"), "name: jue-skills\nversion: 0.1.0\n");
    fs.writeFileSync(path.join(root, "__init__.py"), MANAGED_INIT_SOURCE);
    fs.mkdirSync(path.join(root, "skills", "demo"), { recursive: true });
    fs.writeFileSync(path.join(root, "skills", "demo", "SKILL.md"), "---\nname: demo\n---\nDemo\n");
    const originalPath = process.env.PATH;
    process.env.PATH = emptyPath;
    try {
      await expect(confirm([], { scope: "project", artifactRoot: root, artifactKind: "skill-plugin" })).resolves.toMatchObject({
        target: "hermes",
        status: "unconfirmed",
      });
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("fails a skill directory without SKILL.md", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-confirm-invalid-"));
    roots.push(root);
    fs.writeFileSync(path.join(root, "plugin.yaml"), "name: jue-skills\nversion: 0.1.0\n");
    fs.writeFileSync(path.join(root, "__init__.py"), MANAGED_INIT_SOURCE);
    fs.mkdirSync(path.join(root, "skills", "broken"), { recursive: true });

    await expect(confirm([], { scope: "project", artifactRoot: root, artifactKind: "skill-plugin" })).resolves.toMatchObject({
      target: "hermes",
      status: "failed",
    });
  });

  it("rejects a symlinked manifest before native CLI execution", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-confirm-link-"));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-confirm-outside-"));
    roots.push(root, outside);
    fs.writeFileSync(path.join(outside, "plugin.yaml"), "name: jue-skills\nversion: 0.1.0\n");
    fs.symlinkSync(path.join(outside, "plugin.yaml"), path.join(root, "plugin.yaml"));
    fs.writeFileSync(path.join(root, "__init__.py"), MANAGED_INIT_SOURCE);

    await expect(confirm([], { scope: "project", artifactRoot: root, artifactKind: "skill-plugin" })).resolves.toMatchObject({
      status: "failed",
      evidence: expect.stringContaining("contained regular"),
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
