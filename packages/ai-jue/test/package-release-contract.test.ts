import fs from "fs";
import path from "path";
import semver from "semver";
import { describe, expect, it } from "vitest";

interface PackageManifest {
  name: string;
  version: string;
  main?: string;
  types?: string;
  bin?: Record<string, string>;
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const PUBLISHED_DIRS = [
  "ai-jue",
  "ai-jue-core",
  "ai-jue-adapter-claude",
  "ai-jue-adapter-codex",
  "ai-jue-adapter-cursor",
  "ai-jue-adapter-hermes",
  "ai-jue-adapter-openclaw",
] as const;

function manifest(directory: string): PackageManifest {
  const file = path.join(process.cwd(), "packages", directory, "package.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as PackageManifest;
}

describe("published package release contract", () => {
  const manifests = PUBLISHED_DIRS.map(manifest);
  const byName = new Map(manifests.map((item) => [item.name, item]));

  it("uses bounded internal ranges that include the in-repo release", () => {
    for (const consumer of manifests) {
      const ranges = {
        ...consumer.dependencies,
        ...consumer.devDependencies,
        ...consumer.peerDependencies,
      };
      for (const [dependency, range] of Object.entries(ranges)) {
        const local = byName.get(dependency);
        if (!local) continue;
        expect(range, `${consumer.name} -> ${dependency}`).not.toBe("*");
        expect(
          semver.satisfies(local.version, range),
          `${consumer.name} requires ${dependency}@${range}, local release is ${local.version}`,
        ).toBe(true);
      }
    }
  });

  it("publishes one explicit root entry for every Extension", () => {
    for (const directory of PUBLISHED_DIRS.filter((name) => name.startsWith("ai-jue-adapter-"))) {
      const item = manifest(directory);
      expect(Object.keys(item.exports ?? {}), item.name).toEqual(["."]);
      expect(item.peerDependencies?.["ai-jue-core"], item.name).toBe("^2.0.0");
      expect(item.devDependencies?.["ai-jue-core"], item.name).toBe("^2.0.0");
      expect(item.dependencies?.["ai-jue-core"], item.name).toBeUndefined();
      for (const [dependency, range] of Object.entries(item.peerDependencies ?? {})) {
        if (!byName.has(dependency)) continue;
        expect(item.devDependencies?.[dependency], `${item.name} -> ${dependency}`).toBe(range);
      }
    }
  });

  it("points every package export at a built file", () => {
    for (const directory of PUBLISHED_DIRS.filter((name) => name !== "ai-jue")) {
      const item = manifest(directory);
      for (const [subpath, target] of Object.entries(item.exports ?? {})) {
        expect(typeof target, `${item.name} export ${subpath}`).toBe("object");
        for (const [condition, relativePath] of Object.entries(target as Record<string, unknown>)) {
          expect(typeof relativePath, `${item.name} export ${subpath}.${condition}`).toBe("string");
          expect(
            fs.existsSync(path.join(process.cwd(), "packages", directory, String(relativePath))),
            `${item.name} export ${subpath}.${condition} -> ${relativePath}`,
          ).toBe(true);
        }
      }
    }
  });

  it("publishes ai-jue as a CLI-only package with real bin entries", () => {
    const cli = manifest("ai-jue");
    expect(cli.main).toBeUndefined();
    expect(cli.types).toBeUndefined();
    expect(cli.exports).toBeUndefined();
    expect(cli.bin).toEqual({
      jue: "dist/cli.js",
      "ai-jue": "dist/cli.js",
      "ai-jue-cli": "dist/cli.js",
    });
    for (const entry of Object.values(cli.bin ?? {})) {
      expect(fs.existsSync(path.join(process.cwd(), "packages", "ai-jue", entry))).toBe(true);
    }
  });

  it("ships the Codex TOML parser as a runtime dependency", () => {
    const codex = manifest("ai-jue-adapter-codex");
    expect(codex.dependencies?.["@iarna/toml"]).toBe("^2.2.5");
  });
});
