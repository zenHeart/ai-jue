import path from "path";
import { describe, expect, it } from "vitest";
import { defineAdapterContractSuite } from "ai-jue-core/testkit";
import type { CanonicalDocument } from "ai-jue-core";
import { confirm } from "../src/confirm";
import { read } from "../src/read";
import { write } from "../src/write";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures");

const SYNTHETIC_CANONICAL: CanonicalDocument = {
  context: { global: "Neutral shared context." },
  rules: {
    style: {
      description: "Neutral rule",
      alwaysApply: true,
      globs: ["src/**/*.ts"],
      content: "Use two spaces.",
      prompt: "Use two spaces.",
    },
  },
  commands: {
    review: {
      name: "review",
      description: "Neutral command",
      content: "Review the diff.",
      prompt: "Review the diff.",
    },
  },
  agents: {
    planner: {
      name: "planner",
      description: "Neutral agent",
      content: "Plan the work.",
      prompt: "Plan the work.",
    },
  },
  skills: {
    summarize: {
      name: "summarize",
      description: "Neutral skill",
      content: "Summarize the content.",
      prompt: "Summarize the content.",
    },
  },
  hooks: {
    PostToolUse: { matcher: "Edit", type: "command", script: "echo hook" },
  },
  mcp: {
    servers: {
      demo: { command: "node", args: ["server.js"], type: "stdio", env: { TOKEN: "${DEMO_TOKEN}" } },
    },
  },
};

const PLUGIN_MANIFEST = {
  name: "jue-fixture-demo",
  version: "1.0.0",
  description: "Neutral Cursor plugin fixture.",
  author: { name: "ai-jue fixtures" },
  variables: {
    type: "object",
    properties: {
      DEMO_TOKEN: {
        type: "string",
        title: "Demo token",
        description: "Bearer token for the demo MCP server.",
      },
    },
    required: ["DEMO_TOKEN"],
  },
};

defineAdapterContractSuite({
  testApi: { describe, expect, it },
  adapter: { target: "cursor", read, write },
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
    {
      name: "cursor-settings-unrelated-key",
      relativePath: path.join(".cursor", "settings.json"),
      seedContent: JSON.stringify({ unrelatedSetting: "kept" }, null, 2),
      assertPreserved: (finalContent) => {
        const settings = JSON.parse(finalContent);
        if (settings.unrelatedSetting !== "kept") {
          throw new Error("unrelated settings key was not preserved");
        }
      },
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
        pluginManifest: PLUGIN_MANIFEST,
      },
      confirmNatively: async (root) => {
        const result = await confirm([], { scope: "project", artifactRoot: root, artifactKind: "plugin" });
        if (result.status !== "unconfirmed" || !result.evidence?.includes("manifest.name=jue-fixture-demo")) {
          throw new Error(`expected structural unconfirmed evidence, got ${JSON.stringify(result)}`);
        }
      },
    },
    {
      name: "plugin-minimal",
      root: path.join(FIXTURES_ROOT, "plugin-minimal"),
      writeContext: {
        artifactKind: "plugin",
        pluginManifest: {
          name: "jue-fixture-minimal",
          version: "0.1.0",
          description: "Minimal Cursor plugin fixture.",
        },
      },
    },
  ],
});
