import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { runAdapterList } from "../../src/commands/apply";
import type { MergedConfig } from "../../src/config";
import { initI18n } from "../../src/i18n";

beforeAll(async () => {
  await initI18n("en");
});

describe("runAdapterList per-adapter isolation", () => {
  afterEach(() => {
    // runCoreAdapter writes process.exitCode for each branch; do not leak it
    // into the rest of the test process.
    process.exitCode = 0;
  });

  it("continues the batch when one Adapter fails and aggregates its exit code", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-apply-batch-"));
    try {
      // claude → scope "user" makes runCoreAdapter throw
      // UnsupportedArtifactScopeError (exit 2) before any write; hermes must
      // still run afterwards and apply its workspace Artifact.
      const config = {
        targets: { claude: { scope: "user" } },
        context: { global: "Neutral context." },
      } as unknown as MergedConfig;
      const exitCode = await runAdapterList(
        ["ai-jue-adapter-claude", "ai-jue-adapter-hermes"],
        config,
        outputDir,
      );
      expect(exitCode).toBe(2);
      expect(fs.readdirSync(outputDir).length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(outputDir, { recursive: true, force: true });
      process.exitCode = 0;
    }
  });
});
