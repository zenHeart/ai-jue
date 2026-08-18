import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import type { CanonicalDocument } from "ai-jue-core";
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
      projectRoot: home,
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
});
