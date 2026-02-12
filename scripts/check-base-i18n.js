const fs = require("fs");
const path = require("path");

const baseDir = path.resolve(__dirname, "../packages/jue-preset-base");
const commandsDir = path.join(baseDir, "commands");

function assertFile(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message || `Missing file: ${filePath}`);
  }
}

function main() {
  assertFile(path.join(baseDir, "AGENTS.md"), "Missing base AGENTS.md");
  assertFile(path.join(baseDir, "AGENTS.en.md"), "Missing base AGENTS.en.md");

  const commandDirs = fs
    .readdirSync(commandsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (commandDirs.length === 0) {
    throw new Error("No command directories found in jue-preset-base/commands");
  }

  for (const name of commandDirs) {
    const dir = path.join(commandsDir, name);
    assertFile(path.join(dir, "index.json"), `Missing index.json for command: ${name}`);
    assertFile(path.join(dir, "prompt.md"), `Missing prompt.md for command: ${name}`);
    assertFile(path.join(dir, "prompt.en.md"), `Missing prompt.en.md for command: ${name}`);
  }

  console.log("jue-preset-base i18n structure checks passed.");
}

main();
