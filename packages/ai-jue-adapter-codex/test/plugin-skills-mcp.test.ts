import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow, type CanonicalDocument } from "ai-jue-core";
import { write } from "../src/write";

describe("codex plugin skills + mcp", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("writes root skills/ and .mcp.json for plugin artifacts", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-codex-plugin-core-"));
    roots.push(root);
    const canonical: CanonicalDocument = {
      skills: {
        demo: {
          name: "demo",
          description: "Demo",
          content: "Body",
          prompt: "Body",
          references: { "a.md": "A" },
        },
      },
      mcp: {
        servers: {
          filesystem: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
            scope: "project",
          },
        },
      },
    };
    const changes = await write(canonical, {
      projectRoot: root,
      artifactKind: "plugin",
      pluginManifest: { name: "jue-core", version: "0.1.0" },
    });
    applyChangesOrThrow(root, changes);

    expect(fs.existsSync(path.join(root, "skills", "demo", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "demo", "references", "a.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, ".agents", "skills"))).toBe(false);
    const mcp = JSON.parse(fs.readFileSync(path.join(root, ".mcp.json"), "utf8"));
    expect(mcp.mcpServers.filesystem.command).toBe("npx");
    expect(fs.existsSync(path.join(root, ".codex-plugin", "plugin.json"))).toBe(true);
  });
});
