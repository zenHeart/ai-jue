#!/usr/bin/env node
/**
 * JUE-109 native usability verification for the Claude Code Reference
 * Extension. Not part of `npm test`: the headless invocation step makes a
 * real, billed model call, so it must be run deliberately, not on every test
 * run.
 *
 * Usage:
 *   node scripts/verify-claude-native.js [outputDir]
 *
 * The fixture-generation, `claude plugin validate`, and rollback steps need
 * no auth and no network call. The headless invocation step needs Claude
 * Code to be able to authenticate in `--bare` mode, which strictly requires
 * either `ANTHROPIC_API_KEY` or an `apiKeyHelper` via `--settings` (OAuth and
 * the OS keychain are never read in `--bare` mode) — set `ANTHROPIC_BASE_URL`
 * plus `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY` in the environment before
 * running this script for any Anthropic-API-compatible backend (this only
 * exercises Claude Code's own Plugin/Extension mechanism, so which model
 * answers the deterministic prompt does not matter). Without one of those,
 * this script still runs the free steps and reports the invocation step as
 * skipped rather than failing.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");

function loadClaudeAdapterDist() {
  return {
    write: require(path.join(repoRoot, "packages/ai-jue-adapter-claude/dist/write.js")).write,
    core: require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js")),
  };
}

const CANONICAL = {
  commands: {
    status: {
      description: "Neutral JUE-109 native-verification command",
      content: "Respond with exactly this text and nothing else: JUE-109-OK. Do not call any tools.",
    },
  },
};

const PLUGIN_MANIFEST = {
  name: "jue-109-verify",
  version: "1.0.0",
  description: "Neutral fixture Plugin for JUE-109 native headless verification.",
  author: { name: "ai-jue fixtures" },
};

function runClaude(args, options = {}) {
  return spawnSync("claude", args, { encoding: "utf8", ...options });
}

async function buildFixture(root) {
  const { write, core } = loadClaudeAdapterDist();
  fs.mkdirSync(root, { recursive: true });
  const changes = await write(CANONICAL, {
    projectRoot: root,
    artifactKind: "plugin",
    pluginManifest: PLUGIN_MANIFEST,
  });
  core.applyChangesOrThrow(root, changes);
  return core;
}

function validatePlugin(root) {
  const result = runClaude(["plugin", "validate", root, "--strict"]);
  if (result.status !== 0 || !result.stdout.includes("Validation passed")) {
    throw new Error(`claude plugin validate failed:\n${result.stdout}\n${result.stderr}`);
  }
  console.log("[1/3] claude plugin validate --strict: passed");
}

/** Forces a real mid-batch write failure and proves Core rolls every already-applied change in that batch back, then re-validates the fixture natively to prove it is uncorrupted. */
function proveRollback(root, core) {
  const beforeStatus = fs.readFileSync(path.join(root, "commands/status.md"), "utf8");
  const beforeManifest = fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8");

  fs.writeFileSync(path.join(root, "hooks"), "not a directory");
  const changes = [
    {
      target: "claude-code",
      kind: "create",
      ownership: "full",
      scope: "project",
      path: "commands/extra.md",
      beforeHash: null,
      afterHash: core.hashArtifactContent("---\ndescription: forced\n---\n\nunused"),
      content: "---\ndescription: forced\n---\n\nunused",
      risk: "low",
      requiresApproval: false,
      atomicState: "planned",
    },
    {
      target: "claude-code",
      kind: "create",
      ownership: "merged-keys",
      scope: "project",
      path: "hooks/hooks.json",
      beforeHash: null,
      afterHash: core.hashArtifactContent("{}"),
      content: "{}",
      risk: "low",
      requiresApproval: false,
      atomicState: "planned",
    },
  ];

  const result = core.applyExecution(root, changes);
  fs.rmSync(path.join(root, "hooks"), { force: true });

  if (result.status !== "rolled-back") {
    throw new Error(`expected rollback, got status "${result.status}"`);
  }
  if (fs.existsSync(path.join(root, "commands/extra.md"))) {
    throw new Error("rollback did not remove the already-applied change in this batch");
  }
  if (fs.readFileSync(path.join(root, "commands/status.md"), "utf8") !== beforeStatus) {
    throw new Error("rollback corrupted an unrelated file");
  }
  if (fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8") !== beforeManifest) {
    throw new Error("rollback corrupted the Plugin manifest");
  }

  const revalidate = runClaude(["plugin", "validate", root, "--strict"]);
  if (revalidate.status !== 0 || !revalidate.stdout.includes("Validation passed")) {
    throw new Error(`fixture failed native validation after rollback:\n${revalidate.stdout}`);
  }
  console.log("[2/3] mid-batch failure rolled back and re-validated natively: passed");
}

function hasBareAuth() {
  return Boolean(process.env.ANTHROPIC_API_KEY || (process.env.ANTHROPIC_BASE_URL && process.env.ANTHROPIC_AUTH_TOKEN));
}

function invokeHeadless(root) {
  if (!hasBareAuth()) {
    console.log(
      "[3/3] headless invocation SKIPPED: --bare requires ANTHROPIC_API_KEY, or " +
        "ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN for an Anthropic-API-compatible " +
        "backend (OAuth/keychain are never read in --bare mode). Set one of those " +
        "and rerun to complete this step.",
    );
    return;
  }
  const result = runClaude(
    [
      "--bare",
      "-p",
      "/jue-109-verify:status",
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

  if (!init || !init.plugins.some((p) => p.name === "jue-109-verify")) {
    throw new Error("generated Plugin did not appear in system/init's plugins inventory");
  }
  if (init.plugin_errors && init.plugin_errors.length > 0) {
    throw new Error(`plugin_errors was non-empty: ${JSON.stringify(init.plugin_errors)}`);
  }
  if (!init.slash_commands.includes("jue-109-verify:status")) {
    throw new Error("generated command did not appear in system/init's slash_commands inventory");
  }
  if (final.type !== "result" || final.is_error || final.result !== "JUE-109-OK") {
    throw new Error(`headless invocation did not produce the expected marker: ${JSON.stringify(final)}`);
  }
  console.log(
    `[3/3] headless invocation: passed (plugin discovered, command invoked, ` +
      `real cost $${final.total_cost_usd})`,
  );
}

async function main() {
  const root = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "jue-109-verify-"));
  const core = await buildFixture(root);
  validatePlugin(root);
  proveRollback(root, core);
  invokeHeadless(root);
  console.log(`\nJUE-109 verification fixture left at: ${root}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
