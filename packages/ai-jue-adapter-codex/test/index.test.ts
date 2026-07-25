import { parse } from "@iarna/toml";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { generate } from "../src/index";
import {
  parseRequestedAdapters,
  resolveAdapterAlias,
} from "../../ai-jue/src/commands/apply";

let testDir: string;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(testDir, relativePath), "utf8");
}

describe("ai-jue-adapter-codex", () => {
  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-jue-codex-"));
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("maps the complete project-scoped Canonical contract", async () => {
    await generate(
      {
        context: { global: "Global context" },
        rules: {
          typed: {
            globs: ["src/**/*.ts"],
            content: "Use strict typing.",
          },
        },
        skills: {
          review: {
            description: "Review code",
            prompt: "Review carefully.",
            references: { "nested/说明.md": "UTF-8 reference" },
            assets: {
              "fixtures/sample.bin": {
                content: Buffer.from([0, 255, 128]).toString("base64"),
                encoding: "base64",
              },
            },
          },
        },
        commands: {
          test: {
            description: "Run tests",
            prompt: "Run the test suite.",
            triggers: ["/test"],
          },
        },
        agents: {
          reviewer: {
            description: "Reviews changes",
            prompt: "Review the current changes.",
            model: "gpt-5",
            unsupported: "omitted",
          },
        },
        mcp: {
          servers: {
            sqlite: {
              command: "uvx",
              args: ["mcp-server-sqlite"],
              scope: "project",
              env: { SECRET: "must-not-be-written" },
            },
            userOnly: { command: "ignored", scope: "user" },
          },
        },
        hooks: {
          PostToolUse: {
            script: "npm test",
            matcher: "Edit|Write",
            async: true,
            timeout: 30,
            statusMessage: "Checking changes",
          },
          SessionStart: "npm run prepare",
        },
        tools: {
          codex: {
            approval_policy: "on-request",
            sandbox_mode: "workspace-write",
            provider: "must-not-be-written",
          },
        },
      },
      testDir,
    );

    const agents = read("AGENTS.md");
    expect(agents).toContain("Global context");
    expect(agents).toContain("## Rule: typed");
    expect(agents).toContain("Scope: src/**/*.ts");

    const skill = read(".agents/skills/review/SKILL.md");
    expect(skill).toContain("Review carefully.");
    expect(read(".agents/skills/review/references/nested/说明.md")).toBe(
      "UTF-8 reference",
    );
    expect(
      fs.readFileSync(
        path.join(testDir, ".agents/skills/review/assets/fixtures/sample.bin"),
      ),
    ).toEqual(Buffer.from([0, 255, 128]));
    expect(read(".agents/skills/test/SKILL.md")).toContain("trigger-hints:");

    const agent = parse(read(".codex/agents/reviewer.toml")) as any;
    expect(agent.name).toBe("reviewer");
    expect(agent.description).toBe("Reviews changes");
    expect(agent.developer_instructions).toBe("Review the current changes.");
    expect(agent.model).toBe("gpt-5");
    expect(agent.unsupported).toBeUndefined();

    const codex = parse(read(".codex/config.toml")) as any;
    expect(codex.approval_policy).toBe("on-request");
    expect(codex.sandbox_mode).toBe("workspace-write");
    expect(codex.provider).toBeUndefined();
    expect(codex.mcp_servers.sqlite.command).toBe("uvx");
    expect(codex.mcp_servers.sqlite.args).toEqual(["mcp-server-sqlite"]);
    expect(codex.mcp_servers.sqlite.env).toBeUndefined();
    expect(codex.mcp_servers.userOnly).toBeUndefined();

    const hooks = JSON.parse(read(".codex/hooks.json"));
    expect(hooks.hooks.PostToolUse[0].matcher).toBe("Edit|Write");
    expect(hooks.hooks.PostToolUse[0].hooks[0]).toEqual({
      type: "command",
      command: "npm test",
      timeout: 30,
      statusMessage: "Checking changes",
    });
    expect(hooks.hooks.PostToolUse[0].hooks[0].async).toBeUndefined();
    expect(hooks.hooks.SessionStart[0].hooks[0]).toEqual({
      type: "command",
      command: "npm run prepare",
    });
  });

  it("supports the Codex CLI alias", () => {
    expect(resolveAdapterAlias("codex")).toBe("ai-jue-adapter-codex");
    expect(parseRequestedAdapters(["codex", "claude-code"])).toEqual([
      "ai-jue-adapter-codex",
      "ai-jue-adapter-claude",
    ]);
  });

  it("preserves user AGENTS.md text and is deterministic", async () => {
    fs.writeFileSync(path.join(testDir, "AGENTS.md"), "# User notes\n");
    const config = {
      context: { global: "Managed context" },
      rules: { stable: { content: "Stable rule" } },
      hooks: { SessionStart: "npm run prepare" },
      tools: { codex: { web_search: "cached" } },
    };

    await generate(config, testDir);
    const first = read("AGENTS.md");
    const firstConfig = read(".codex/config.toml");
    const firstHooks = read(".codex/hooks.json");
    await generate(config, testDir);

    expect(read("AGENTS.md")).toBe(first);
    expect(read(".codex/config.toml")).toBe(firstConfig);
    expect(read(".codex/hooks.json")).toBe(firstHooks);
    expect(first).toContain("# User notes");
    expect(first.match(/<!-- AI-JUE:START -->/g)).toHaveLength(1);
  });

  it("handles empty optional collections with a parseable empty project config", async () => {
    await generate(
      {
        context: {},
        rules: null,
        skills: undefined,
        commands: {},
        agents: null,
        mcp: { servers: {} },
        hooks: {},
        tools: { codex: {} },
      },
      testDir,
    );

    expect(fs.readdirSync(testDir)).toEqual([".codex"]);
    expect(parse(read(".codex/config.toml"))).toEqual({});
  });

  it("rejects unsafe names and support-file traversal", async () => {
    await expect(
      generate({ skills: { "../escape": { prompt: "bad" } } }, testDir),
    ).rejects.toThrow("safe single path segment");
    await expect(
      generate(
        {
          skills: {
            review: {
              prompt: "Review",
              references: { "../secret.md": "nope" },
            },
          },
        },
        testDir,
      ),
    ).rejects.toThrow("must stay inside");
  });

  it("rejects literal MCP credentials while omitting secret containers", async () => {
    await expect(
      generate(
        {
          mcp: {
            servers: {
              remote: {
                url: "https://example.test/mcp?access_token=secret-value",
              },
            },
          },
        },
        testDir,
      ),
    ).rejects.toThrow("contains credentials");
    await expect(
      generate(
        {
          mcp: {
            servers: {
              local: {
                command: "server",
                args: ["--api-key", "literal-secret"],
              },
            },
          },
        },
        testDir,
      ),
    ).rejects.toThrow("literal credential");
  });

  it("rejects malformed hooks instead of emitting invalid native config", async () => {
    await expect(
      generate(
        {
          hooks: {
            PostToolUse: { matcher: "Edit", async: true },
          },
        },
        testDir,
      ),
    ).rejects.toThrow(
      "Codex hook PostToolUse[0] must define a non-empty command script",
    );
    expect(fs.existsSync(path.join(testDir, ".codex", "hooks.json"))).toBe(false);
  });
});
