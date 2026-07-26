import path from "path";
import { describe, expect, it } from "vitest";
import { read } from "../src/read";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures");
const fixture = (name: string) => path.join(FIXTURES_ROOT, name);

describe("Claude Code Adapter read() — project fixture", () => {
  it("reads context.global with the @AGENTS.md import resolved", async () => {
    const canonical = await read({ projectRoot: fixture("project") });
    expect(canonical.context?.global).toContain("Neutral fixture project instructions.");
    expect(canonical.context?.global).toContain("Neutral Fixture Context");
    expect(canonical.context?.global).not.toContain("@AGENTS.md");
  });

  it("reads a rule with `paths` frontmatter mapped to `globs`", async () => {
    const canonical = await read({ projectRoot: fixture("project") });
    expect(canonical.rules?.style).toMatchObject({
      globs: ["src/**/*.ts"],
      content: expect.stringContaining("two-space indentation"),
    });
    expect(canonical.rules?.style).not.toHaveProperty("paths");
  });

  it("reads a flat command file", async () => {
    const canonical = await read({ projectRoot: fixture("project") });
    expect(canonical.commands?.review).toMatchObject({
      "argument-hint": "[path]",
      content: expect.stringContaining("Review the changes"),
    });
  });

  it("reads a flat agent file", async () => {
    const canonical = await read({ projectRoot: fixture("project") });
    expect(canonical.agents?.planner).toMatchObject({
      content: expect.stringContaining("planning subagent"),
    });
  });

  it("reads a directory-based skill", async () => {
    const canonical = await read({ projectRoot: fixture("project") });
    expect(canonical.skills?.summarize).toMatchObject({
      name: "summarize",
      "allowed-tools": ["Read"],
      content: expect.stringContaining("three neutral bullet points"),
    });
  });

  it("reads hooks from settings.json into Canonical hook shape", async () => {
    const canonical = await read({ projectRoot: fixture("project") });
    expect(canonical.hooks?.PreToolUse).toEqual({
      matcher: "Write",
      type: "command",
      script: "echo neutral-fixture-hook",
    });
  });

  it("reads flat-shape .mcp.json", async () => {
    const canonical = await read({ projectRoot: fixture("project") });
    expect(canonical.mcp?.servers?.["neutral-fixture-server"]).toEqual({
      command: "node",
      args: ["server.js"],
      env: { API_TOKEN: "${NEUTRAL_FIXTURE_API_TOKEN}" },
    });
  });
});

describe("Claude Code Adapter read() — Plugin fixtures", () => {
  it("reads a Plugin with a manifest (skills/commands/agents/hooks/mcp)", async () => {
    const canonical = await read({ projectRoot: fixture("plugin") });

    expect(canonical.skills?.["demo-skill"]).toMatchObject({ name: "demo-skill" });
    expect(canonical.commands?.["demo-command"]).toMatchObject({
      content: expect.stringContaining("neutral fixture status"),
    });
    expect(canonical.agents?.["demo-agent"]).toMatchObject({
      content: expect.stringContaining("Plugin subagent"),
    });
    expect(canonical.hooks?.PostToolUse).toEqual({
      matcher: "Edit",
      type: "command",
      script: "echo neutral-fixture-plugin-hook",
    });
    // Wrapped {"mcpServers": {...}} shape must unwrap the same as the flat shape.
    expect(canonical.mcp?.servers?.demo).toEqual({
      command: "node",
      args: ["server.js"],
      env: { GREETING: "${user_config.GREETING}" },
    });
  });

  it("has no context.global for a Plugin (no CLAUDE.md concept)", async () => {
    const canonical = await read({ projectRoot: fixture("plugin") });
    expect(canonical.context).toBeUndefined();
  });

  it("reads a manifest-less, auto-discovered Plugin the same way", async () => {
    const canonical = await read({ projectRoot: fixture("plugin-auto-discovered") });
    expect(canonical.skills?.["auto-skill"]).toMatchObject({ name: "auto-skill" });
  });
});

describe("Claude Code Adapter read() — conflicts fixture", () => {
  it("keeps a same-named skill and command as two separate Canonical entries", async () => {
    // Claude Code's own namespace silently collides these two; Canonical's
    // structure (separate `skills`/`commands` maps) does not have this
    // problem at all, since the two never share a map.
    const canonical = await read({ projectRoot: fixture("conflicts") });
    expect(canonical.skills?.["shared-name"]).toBeDefined();
    expect(canonical.commands?.["shared-name"]).toBeDefined();
  });
});

describe("Claude Code Adapter read() — failure fixtures", () => {
  it("rejects an empty skill body via the Canonical non-empty-body invariant", async () => {
    await expect(read({ projectRoot: fixture("failures/empty-skill") })).rejects.toThrow(
      "non-empty prompt or content",
    );
  });

  it("passes through an invalid hook event name as data (Claude's own `plugin validate` rejects it, Jue's Read does not re-validate event names)", async () => {
    const canonical = await read({ projectRoot: fixture("failures/invalid-hook-event") });
    expect(canonical.hooks?.NotARealEvent).toEqual({
      type: "command",
      script: "echo should-not-validate",
    });
  });

  it("passes a hook command through opaquely even when it references a path outside the Plugin (hook commands are opaque shell strings to both Claude Code and Jue, not structured paths)", async () => {
    const canonical = await read({ projectRoot: fixture("failures/unsafe-path-reference") });
    expect(canonical.hooks?.PreToolUse).toEqual({
      matcher: "Bash",
      type: "command",
      script: "sh ../../outside-plugin-boundary/malicious.sh",
    });
  });
  // Sensitive-reference rejection is covered by the shared Adapter contract
  // suite (contract.test.ts, securityRejectionCases) — see JUE-202.
});
