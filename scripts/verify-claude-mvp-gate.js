#!/usr/bin/env node
/**
 * JUE-110 Claude MVP Gate: one command replays the full R1 loop —
 *   native fixture -> read() -> Canonical (schema-checked)
 *   -> write() -> Artifact, in a fresh clean directory
 *   -> Core apply
 *   -> native `claude plugin validate --strict`
 *   -> read() again -> Canonical' (equivalence contract)
 *   -> headless invocation of a generated capability, with real discovery
 *      and invocation confirmed from `system/init` and the final `result`.
 *
 * Not part of `npm test`: the headless step makes a real, billed model call
 * (see scripts/verify-claude-native.js for why `--bare` needs it and how to
 * supply auth). The other steps need no auth or network call and always run.
 *
 * Usage: node scripts/verify-claude-mvp-gate.js [outputDir]
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("assert");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const nativeFixture = path.join(repoRoot, "packages/ai-jue-adapter-claude/fixtures/project");

function loadClaudeAdapterDist() {
  return {
    read: require(path.join(repoRoot, "packages/ai-jue-adapter-claude/dist/read.js")).read,
    write: require(path.join(repoRoot, "packages/ai-jue-adapter-claude/dist/write.js")).write,
    core: require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js")),
  };
}

const PROBE_COMMAND_NAME = "mvpGateProbe";
const PROBE_MARKER = "JUE-110-MVP-GATE-OK";

function runClaude(args, options = {}) {
  return spawnSync("claude", args, { encoding: "utf8", ...options });
}

function validatePlugin(root) {
  const result = runClaude(["plugin", "validate", root, "--strict"]);
  if (result.status !== 0 || !result.stdout.includes("Validation passed")) {
    throw new Error(`claude plugin validate failed:\n${result.stdout}\n${result.stderr}`);
  }
}

function hasBareAuth() {
  return Boolean(
    process.env.ANTHROPIC_API_KEY || (process.env.ANTHROPIC_BASE_URL && process.env.ANTHROPIC_AUTH_TOKEN),
  );
}

function invokeHeadless(root, pluginName) {
  if (!hasBareAuth()) {
    console.log(
      "[6/6] headless invocation SKIPPED: --bare requires ANTHROPIC_API_KEY, or " +
        "ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN for an Anthropic-API-compatible " +
        "backend. Set one of those and rerun to complete this step.",
    );
    return;
  }
  const result = runClaude(
    [
      "--bare",
      "-p",
      `/${pluginName}:${PROBE_COMMAND_NAME}`,
      "--plugin-dir",
      root,
      "--output-format",
      "stream-json",
      "--verbose",
      "--allowedTools",
      "",
    ],
    { cwd: os.tmpdir() },
  );
  const lines = result.stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const init = lines.find((line) => line.type === "system" && line.subtype === "init");
  const final = lines[lines.length - 1];

  if (!init || !init.plugins.some((p) => p.name === pluginName)) {
    throw new Error("generated Plugin did not appear in system/init's plugins inventory");
  }
  if (init.plugin_errors && init.plugin_errors.length > 0) {
    throw new Error(`plugin_errors was non-empty: ${JSON.stringify(init.plugin_errors)}`);
  }
  if (!init.slash_commands.includes(`${pluginName}:${PROBE_COMMAND_NAME}`)) {
    throw new Error("probe command did not appear in system/init's slash_commands inventory");
  }
  if (final.type !== "result" || final.is_error || final.result !== PROBE_MARKER) {
    throw new Error(`headless invocation did not produce the expected marker: ${JSON.stringify(final)}`);
  }
  console.log(
    `[6/6] headless invocation: passed (Plugin discovered, probe command invoked, ` +
      `real cost $${final.total_cost_usd})`,
  );
}

async function main() {
  const { read, write, core } = loadClaudeAdapterDist();
  const root = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "jue-110-mvp-gate-"));
  fs.mkdirSync(root, { recursive: true });

  const canonical = await read({ projectRoot: nativeFixture });
  core.CanonicalDocumentSchema.parse(canonical);
  console.log("[1/6] read(native fixture) -> Canonical, schema-checked: passed");

  // `context.global` is project-only: Claude Code Plugins have no
  // CLAUDE.md-equivalent mechanism, so `write()` never emits it for
  // `artifactKind: "plugin"` (consistent with the `plugin/` fixture's own
  // coverage matrix in fixtures/README.md, which never claims context
  // coverage). The `project/` native fixture used as input here does carry
  // `context.global` since it is a project fixture; drop it before
  // converting to a Plugin so this replay's equivalence check (step 4)
  // compares against what a Plugin can actually carry, not a capability the
  // target Artifact kind cannot represent.
  const { context: _projectOnlyContext, ...canonicalForPlugin } = canonical;

  // A real fixture's own commands need arguments/tools to behave meaningfully;
  // add one purpose-built, tool-free, deterministic command so the live
  // invocation step (step 6) has something safe and unambiguous to check —
  // same precedent as JUE-109 — without altering any of the fixture's real
  // capabilities used for the equivalence check in step 4. `prompt` mirrors
  // `content` to match the shape read() always produces (see
  // write.test.ts's CANONICAL_FIXTURE).
  const canonicalWithProbe = {
    ...canonicalForPlugin,
    commands: {
      ...canonicalForPlugin.commands,
      [PROBE_COMMAND_NAME]: {
        description: "JUE-110 MVP Gate deterministic invocation probe",
        content: `Respond with exactly this text and nothing else: ${PROBE_MARKER}. Do not call any tools.`,
        prompt: `Respond with exactly this text and nothing else: ${PROBE_MARKER}. Do not call any tools.`,
      },
    },
  };

  const pluginManifest = {
    name: "jue-110-mvp-gate",
    version: "1.0.0",
    description: "JUE-110 MVP Gate replay of the real project/ native fixture as a Plugin.",
    author: { name: "ai-jue fixtures" },
  };
  const changes = await write(canonicalWithProbe, {
    projectRoot: root,
    artifactKind: "plugin",
    pluginManifest,
  });
  core.applyChangesOrThrow(root, changes);
  console.log(`[2/6] write(Canonical) -> Artifact, applied (${changes.length} files): passed`);

  validatePlugin(root);
  console.log("[3/6] claude plugin validate --strict: passed");

  const roundTripped = await read({ projectRoot: root });
  assert.deepStrictEqual(roundTripped, canonicalWithProbe);
  console.log("[4/6] read(write(Canonical)) equals Canonical (equivalence contract): passed");

  const second = await write(canonicalWithProbe, { projectRoot: root, artifactKind: "plugin", pluginManifest });
  assert.deepStrictEqual(second, []);
  console.log("[5/6] second apply of the same Canonical produces zero changes (idempotent): passed");

  invokeHeadless(root, pluginManifest.name);

  console.log(`\nJUE-110 MVP Gate replay fixture left at: ${root}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
