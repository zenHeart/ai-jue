import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { runExtensionDiagnostics } from "../../src/commands/inspect";

const CLAUDE_ADAPTER = "ai-jue-adapter-claude";

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-inspect-"));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("runExtensionDiagnostics", () => {
  it("reports the loaded Adapter's id and capability-support levels for a real Extension", async () => {
    const diagnostics = await runExtensionDiagnostics(CLAUDE_ADAPTER);
    expect(diagnostics.issues).toEqual([]);
    expect(diagnostics.adapters).toEqual([
      {
        id: "claude-code",
        capabilities: {
          rules: "supported",
          commands: "supported",
          skills: "supported",
          agents: "supported",
          hooks: "supported",
          mcp: "supported",
        },
      },
    ]);
    expect(diagnostics.applyReadiness).toBeUndefined();
  });

  it("reports metadata issues without attempting to load, when the package is invalid", async () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "broken", main: "index.js" }));
    const diagnostics = await runExtensionDiagnostics(root, { cwd: root });
    expect(diagnostics.issues.length).toBeGreaterThan(0);
    expect(diagnostics.adapters).toEqual([]);
  });

  it("reports apply-readiness against a real project directory when an applyCheck is supplied", async () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
    const diagnostics = await runExtensionDiagnostics(CLAUDE_ADAPTER, {
      applyCheck: {
        canonical: { commands: { demo: { description: "d", content: "c" } } } as any,
        projectRoot: root,
      },
    });
    expect(diagnostics.applyReadiness).toMatchObject({ adapterId: "claude-code", status: "pending", pendingCount: 1 });

    // A second check after nothing has actually been applied still reports pending.
    const second = await runExtensionDiagnostics(CLAUDE_ADAPTER, {
      applyCheck: {
        canonical: { commands: { demo: { description: "d", content: "c" } } } as any,
        projectRoot: root,
      },
    });
    expect(second.applyReadiness?.status).toBe("pending");
  });
});
