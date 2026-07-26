import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { runExtensionFixtureCheck } from "../../src/commands/extension";
import type { Adapter } from "ai-jue-core";

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-extension-fixtures-"));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function stubAdapter(behavior: (projectRoot: string) => Promise<unknown>): Adapter {
  return {
    id: "stub",
    capabilities: {
      rules: "unsupported",
      commands: "unsupported",
      skills: "unsupported",
      agents: "unsupported",
      hooks: "unsupported",
      mcp: "unsupported",
    },
    read: async ({ projectRoot }) => behavior(projectRoot) as any,
    write: async () => [],
    confirm: async () => ({ target: "stub", status: "unconfirmed" as const }),
  };
}

describe("runExtensionFixtureCheck", () => {
  it("reports one passing case per fixture subdirectory that reads as a valid CanonicalDocument", async () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, "a"));
    fs.mkdirSync(path.join(root, "b"));

    const adapter = stubAdapter(async () => ({ rules: { style: { description: "d", content: "c", prompt: "c" } } }));
    const results = await runExtensionFixtureCheck(adapter, root);

    expect(results).toEqual([
      { name: "a", path: path.join(root, "a"), ok: true },
      { name: "b", path: path.join(root, "b"), ok: true },
    ]);
  });

  it("reports a failing case with the schema error when read() output is not a valid CanonicalDocument", async () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, "broken"));

    const adapter = stubAdapter(async () => ({ rules: "not-an-object" }));
    const results = await runExtensionFixtureCheck(adapter, root);

    expect(results).toHaveLength(1);
    expect(results[0].ok).toBe(false);
    expect(results[0].error).toBeTruthy();
  });

  it("reports a failing case when read() itself throws", async () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, "throws"));

    const adapter = stubAdapter(async () => {
      throw new Error("boom");
    });
    const results = await runExtensionFixtureCheck(adapter, root);

    expect(results).toEqual([{ name: "throws", path: path.join(root, "throws"), ok: false, error: "boom" }]);
  });

  it("ignores non-directory entries", async () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, "real"));
    fs.writeFileSync(path.join(root, "README.md"), "not a fixture");

    const adapter = stubAdapter(async () => ({}));
    const results = await runExtensionFixtureCheck(adapter, root);

    expect(results.map((r) => r.name)).toEqual(["real"]);
  });
});
