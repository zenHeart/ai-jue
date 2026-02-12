const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function assertFile(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message || `Missing file: ${filePath}`);
  }
}

function main() {
  run("npm", ["run", "build"]);
  run("npm", ["test", "--", "packages/ai-jue/test/config.test.ts"]);
  run("npm", ["run", "docs:build"]);
  run("node", ["scripts/check-consistency.js"]);
  run("node", ["scripts/check-base-i18n.js"]);
  run("node", ["scripts/smoke-apply.js"]);

  assertFile(path.resolve(__dirname, "../release-note.md"), "Missing release-note.md");
  assertFile(
    path.resolve(__dirname, "../packages/ai-jue/CHANGELOG.md"),
    "Missing packages/ai-jue/CHANGELOG.md",
  );

  console.log("v1.1.x release gate checks passed.");
}

main();
