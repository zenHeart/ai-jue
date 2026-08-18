import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { hashArtifactContent, type ArtifactChange } from "ai-jue-core";
import { runCoreAdapter, type CoreCapableAdapterModule } from "../src/core-apply";
import type { MergedConfig } from "../src/config";
import { initI18n } from "../src/i18n";

beforeAll(async () => {
  await initI18n("en");
});

describe("runCoreAdapter apply scope", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
    process.exitCode = 0;
  });

  function tempRoot(label: string): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), label));
    roots.push(root);
    return root;
  }

  function change(scope: "project" | "user"): ArtifactChange {
    return {
      target: "fake",
      kind: "create",
      ownership: "full",
      scope,
      path: "notes.md",
      beforeHash: null,
      afterHash: hashArtifactContent("hello"),
      content: "hello",
      risk: "low",
      requiresApproval: false,
      atomicState: "planned",
    };
  }

  it("lets CLI scope override target config and writes only under the user root", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    let receivedContext: Record<string, unknown> | undefined;
    const adapter: CoreCapableAdapterModule = {
      supportedScopes: ["project", "user"],
      async write(_canonical, context) {
        receivedContext = context;
        return [change("user")];
      },
    };
    const config = { targets: { fake: { scope: "project" } } } as unknown as MergedConfig;

    const exitCode = await runCoreAdapter("ai-jue-adapter-fake", adapter, config, projectRoot, {
      scope: "user",
      userHome,
    });

    expect(exitCode).toBe(0);
    expect(receivedContext).toMatchObject({
      projectRoot: userHome,
      artifactRoot: userHome,
      scope: "user",
      artifactKind: "project",
    });
    expect(fs.readFileSync(path.join(userHome, "notes.md"), "utf8")).toBe("hello");
    expect(fs.existsSync(path.join(projectRoot, "notes.md"))).toBe(false);
  });

  it("treats an Adapter without supportedScopes metadata as project-only", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    const adapter: CoreCapableAdapterModule = {
      async write() {
        return [change("user")];
      },
    };

    await expect(
      runCoreAdapter("ai-jue-adapter-legacy", adapter, {} as MergedConfig, projectRoot, {
        scope: "user",
        userHome,
      }),
    ).rejects.toThrow('does not support apply scope "user"');
    expect(fs.readdirSync(userHome)).toEqual([]);
  });

  it("rejects Plugin artifacts in user scope before invoking write", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    let called = false;
    const adapter: CoreCapableAdapterModule = {
      supportedScopes: ["project", "user"],
      async write() {
        called = true;
        return [];
      },
    };

    await expect(
      runCoreAdapter("ai-jue-adapter-claude", adapter, {} as MergedConfig, projectRoot, {
        scope: "user",
        userHome,
        artifactKind: "plugin",
      }),
    ).rejects.toThrow('artifact kind "plugin"');
    expect(called).toBe(false);
  });

  it("makes Core reject an Adapter change stamped with the wrong scope", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    const adapter: CoreCapableAdapterModule = {
      supportedScopes: ["project", "user"],
      async write() {
        return [change("project")];
      },
    };

    await expect(
      runCoreAdapter("ai-jue-adapter-fake", adapter, {} as MergedConfig, projectRoot, {
        scope: "user",
        userHome,
      }),
    ).rejects.toThrow('does not match authorized apply scope "user"');
    expect(fs.readdirSync(userHome)).toEqual([]);
  });
});
