import path from "path";
import { describe, expect, it } from "vitest";
import { defineAdapterContractSuite } from "ai-jue-core/testkit";
import type { CanonicalDocument } from "ai-jue-core";
import { read } from "../src/read";
import { write } from "../src/write";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures");

const SYNTHETIC_CANONICAL: CanonicalDocument = {
  context: { global: "Neutral Hermes fixture context." },
  // OpenClaw has no per-workspace agents directory; the single-agent
  // runtime reads config.yaml. We omit `agents` to match the
  // honest-degraded round-trip (no-op write).
  // OpenClaw has no per-workspace hooks/ (the real ~/.hermes/hooks/ is
  // empty on the install). Omit `hooks`.
  // OpenClaw has no per-workspace commands/ (the commands: block in
  // config.yaml is runtime policy). Omit `commands`.
  // mcp is supported; this is a smoke fixture: server name "demo-mcp"
  // must round-trip.
  mcp: {
    servers: {
      "demo-mcp": { command: "node", args: ["server.js"], env: { TOKEN: "${DEMO_TOKEN}" } },
    },
  },
  // skills are 3-level: <cat>/<name>. Use "jue-303-fixture/demo".
  skills: {
    "jue-303-fixture/demo": {
      name: "demo-fixture",
      description: "Neutral fixture skill for the Hermes Adapter (JUE-303)",
      content: "Demo skill body.",
      prompt: "Demo skill body.",
    },
  },
  // cron is a full-file pass-through.
  cron: {
    "demo-job": {
      name: "demo-fixture-job",
      prompt: "cd /tmp && echo demo",
      schedule: "0 12 * * *",
      repeat: 1,
      deliver: "origin",
      enabled: true,
      skills: [],
      created_at: "2026-07-26T00:00:00",
    },
  },
};

defineAdapterContractSuite({
  testApi: { describe, expect, it },
  adapter: { target: "hermes", read, write },
  syntheticCanonical: SYNTHETIC_CANONICAL,
  unmanagedFieldCases: [
    {
      name: "MEMORY.md unrelated user prose",
      relativePath: "MEMORY.md",
      seedContent: "User-authored notes outside any managed block.",
      assertPreserved: (finalContent) => {
        if (!finalContent.includes("User-authored notes outside any managed block.")) {
          throw new Error("user prose in MEMORY.md was not preserved");
        }
      },
    },
  ],
  securityRejectionCases: [
    {
      name: "literal secret in MCP server env",
      root: path.join(FIXTURES_ROOT, "failures", "sensitive-mcp"),
      expectedErrorSubstring: "must reference a runtime environment variable",
    },
  ],
  nativeFixtures: [
    {
      name: "workspace",
      root: path.join(FIXTURES_ROOT, "project"),
      // Native confirmation via the real Hermes `tirith config
      // validate` binary (D:\devuser\.hermes\bin\tirith, 9.8MB) is
      // out-of-suite per the same openclaw-spawnSync quirk discovered
      // in JUE-302; the standalone
      // scripts/verify-hermes-native.js drives the round-trip in a
      // normal shell context where it works.
    },
  ],
});
