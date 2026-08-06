import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow, type CanonicalDocument } from "ai-jue-core";
import { write } from "../src/write";

describe("claude MCP scope filtering", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("skips user/local scope servers without blocking the project Artifact", async () => {
    // `user`/`local` servers map to ~/.claude.json, which is not expressible
    // as a project-relative ArtifactChange.path (JUE-102 contract). They are
    // intentionally skipped — a user-scope server must not fail the whole
    // project apply (RFC-0002 backward compatibility).
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-mcp-scope-"));
    roots.push(root);
    const canonical: CanonicalDocument = {
      mcp: {
        servers: {
          projectServer: { command: "node", args: ["a.js"] },
          userServer: { command: "node", args: ["b.js"], scope: "user" },
          localServer: { command: "node", args: ["c.js"], scope: "local" },
        },
      },
    };
    const changes = await write(canonical, { projectRoot: root, artifactKind: "project" });
    applyChangesOrThrow(root, changes);

    const mcpJson = JSON.parse(
      fs.readFileSync(path.join(root, ".mcp.json"), "utf8"),
    ) as { mcpServers: Record<string, unknown> };
    expect(mcpJson.mcpServers.projectServer).toBeDefined();
    expect(mcpJson.mcpServers.userServer).toBeUndefined();
    expect(mcpJson.mcpServers.localServer).toBeUndefined();
  });

  it("omits .mcp.json when every server is user/local scoped", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-mcp-scope-empty-"));
    roots.push(root);
    const canonical: CanonicalDocument = {
      mcp: {
        servers: {
          userServer: { command: "node", args: ["b.js"], scope: "user" },
        },
      },
    };
    const changes = await write(canonical, { projectRoot: root, artifactKind: "project" });
    applyChangesOrThrow(root, changes);
    expect(fs.existsSync(path.join(root, ".mcp.json"))).toBe(false);
  });
});
