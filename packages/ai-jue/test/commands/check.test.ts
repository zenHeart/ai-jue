import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkPresetVersions } from "../../src/commands/check";

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-check-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("checkPresetVersions", () => {
  it("skips a private workspace preset without querying the registry", async () => {
    const root = tempDir();
    const packageRoot = path.join(root, "presets", "neutral");
    const moduleRoot = path.join(root, "node_modules");
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.mkdirSync(moduleRoot);
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ private: true, workspaces: ["presets/*"] }),
    );
    fs.writeFileSync(
      path.join(packageRoot, "package.json"),
      JSON.stringify({
        name: "jue-preset-neutral",
        version: "1.0.0",
        private: true,
      }),
    );
    fs.symlinkSync(
      packageRoot,
      path.join(moduleRoot, "jue-preset-neutral"),
      process.platform === "win32" ? "junction" : "dir",
    );
    const viewVersion = vi.fn(async () => {
      throw new Error("registry must not be called");
    });

    const results = await checkPresetVersions(["neutral"], {
      cwd: root,
      viewVersion,
    });

    expect(results).toEqual([
      expect.objectContaining({
        packageName: "jue-preset-neutral",
        installedVersion: "1.0.0",
        skipped: true,
        hasUpdate: false,
      }),
    ]);
    expect(viewVersion).not.toHaveBeenCalled();
  });

  it("skips a file dependency even when installed under node_modules", async () => {
    const root = tempDir();
    const packageRoot = path.join(root, "node_modules", "jue-preset-neutral");
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        devDependencies: { "jue-preset-neutral": "file:./presets/neutral" },
      }),
    );
    fs.writeFileSync(
      path.join(packageRoot, "package.json"),
      JSON.stringify({ name: "jue-preset-neutral", version: "1.0.0" }),
    );
    const viewVersion = vi.fn();

    const results = await checkPresetVersions(["neutral"], {
      cwd: root,
      viewVersion,
    });

    expect(results[0].skipped).toBe(true);
    expect(viewVersion).not.toHaveBeenCalled();
  });

  it("queries the registry for a published dependency", async () => {
    const root = tempDir();
    const packageRoot = path.join(root, "node_modules", "jue-preset-neutral");
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        devDependencies: { "jue-preset-neutral": "^1.0.0" },
      }),
    );
    fs.writeFileSync(
      path.join(packageRoot, "package.json"),
      JSON.stringify({ name: "jue-preset-neutral", version: "1.0.0" }),
    );
    const viewVersion = vi.fn(async () => "1.1.0");

    const results = await checkPresetVersions(["neutral"], {
      cwd: root,
      viewVersion,
    });

    expect(viewVersion).toHaveBeenCalledWith("jue-preset-neutral");
    expect(results[0]).toMatchObject({
      installedVersion: "1.0.0",
      latestVersion: "1.1.0",
      hasUpdate: true,
    });
  });
});
