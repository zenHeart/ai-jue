import path from "path";
import { describe, expect, it } from "vitest";
import { read } from "../src/read";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures");

describe("cursor read()", () => {
  it("reads the project fixture into Canonical DSL", async () => {
    const canonical = await read({ projectRoot: path.join(FIXTURES_ROOT, "project") });
    expect(canonical.context?.global).toContain("Neutral shared context");
    expect(canonical.rules?.style).toMatchObject({
      description: "Neutral style rule",
      alwaysApply: true,
    });
    expect(canonical.commands?.review).toMatchObject({ description: "Neutral review command" });
    expect(canonical.skills?.summarize).toMatchObject({ name: "summarize" });
    expect(canonical.agents?.planner).toMatchObject({ description: "Neutral planner agent" });
    expect(canonical.hooks?.PostToolUse).toMatchObject({
      script: "echo neutral-fixture-project-hook",
      matcher: "Edit",
    });
    expect(canonical.mcp?.servers?.demo).toMatchObject({ command: "node" });
  });

  it("reads the plugin fixture into Canonical DSL without context.global", async () => {
    const canonical = await read({ projectRoot: path.join(FIXTURES_ROOT, "plugin") });
    expect(canonical.context).toBeUndefined();
    expect(canonical.rules?.style).toBeDefined();
    expect(canonical.hooks?.PostToolUse).toMatchObject({
      script: "echo neutral-fixture-plugin-hook",
    });
    expect(canonical.mcp?.servers?.demo?.env?.TOKEN).toBe("${DEMO_TOKEN}");
  });

  it("reads the minimal plugin fixture", async () => {
    const canonical = await read({ projectRoot: path.join(FIXTURES_ROOT, "plugin-minimal") });
    expect(canonical.skills?.minimal).toMatchObject({ name: "minimal" });
    expect(canonical.rules).toBeUndefined();
  });
});
