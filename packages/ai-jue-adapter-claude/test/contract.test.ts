import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { defineAdapterContractSuite } from "ai-jue-core/testkit";
import type { CanonicalDocument } from "ai-jue-core";
import { hasCli } from "../../ai-jue-core/test/has-cli";
import { read } from "../src/read";
import { write } from "../src/write";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures");
const fixture = (name: string) => path.join(FIXTURES_ROOT, name);

// A synthetic Canonical fixture, already normalized the way the real
// normalize() pipeline (packages/ai-jue/src/normalize.ts, upstream of any
// Adapter) leaves it: `content`/`prompt` mirrored on every capability entry,
// and every hook entry carries an explicit `type`.
const SYNTHETIC_CANONICAL: CanonicalDocument = {
  context: { global: "Neutral shared context." },
  rules: {
    style: {
      description: "Neutral rule",
      globs: ["src/**/*.ts"],
      content: "Use two spaces.",
      prompt: "Use two spaces.",
    },
  },
  commands: {
    review: {
      description: "Neutral command",
      content: "Review the diff.",
      prompt: "Review the diff.",
    },
  },
  agents: {
    planner: {
      description: "Neutral agent",
      content: "Plan the work.",
      prompt: "Plan the work.",
    },
  },
  skills: {
    summarize: {
      name: "summarize",
      description: "Neutral skill",
      "allowed-tools": ["Read"],
      content: "Summarize the content.",
      prompt: "Summarize the content.",
    },
  },
  hooks: {
    PreToolUse: { matcher: "Write", type: "command", script: "echo hook" },
  },
  mcp: {
    servers: {
      demo: { command: "node", args: ["server.js"], env: { TOKEN: "${DEMO_TOKEN}" } },
    },
  },
};

function claudePluginValidateStrict(root: string): void {
  // GitHub Actions runners (and many CI images) do not ship the Claude Code CLI.
  // Structural read/write contract coverage still runs; native validate is local-only.
  if (!hasCli("claude")) return;
  const result = execFileSync("claude", ["plugin", "validate", root, "--strict"], { encoding: "utf8" });
  if (!result.includes("Validation passed")) {
    throw new Error(`claude plugin validate --strict did not pass:\n${result}`);
  }
}

defineAdapterContractSuite({
  adapter: { target: "claude-code", read, write },
  syntheticCanonical: SYNTHETIC_CANONICAL,
  unmanagedFieldCases: [
    {
      name: "settings.json unrelated key",
      relativePath: path.join(".claude", "settings.json"),
      seedContent: JSON.stringify({ unrelatedSetting: "kept" }, null, 2),
      assertPreserved: (finalContent) => {
        const settings = JSON.parse(finalContent);
        if (settings.unrelatedSetting !== "kept") {
          throw new Error("unrelated settings.json key was not preserved");
        }
      },
    },
    {
      name: "CLAUDE.md user prose",
      relativePath: "CLAUDE.md",
      seedContent: "User-authored notes.",
      assertPreserved: (finalContent) => {
        if (!finalContent.includes("User-authored notes.")) {
          throw new Error("user prose in CLAUDE.md was not preserved");
        }
        if (!finalContent.includes("Neutral shared context.")) {
          throw new Error("managed context.global content was not written");
        }
      },
    },
  ],
  securityRejectionCases: [
    {
      name: "literal secret in MCP server env",
      root: fixture("failures/sensitive-reference"),
      expectedErrorSubstring: "must reference a runtime environment variable",
    },
  ],
  nativeFixtures: [
    {
      name: "project",
      root: fixture("project"),
      setupTempRoot: (tempRoot) => fs.mkdirSync(path.join(tempRoot, ".claude"), { recursive: true }),
    },
    {
      name: "plugin",
      root: fixture("plugin"),
      writeContext: {
        artifactKind: "plugin",
        // claude plugin validate requires a manifest to exist at all; the
        // plugin/ fixture's own read() output has no manifest field to
        // round-trip (manifests are Jue-side metadata, not a Canonical
        // Capability), so one is supplied here purely to make native
        // confirmation possible for this Artifact kind.
        pluginManifest: {
          name: "jue-contract-suite-plugin",
          version: "1.0.0",
          description: "Neutral fixture Plugin for the shared Adapter contract suite.",
          author: { name: "ai-jue fixtures" },
        },
      },
      confirmNatively: claudePluginValidateStrict,
    },
  ],
});
