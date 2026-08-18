import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { type CanonicalDocument } from "ai-jue-core";
import { write } from "../src/write";

describe("claude MCP apply scope", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("rejects a server whose explicit scope differs from the apply scope", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-mcp-scope-"));
    roots.push(root);
    const canonical: CanonicalDocument = {
      mcp: {
        servers: {
          userServer: { command: "node", args: ["b.js"], scope: "user" },
        },
      },
    };
    await expect(
      write(canonical, { projectRoot: root, artifactKind: "project", scope: "project" }),
    ).rejects.toThrow('scope "user" does not match apply scope "project"');
  });

  it("rejects local because apply has only project and user scopes", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-mcp-scope-empty-"));
    roots.push(root);
    const canonical: CanonicalDocument = {
      mcp: {
        servers: {
          localServer: { command: "node", args: ["b.js"], scope: "local" },
        },
      },
    };
    await expect(
      write(canonical, { projectRoot: root, artifactKind: "project", scope: "project" }),
    ).rejects.toThrow('scope "local"');
  });
});
