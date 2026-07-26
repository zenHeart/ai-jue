import path from "path";
import { defineAdapterContractSuite } from "../src/adapter-contract-kit";
import type { CanonicalDocument } from "../src/canonical-document";
import { confirm } from "./fixtures/neutral-adapter/confirm";
import { read } from "./fixtures/neutral-adapter/read";
import { write } from "./fixtures/neutral-adapter/write";

/**
 * JUE-204: proves the `agent-extension` Skill and the shared contract-test
 * suite (JUE-202, `ai-jue-core/testkit`) generalize to a Native ⇄ Canonical
 * shape genuinely different from Claude Code's — one small JSON file per
 * Capability *type* (vs. Claude's file/directory per Capability *item*),
 * plus one deliberate key-rename translation (`mcp.servers` ↔
 * `mcp.mcpServers`) — with **zero** changes to `ai-jue-core` (Canonical DSL,
 * Core executor, capability-mapping engine) required. This fictional Agent
 * is a test fixture only (`test/fixtures/neutral-adapter/`), not a
 * workspace package: it has no real native CLI to confirm against, isn't
 * discoverable by `jue apply`'s adapter glob, and isn't an R3 candidate.
 */

const NATIVE_ROOT = path.join(__dirname, "fixtures", "neutral-adapter", "native");

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

defineAdapterContractSuite({
  adapter: { target: "neutral-agent", read, write },
  syntheticCanonical: SYNTHETIC_CANONICAL,
  unmanagedFieldCases: [
    {
      name: "rules.json unrelated key",
      relativePath: "rules.json",
      seedContent: JSON.stringify({ unrelatedRule: "kept" }, null, 2),
      assertPreserved: (finalContent) => {
        const parsed = JSON.parse(finalContent);
        if (parsed.unrelatedRule !== "kept") {
          throw new Error("unrelated rules.json key was not preserved");
        }
      },
    },
  ],
  securityRejectionCases: [
    {
      name: "literal secret in MCP server env",
      root: path.join(NATIVE_ROOT, "sensitive-reference"),
      expectedErrorSubstring: "must reference a runtime environment variable",
    },
  ],
  nativeFixtures: [
    {
      name: "project",
      root: path.join(NATIVE_ROOT, "project"),
      confirmNatively: async (root) => {
        const result = await confirm([], { projectRoot: root });
        if (result.status !== "unconfirmed") {
          throw new Error(`expected 'unconfirmed' (no native tool exists), got "${result.status}"`);
        }
      },
    },
  ],
});
