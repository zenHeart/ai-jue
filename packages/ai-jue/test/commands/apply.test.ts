import fs from "fs";
import os from "os";
import path from "path";
import { stripVTControlCharacters } from "node:util";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { handler, runAdapterList } from "../../src/commands/apply";
import type { MergedConfig } from "../../src/config";
import { initI18n } from "../../src/i18n";
import { logger } from "../../src/logger";

beforeAll(async () => {
  await initI18n("en");
});

describe("runAdapterList per-adapter isolation", () => {
  afterEach(() => {
    // runCoreAdapter writes process.exitCode for each branch; do not leak it
    // into the rest of the test process.
    process.exitCode = 0;
    vi.restoreAllMocks();
  });

  it("continues the batch when one Adapter fails and aggregates its exit code", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-apply-batch-"));
    try {
      // codex is project-only, so scope "user" makes runCoreAdapter throw
      // before any write; hermes must
      // still run afterwards and apply its workspace Artifact.
      const config = {
        targets: { codex: { scope: "user" } },
        context: { global: "Neutral context." },
      } as unknown as MergedConfig;
      const exitCode = await runAdapterList(
        ["ai-jue-adapter-codex", "ai-jue-adapter-hermes"],
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

  it("does not install a missing Adapter during dry-run", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-read-only-install-"));
    const marker = path.join(root, "installer-called");
    const executable = path.join(root, process.platform === "win32" ? "npm.cmd" : "npm");
    fs.writeFileSync(
      executable,
      process.platform === "win32"
        ? `@echo called>"${marker}"\r\n@exit /b 1\r\n`
        : `#!/bin/sh\nprintf called > "${marker}"\nexit 1\n`,
    );
    if (process.platform !== "win32") fs.chmodSync(executable, 0o755);
    const originalPath = process.env.PATH;
    process.env.PATH = `${root}${path.delimiter}${originalPath ?? ""}`;
    try {
      const exitCode = await runAdapterList(
        ["ai-jue-adapter-read-only-missing"],
        {} as MergedConfig,
        process.cwd(),
        { dryRun: true },
      );

      expect(exitCode).toBe(1);
      expect(fs.existsSync(marker)).toBe(false);
    } finally {
      process.env.PATH = originalPath;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["dry-run", "check"] as const)(
    "keeps the config project and isolated user root unchanged during --%s",
    async (mode) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), `jue-${mode}-zero-write-`));
      const projectRoot = path.join(root, "project");
      const userHome = path.join(root, "home");
      const skillRoot = path.join(projectRoot, "vendor", "neutral-skill");
      fs.mkdirSync(skillRoot, { recursive: true });
      fs.mkdirSync(userHome, { recursive: true });
      fs.writeFileSync(
        path.join(skillRoot, "SKILL.md"),
        "---\ndescription: Neutral\n---\nNeutral skill\n",
      );
      fs.writeFileSync(
        path.join(projectRoot, "ai.config.cjs"),
        'module.exports={targets:{claude:{scope:"user"}},capabilities:{neutral:{source:"file:./vendor/neutral-skill",type:"skill"}}};\n',
      );
      const lockPath = path.join(projectRoot, "ai-jue.lock");
      fs.writeFileSync(lockPath, '{"version":1,"capabilities":{}}\n');
      const snapshot = (directory: string): Array<[string, string]> => {
        const files: Array<[string, string]> = [];
        const visit = (current: string) => {
          for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const absolute = path.join(current, entry.name);
            if (entry.isDirectory()) visit(absolute);
            else files.push([path.relative(directory, absolute), fs.readFileSync(absolute, "base64")]);
          }
        };
        visit(directory);
        return files.sort(([left], [right]) => left.localeCompare(right));
      };
      const beforeProject = snapshot(projectRoot);
      const beforeHome = snapshot(userHome);
      const logLines: string[] = [];
      vi.spyOn(logger, "info").mockImplementation((message) => {
        logLines.push(stripVTControlCharacters(String(message)));
      });
      const originalCwd = process.cwd();
      process.chdir(projectRoot);
      try {
        await handler(
          {
            adapter: ["claude"],
            scope: "user",
            [mode]: true,
          } as any,
          { userHome },
        );

        expect(snapshot(projectRoot)).toEqual(beforeProject);
        expect(snapshot(userHome)).toEqual(beforeHome);
        expect(logLines).toContain(
          `adapter=claude-code scope=user root=${userHome} artifact=project`,
        );
      } finally {
        process.chdir(originalCwd);
        fs.rmSync(root, { recursive: true, force: true });
        process.exitCode = 0;
      }
    },
  );
});
