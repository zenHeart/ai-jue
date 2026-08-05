import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow, type CanonicalDocument } from "ai-jue-core";
import { write } from "../src/write";

describe("hermes skill-plugin", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("writes plugin.yaml, __init__.py, and flat skills with sidecars", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-skill-plugin-"));
    roots.push(root);
    const canonical: CanonicalDocument = {
      context: { global: "should not appear in skill-plugin" },
      skills: {
        "general/demo": {
          name: "demo",
          description: "Demo skill",
          content: "Do the demo.",
          prompt: "Do the demo.",
          references: { "notes.md": "Note body" },
        },
      },
      mcp: {
        servers: {
          filesystem: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"] },
        },
      },
    };
    const changes = await write(canonical, {
      projectRoot: root,
      artifactKind: "skill-plugin",
      pluginManifest: { name: "ai-assets", version: "0.1.0" },
    });
    applyChangesOrThrow(root, changes);

    expect(fs.existsSync(path.join(root, "plugin.yaml"))).toBe(true);
    expect(fs.readFileSync(path.join(root, "plugin.yaml"), "utf8")).toContain("name: ai-assets");
    expect(fs.readFileSync(path.join(root, "__init__.py"), "utf8")).toContain("register_skill");
    expect(fs.existsSync(path.join(root, "skills", "demo", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "demo", "references", "notes.md"))).toBe(true);
    // MCP stays on workspace — not packed into skill-plugin.
    expect(fs.existsSync(path.join(root, "config.yaml"))).toBe(false);
    expect(fs.existsSync(path.join(root, "MEMORY.md"))).toBe(false);
  });

  it("rejects category collisions during flat skill-plugin conversion", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-skill-plugin-collision-"));
    roots.push(root);
    await expect(
      write(
        {
          skills: {
            "general/check": { content: "General", prompt: "General" },
            "ops/check": { content: "Ops", prompt: "Ops" },
          },
        },
        { projectRoot: root, artifactKind: "skill-plugin" },
      ),
    ).rejects.toThrow('flatten multiple Canonical skills to "check"');
  });

  it("rejects unsafe flattened skill names", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-hermes-skill-plugin-path-"));
    roots.push(root);
    await expect(
      write(
        {
          skills: {
            "../bad name": { content: "Escape", prompt: "Escape" },
          },
        },
        { projectRoot: root, artifactKind: "skill-plugin" },
      ),
    ).rejects.toThrow("safe single path segment");
  });
});
