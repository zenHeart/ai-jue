import fs from "fs";
import os from "os";
import path from "path";
import { stripVTControlCharacters } from "node:util";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  hashArtifactContent,
  type Adapter,
  type ArtifactChange,
} from "ai-jue-core";
import { runCoreAdapter } from "../src/core-apply";
import type { MergedConfig } from "../src/config";
import { initI18n } from "../src/i18n";
import { logger } from "../src/logger";

beforeAll(async () => {
  await initI18n("en");
});

describe("runCoreAdapter apply scope", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    roots.length = 0;
    process.exitCode = 0;
    vi.restoreAllMocks();
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

  function fakeAdapter(overrides: Partial<Adapter> = {}): Adapter {
    return {
      id: "fake",
      capabilities: {
        rules: "unsupported",
        commands: "unsupported",
        skills: "unsupported",
        agents: "unsupported",
        hooks: "unsupported",
        mcp: "unsupported",
      },
      async read() {
        return {};
      },
      async write() {
        return [];
      },
      async confirm() {
        return { target: "fake", status: "unconfirmed" };
      },
      ...overrides,
    };
  }

  it("lets CLI scope override target config and writes only under the user root", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    let receivedContext: Record<string, unknown> | undefined;
    const adapter = fakeAdapter({
      supportedScopes: ["project", "user"],
      async write(_canonical, context) {
        receivedContext = context;
        return [change("user")];
      },
    });
    const config = { targets: { fake: { scope: "project" } } } as unknown as MergedConfig;

    const exitCode = await runCoreAdapter(adapter, config, projectRoot, {
      scope: "user",
      userHome,
    });

    expect(exitCode).toBe(0);
    expect(receivedContext).toMatchObject({
      artifactRoot: userHome,
      scope: "user",
      artifactKind: "project",
    });
    expect(receivedContext).not.toHaveProperty("projectRoot");
    expect(fs.readFileSync(path.join(userHome, "notes.md"), "utf8")).toBe("hello");
    expect(fs.existsSync(path.join(projectRoot, "notes.md"))).toBe(false);
  });

  it("treats an Adapter without supportedScopes metadata as project-only", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    const adapter = fakeAdapter({
      id: "project-only",
      async write() {
        return [change("user")];
      },
    });

    await expect(
      runCoreAdapter(adapter, {} as MergedConfig, projectRoot, {
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
    const adapter = fakeAdapter({
      id: "claude-code",
      supportedScopes: ["project", "user"],
      async write() {
        called = true;
        return [];
      },
    });

    await expect(
      runCoreAdapter(adapter, {} as MergedConfig, projectRoot, {
        scope: "user",
        userHome,
        artifactKind: "plugin",
      }),
    ).rejects.toThrow('artifact kind "plugin"');
    expect(called).toBe(false);
  });

  it("resolves target-private config from the canonical Adapter id", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    let receivedContext: Record<string, unknown> | undefined;
    const adapter = fakeAdapter({
      id: "claude-code",
      async write(_canonical, context) {
        receivedContext = context;
        return [];
      },
    });
    const config = {
      tools: { claude: { settingSources: ["user", "project"] } },
    } as unknown as MergedConfig;

    await runCoreAdapter(adapter, config, projectRoot, { dryRun: true });

    expect(receivedContext?.toolsConfig).toEqual({
      settingSources: ["user", "project"],
    });
  });

  it("makes Core reject an Adapter change stamped with the wrong scope", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    const adapter = fakeAdapter({
      supportedScopes: ["project", "user"],
      async write() {
        return [change("project")];
      },
    });

    await expect(
      runCoreAdapter(adapter, {} as MergedConfig, projectRoot, {
        scope: "user",
        userHome,
      }),
    ).rejects.toThrow('does not match authorized apply scope "user"');
    expect(fs.readdirSync(userHome)).toEqual([]);
  });

  it("logs one resolved target line before invoking the Adapter writer", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    const events: string[] = [];
    vi.spyOn(logger, "info").mockImplementation((message) => {
      events.push(stripVTControlCharacters(String(message)));
    });
    const adapter = fakeAdapter({
      supportedScopes: ["project", "user"],
      async write() {
        events.push("writer-called");
        return [];
      },
    });

    await runCoreAdapter(adapter, {} as MergedConfig, projectRoot, {
      dryRun: true,
      scope: "user",
      userHome,
    });

    expect(events[0]).toBe(
      `adapter=fake scope=user root=${path.resolve(userHome)} artifact=project`,
    );
    expect(events[1]).toBe("writer-called");
  });

  it("passes the resolved user target context and applied results to confirm", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    const userHome = tempRoot("jue-user-root-");
    let receivedContext: Record<string, unknown> | undefined;
    let receivedResults = 0;
    const messages: string[] = [];
    vi.spyOn(logger, "info").mockImplementation((message) => {
      messages.push(stripVTControlCharacters(String(message)));
    });
    const adapter = fakeAdapter({
      supportedScopes: ["project", "user"],
      async write() {
        return [change("user")];
      },
      async confirm(results, context) {
        receivedResults = results.length;
        receivedContext = context;
        return { target: "fake", status: "confirmed", evidence: "native fixture loaded" };
      },
    });

    const exitCode = await runCoreAdapter(adapter, {} as MergedConfig, projectRoot, {
      scope: "user",
      userHome,
    });

    expect(exitCode).toBe(0);
    expect(receivedResults).toBe(1);
    expect(receivedContext).toEqual({
      artifactRoot: path.resolve(userHome),
      scope: "user",
      artifactKind: "project",
    });
    expect(messages).toContain("fake: applied 1 change(s):");
    expect(messages).not.toContain("fake: 1 change(s) would be written:");
  });

  it("keeps a converged check successful when native confirmation is unavailable", async () => {
    const projectRoot = tempRoot("jue-project-root-");
    let confirmCalls = 0;
    const adapter = fakeAdapter({
      async confirm() {
        confirmCalls += 1;
        return { target: "fake", status: "unconfirmed" };
      },
    });

    const exitCode = await runCoreAdapter(adapter, {} as MergedConfig, projectRoot, {
      check: true,
    });

    expect(exitCode).toBe(0);
    expect(confirmCalls).toBe(1);
  });

  it("fails a converged check when native confirmation returns failed", async () => {
    const artifactRoot = tempRoot("jue-project-root-");
    const adapter = fakeAdapter({
      async confirm() {
        return { target: "fake", status: "failed", evidence: "invalid native state" };
      },
    });

    const exitCode = await runCoreAdapter(adapter, {} as MergedConfig, artifactRoot, {
      check: true,
    });

    expect(exitCode).toBe(1);
  });
});
