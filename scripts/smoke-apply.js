const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(repoRoot, "packages", "ai-jue", "dist", "cli.js");
const nodeModulesPath = path.join(repoRoot, "node_modules");

function runApplySmoke(preset) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `ai-jue-smoke-${preset}-`));
  const configFile = path.join(tmpDir, "ai.config.js");
  fs.writeFileSync(configFile, `module.exports = { preset: "${preset}", language: "en" };\n`);

  fs.symlinkSync(path.join(repoRoot, "packages"), path.join(tmpDir, "packages"), "dir");
  fs.symlinkSync(path.join(repoRoot, "node_modules"), path.join(tmpDir, "node_modules"), "dir");

  const env = {
    ...process.env,
    NODE_PATH: process.env.NODE_PATH
      ? `${nodeModulesPath}${path.delimiter}${process.env.NODE_PATH}`
      : nodeModulesPath,
  };

  const result = spawnSync(process.execPath, [cliPath, "apply", "--all"], {
    cwd: tmpDir,
    env,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `Smoke apply failed for preset "${preset}":\n${result.stdout}\n${result.stderr}`,
    );
  }

  const requiredOutputs = ["AGENTS.md", "CLAUDE.md"];

  if (preset === "base") {
    requiredOutputs.push(path.join(".cursor", "commands", "explain.md"));
  }
  if (preset === "internal") {
    requiredOutputs.push(path.join(".cursor", "commands", "repo-governance.md"));
  }

  const missing = requiredOutputs.filter((file) => !fs.existsSync(path.join(tmpDir, file)));
  if (missing.length > 0) {
    throw new Error(
      `Smoke apply missing outputs for preset "${preset}": ${missing.join(", ")}`,
    );
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

/**
 * Exercises the real `jue apply` CLI (not just vitest) for a `write()`-
 * capable Adapter's `--dry-run`/`--check`/apply/second-apply behavior, per
 * JUE-108's acceptance bar: zero-write preview, read-only check with stable
 * exit codes, and a zero-diff second apply. Drift-conflict blocking itself
 * is proven at the engine level (`core-executor.test.ts`) by constructing an
 * ArtifactChange against a tampered file directly — within a single `jue
 * apply` invocation, `write()` always recomputes `beforeHash` from the
 * disk state it just read immediately before `applyExecution` checks it
 * again, so there is no real time gap for external drift to land in.
 */
function runCoreExecutorSmoke() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-jue-smoke-core-executor-"));
  const configFile = path.join(tmpDir, "ai.config.js");
  fs.writeFileSync(configFile, `module.exports = { preset: "internal", language: "en" };\n`);

  fs.symlinkSync(path.join(repoRoot, "packages"), path.join(tmpDir, "packages"), "dir");
  fs.symlinkSync(path.join(repoRoot, "node_modules"), path.join(tmpDir, "node_modules"), "dir");

  const env = {
    ...process.env,
    NODE_PATH: process.env.NODE_PATH
      ? `${nodeModulesPath}${path.delimiter}${process.env.NODE_PATH}`
      : nodeModulesPath,
  };
  const run = (args) =>
    spawnSync(process.execPath, [cliPath, ...args], { cwd: tmpDir, env, encoding: "utf8" });
  const claudeMdPath = path.join(tmpDir, "CLAUDE.md");

  const dryRun = run(["apply", "--adapter", "claude", "--dry-run"]);
  if (dryRun.status !== 0) {
    throw new Error(`--dry-run should exit 0:\n${dryRun.stdout}\n${dryRun.stderr}`);
  }
  if (fs.existsSync(claudeMdPath)) {
    throw new Error("--dry-run must be zero-write, but CLAUDE.md was created");
  }

  const checkBefore = run(["apply", "--adapter", "claude", "--check"]);
  if (checkBefore.status !== 3) {
    throw new Error(
      `--check on an unapplied project should exit 3 (pending changes), got ${checkBefore.status}:\n${checkBefore.stdout}`,
    );
  }
  if (fs.existsSync(claudeMdPath)) {
    throw new Error("--check must be zero-write, but CLAUDE.md was created");
  }

  const apply = run(["apply", "--adapter", "claude"]);
  if (apply.status !== 0) {
    throw new Error(`apply should exit 0:\n${apply.stdout}\n${apply.stderr}`);
  }
  if (!fs.existsSync(claudeMdPath)) {
    throw new Error("apply did not write CLAUDE.md");
  }

  const checkAfter = run(["apply", "--adapter", "claude", "--check"]);
  if (checkAfter.status !== 0) {
    throw new Error(
      `--check after a clean apply should exit 0 (no-change), got ${checkAfter.status}:\n${checkAfter.stdout}`,
    );
  }

  const mtimeBeforeSecondApply = fs.statSync(claudeMdPath).mtimeMs;
  const secondApply = run(["apply", "--adapter", "claude"]);
  if (secondApply.status !== 0) {
    throw new Error(`second apply should exit 0:\n${secondApply.stdout}\n${secondApply.stderr}`);
  }
  if (fs.statSync(claudeMdPath).mtimeMs !== mtimeBeforeSecondApply) {
    throw new Error("second apply rewrote CLAUDE.md; it must be a zero-diff no-op");
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function main() {
  runApplySmoke("base");
  runApplySmoke("internal");
  console.log("Smoke apply checks passed for base/internal presets.");

  runCoreExecutorSmoke();
  console.log("Core executor (--dry-run/--check/apply/second-apply) smoke checks passed.");
}

main();
