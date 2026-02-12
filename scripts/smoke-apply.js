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

  const result = spawnSync(process.execPath, [cliPath, "apply"], {
    cwd: tmpDir,
    env,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `Smoke apply failed for preset "${preset}":\n${result.stdout}\n${result.stderr}`,
    );
  }

  const requiredOutputs = [
    "CLAUDE.md",
    "GEMINI.md",
    ".cursor/rules/agents.mdc",
    path.join(".gemini", "settings.json"),
    path.join(".github", "copilot-instructions.md"),
  ];

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

function main() {
  runApplySmoke("base");
  runApplySmoke("internal");
  console.log("Smoke apply checks passed for base/internal presets.");
}

main();
