import path from "path";
import { vi } from "vitest";
import { defineAdapterContractSuite } from "ai-jue-core/testkit";
import type { CanonicalDocument } from "ai-jue-core";
import { confirm } from "../src/confirm";
import { read } from "../src/read";
import { write } from "../src/write";

// `confirm()` invokes the real `codex` CLI (marketplace add → plugin add →
// plugin list --json, isolated CODEX_HOME). Even on a fast machine that
// chain takes 5–10s; vitest's default 5s per-test timeout flakes on a
// full-suite run. Widen the budget for this file only.
vi.setConfig({ testTimeout: 30_000 });

/**
 * JUE-301 Codex Adapter contract suite — uses the shared
 * `defineAdapterContractSuite` (JUE-202) so the same six categories of
 * contract test that drive Claude and the neutral fixture also drive Codex,
 * with no Claude-specific code.
 *
 * Note: Codex 0.145.0 has no `codex plugin validate` subcommand. The real
 * `confirm()` in `../src/confirm` proves the Plugin is installed+enabled
 * via `codex plugin list --json` against an isolated CODEX_HOME (the
 * closest thing Codex currently offers to `claude plugin validate --strict`).
 */
const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures");

const SYNTHETIC_CANONICAL: CanonicalDocument = {
  context: { global: "Neutral Codex fixture context." },
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
};

defineAdapterContractSuite({
  adapter: { target: "codex", read, write },
  syntheticCanonical: SYNTHETIC_CANONICAL,
  unmanagedFieldCases: [
    {
      name: "AGENTS.md unrelated user prose",
      relativePath: "AGENTS.md",
      seedContent: "User-authored notes.",
      assertPreserved: (finalContent) => {
        if (!finalContent.includes("User-authored notes.")) {
          throw new Error("user prose in AGENTS.md was not preserved");
        }
      },
    },
  ],
  securityRejectionCases: [
    {
      name: "literal secret in MCP server env",
      root: path.join(FIXTURES_ROOT, "failures", "sensitive-reference"),
      expectedErrorSubstring: "must reference a runtime environment variable",
    },
  ],
  nativeFixtures: [
    {
      name: "project",
      root: path.join(FIXTURES_ROOT, "project"),
    },
    {
      name: "plugin",
      root: path.join(FIXTURES_ROOT, "plugin"),
      writeContext: {
        artifactKind: "plugin",
        pluginManifest: {
          name: "jue-301-fixture",
          version: "0.1.0",
          description: "Neutral Codex Adapter Plugin fixture for JUE-301",
          author: { name: "ai-jue fixtures" },
        },
      },
      confirmNatively: async (root) => {
        const result = await confirm([], { projectRoot: root, artifactKind: "plugin" });
        if (result.status !== "confirmed") {
          throw new Error(`expected Codex confirm() to be 'confirmed', got status="${result.status}" evidence=${result.evidence ?? ""}`);
        }
      },
    },
  ],
});
