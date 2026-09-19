import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow, type CanonicalDocument } from "ai-jue-core";
import { write } from "../src/write";

const CANONICAL: CanonicalDocument = {
  context: { global: "Bundle fixture context." },
  skills: {
    summarize: {
      name: "summarize",
      description: "Neutral fixture skill",
      content: "Summarize the content.",
      prompt: "Summarize the content.",
      references: { "guide.md": "Reference" },
      scripts: { "validate.mjs": "export default true;\n" },
      assets: { "template.txt": "Template" },
    },
  },
};

describe("openclaw compatible-bundle", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) {
      fs.rmSync(root, { recursive: true, force: true });
    }
    roots.length = 0;
  });

  it("delegates to Claude plugin writer by default (no hooks) with skills + mcp", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-bundle-claude-"));
    roots.push(root);
    const withMcp: CanonicalDocument = {
      ...CANONICAL,
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
    const changes = await write(withMcp, {
      scope: "project",
      artifactRoot: root,
      artifactKind: "compatible-bundle",
      pluginManifest: { name: "jue-openclaw-bundle", version: "0.1.0" },
    });
    applyChangesOrThrow(root, changes);
    expect(fs.existsSync(path.join(root, ".claude-plugin", "plugin.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "references", "guide.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "scripts", "validate.mjs"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "assets", "template.txt"))).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(root, ".mcp.json"), "utf8")).mcpServers.filesystem).toBeTruthy();
    // Workspace AGENTS.md must not be required for bundle mode.
    expect(fs.existsSync(path.join(root, "AGENTS.md"))).toBe(false);
  });

  it("delegates to Codex plugin writer when hooks are present (auto)", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-bundle-codex-"));
    roots.push(root);
    const withHooks: CanonicalDocument = {
      ...CANONICAL,
      hooks: {
        "command:new": {
          matcher: "*",
          type: "command",
          script: "echo hook",
          name: "command_new",
          description: "Hook",
          openclaw: { events: ["command:new"] },
          body: "",
        },
      },
    };
    const changes = await write(withHooks, {
      scope: "project",
      artifactRoot: root,
      artifactKind: "compatible-bundle",
      pluginManifest: { name: "jue-openclaw-hooks", version: "0.1.0" },
    });
    applyChangesOrThrow(root, changes);
    expect(fs.existsSync(path.join(root, ".codex-plugin", "plugin.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, ".codex", "hooks.json"))).toBe(false);
    expect(fs.existsSync(path.join(root, "hooks", "command_new", "HOOK.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "hooks", "command_new", "handler.js"))).toBe(true);
  });

  it("keeps workspace write as the default kind", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-workspace-"));
    roots.push(root);
    const changes = await write(CANONICAL, { scope: "project", artifactRoot: root });
    applyChangesOrThrow(root, changes);
    expect(fs.existsSync(path.join(root, "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "references", "guide.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "scripts", "validate.mjs"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills", "summarize", "assets", "template.txt"))).toBe(true);
    expect(fs.existsSync(path.join(root, ".claude-plugin"))).toBe(false);
  });

  it("rejects an unknown bundle format before producing changes", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-bundle-format-"));
    roots.push(root);
    await expect(
      write(CANONICAL, {
        scope: "project",
        artifactRoot: root,
        artifactKind: "compatible-bundle",
        toolsConfig: { bundleFormat: "invalid" },
      }),
    ).rejects.toThrow("tools.bundleFormat must be one of: auto, claude, codex, cursor");
  });

  it("delegates to the Cursor plugin writer only when bundleFormat is explicit", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-bundle-cursor-"));
    roots.push(root);
    const withHooks: CanonicalDocument = {
      ...CANONICAL,
      hooks: {
        PostToolUse: { matcher: "Edit", type: "command", script: "echo hook" },
      },
    };
    const changes = await write(withHooks, {
      scope: "project",
      artifactRoot: root,
      artifactKind: "compatible-bundle",
      toolsConfig: { bundleFormat: "cursor" },
      pluginManifest: {
        name: "jue-cursor-bundle",
        version: "0.2.0",
        variables: {
          apiKey: { type: "string", description: "Neutral fixture variable" },
        },
      },
    });
    applyChangesOrThrow(root, changes);
    expect(fs.existsSync(path.join(root, ".cursor-plugin", "plugin.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, ".claude-plugin"))).toBe(false);
    expect(fs.existsSync(path.join(root, ".codex-plugin"))).toBe(false);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, ".cursor-plugin", "plugin.json"), "utf8"));
    expect(manifest.name).toBe("jue-cursor-bundle");
    expect(manifest.variables.apiKey.type).toBe("string");
    expect(fs.existsSync(path.join(root, "skills", "summarize", "SKILL.md"))).toBe(true);
  });

  it("does not select Cursor when auto sees hooks", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-bundle-auto-hooks-"));
    roots.push(root);
    const withHooks: CanonicalDocument = {
      ...CANONICAL,
      hooks: {
        "command:new": {
          matcher: "*",
          type: "command",
          script: "echo hook",
          name: "command_new",
          description: "Hook",
          openclaw: { events: ["command:new"] },
          body: "",
        },
      },
    };
    const changes = await write(withHooks, {
      scope: "project",
      artifactRoot: root,
      artifactKind: "compatible-bundle",
      toolsConfig: { bundleFormat: "auto" },
      pluginManifest: { name: "jue-openclaw-hooks", version: "0.1.0" },
    });
    applyChangesOrThrow(root, changes);
    expect(fs.existsSync(path.join(root, ".codex-plugin", "plugin.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, ".cursor-plugin"))).toBe(false);
  });
});
