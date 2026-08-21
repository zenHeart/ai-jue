import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow, type CanonicalDocument } from "ai-jue-core";
import { read } from "../src/read";
import { write } from "../src/write";

describe("Claude Code user apply scope", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("maps every supported capability to Claude Code's user-native path", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-user-scope-"));
    roots.push(home);
    const canonical: CanonicalDocument = {
      context: { global: "Shared user context." },
      rules: { style: { content: "Use two spaces.", prompt: "Use two spaces." } },
      commands: { review: { content: "Review.", prompt: "Review." } },
      agents: { planner: { content: "Plan.", prompt: "Plan." } },
      skills: { summarize: { content: "Summarize.", prompt: "Summarize." } },
      hooks: { PreToolUse: { script: "echo hook" } },
      mcp: { servers: { demo: { command: "node", args: ["server.js"] } } },
    };

    const changes = await write(canonical, {
      artifactRoot: home,
      artifactKind: "project",
      scope: "user",
    });

    expect(changes.map((change) => change.path).sort()).toEqual([
      ".claude.json",
      ".claude/CLAUDE.md",
      ".claude/agents/planner.md",
      ".claude/commands/review.md",
      ".claude/rules/style.md",
      ".claude/settings.json",
      ".claude/skills/summarize/SKILL.md",
    ]);
    expect(changes.every((change) => change.scope === "user")).toBe(true);
  });

  it("ignores unrelated user configuration when no MCP servers are configured", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-user-read-empty-mcp-"));
    roots.push(home);
    fs.writeFileSync(
      path.join(home, ".claude.json"),
      JSON.stringify({ numStartups: 4, installMethod: "native" }),
    );

    const canonical = await read({ artifactRoot: home, scope: "user" });

    expect(canonical.mcp).toBeUndefined();
  });

  it("reads only MCP servers from the user configuration", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-user-read-mcp-"));
    roots.push(home);
    fs.writeFileSync(
      path.join(home, ".claude.json"),
      JSON.stringify({
        numStartups: 4,
        installMethod: "native",
        mcpServers: { demo: { command: "node", args: ["server.js"] } },
      }),
    );

    const canonical = await read({ artifactRoot: home, scope: "user" });

    expect(canonical.mcp?.servers).toEqual({
      demo: { command: "node", args: ["server.js"] },
    });
  });

  it("preserves unrelated user configuration while updating MCP servers", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "jue-claude-user-write-mcp-"));
    roots.push(home);
    fs.writeFileSync(
      path.join(home, ".claude.json"),
      JSON.stringify({ numStartups: 4, installMethod: "native" }),
    );

    const changes = await write(
      { mcp: { servers: { demo: { command: "node", args: ["server.js"] } } } },
      { artifactRoot: home, artifactKind: "project", scope: "user" },
    );
    applyChangesOrThrow(home, changes);

    expect(JSON.parse(fs.readFileSync(path.join(home, ".claude.json"), "utf8"))).toEqual({
      numStartups: 4,
      installMethod: "native",
      mcpServers: { demo: { command: "node", args: ["server.js"] } },
    });
  });
});
